import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Chunk size ~600 tokens (~2400 chars) for OpenAI embedding limit and context
const CHUNK_CHARS = 2400;
const OVERLAP_CHARS = 200;

function chunkText(text: string, pageNumber: number | null): { text: string; page_number: number | null }[] {
  const chunks: { text: string; page_number: number | null }[] = [];
  let start = 0;
  while (start < text.length) {
    let end = start + CHUNK_CHARS;
    if (end < text.length) {
      const nextSpace = text.lastIndexOf(" ", end);
      if (nextSpace > start) end = nextSpace + 1;
    }
    const slice = text.slice(start, end).trim();
    if (slice.length > 0) {
      chunks.push({ text: slice, page_number: pageNumber });
    }
    start = end - OVERLAP_CHARS;
    if (start >= text.length) break;
  }
  return chunks;
}

async function extractTextFromPdf(pdfUrl: string): Promise<{ fullText: string; pages: { pageNumber: number; text: string }[] }> {
  const res = await fetch(pdfUrl, { redirect: "follow" });
  if (!res.ok) throw new Error(`Failed to fetch PDF: ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();

  // pdfjs-dist via esm.sh - use default export for getDocument
  const pdfjsLib = await import("https://esm.sh/pdfjs-dist@3.11.174");
  const lib = pdfjsLib.default || pdfjsLib;
  if (lib.GlobalWorkerOptions) lib.GlobalWorkerOptions.workerSrc = "";

  const loadingTask = lib.getDocument({ data: arrayBuffer });
  const doc = await loadingTask.promise;
  const numPages = doc.numPages;
  const pages: { pageNumber: number; text: string }[] = [];
  let fullText = "";

  for (let i = 1; i <= numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = (content.items as { str?: string }[]).map((item) => item.str || "").join(" ");
    pages.push({ pageNumber: i, text });
    fullText += (fullText ? "\n\n" : "") + text;
  }

  return { fullText, pages };
}

function extractMetadataFromText(fullText: string): { title?: string; authors?: string[]; abstract?: string } {
  const firstChunk = fullText.slice(0, 3000);
  const lines = firstChunk.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  let title: string | undefined;
  let authors: string[] | undefined;
  let abstract: string | undefined;

  for (let i = 0; i < lines.length; i++) {
    if (!title && lines[i].length > 10 && lines[i].length < 250 && !/^\d/.test(lines[i])) {
      title = lines[i];
    }
    if (lines[i].toLowerCase().startsWith("abstract")) {
      abstract = lines.slice(i + 1).join(" ").slice(0, 1500);
      break;
    }
  }

  return { title, authors, abstract };
}

async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text.slice(0, 8191),
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("OpenAI embeddings error:", response.status, errText);
    throw new Error("OpenAI embeddings error");
  }

  const data = await response.json();
  const embedding = data.data?.[0]?.embedding;
  if (!Array.isArray(embedding)) throw new Error("Invalid embedding response");
  return embedding;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { paper_id } = await req.json();
    if (!paper_id) {
      return new Response(
        JSON.stringify({ error: "paper_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: paper, error: paperError } = await supabase
      .from("papers")
      .select("id, file_url, title, metadata, page_count")
      .eq("id", paper_id)
      .single();

    if (paperError || !paper) {
      return new Response(
        JSON.stringify({ error: "Paper not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fileUrl = paper.file_url;
    if (!fileUrl) {
      return new Response(
        JSON.stringify({ error: "Paper has no file_url" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Extracting text from PDF:", paper_id);
    const { fullText, pages } = await extractTextFromPdf(fileUrl);

    const metadata = extractMetadataFromText(fullText);
    const updateMeta: Record<string, unknown> = {
      ...(metadata.title && { title: metadata.title }),
      ...(metadata.abstract && { abstract: metadata.abstract }),
      ...(metadata.authors && { authors: metadata.authors }),
    };

    const pageCount = pages.length;
    const allChunks: { text: string; page_number: number | null }[] = [];
    for (const p of pages) {
      allChunks.push(...chunkText(p.text, p.pageNumber));
    }

    console.log(`Generated ${allChunks.length} chunks, fetching embeddings...`);

    const embeddings: number[][] = [];
    for (let i = 0; i < allChunks.length; i++) {
      const emb = await generateEmbedding(allChunks[i].text, OPENAI_API_KEY);
      embeddings.push(emb);
    }

    await supabase.from("paper_chunks").delete().eq("paper_id", paper_id);

    for (let i = 0; i < allChunks.length; i++) {
      const embeddingStr = `[${embeddings[i].join(",")}]`;
      await supabase.from("paper_chunks").insert({
        paper_id,
        chunk_index: i,
        chunk_text: allChunks[i].text,
        page_number: allChunks[i].page_number,
        embedding: embeddingStr,
      });
    }

    const metadataJson = paper.metadata && typeof paper.metadata === "object"
      ? { ...(paper.metadata as Record<string, unknown>), ...updateMeta }
      : updateMeta;

    await supabase
      .from("papers")
      .update({
        processed: true,
        page_count: pageCount,
        metadata: metadataJson,
        ...(metadata.title && { title: metadata.title }),
      })
      .eq("id", paper_id);

    return new Response(
      JSON.stringify({
        success: true,
        paper_id,
        chunks_count: allChunks.length,
        page_count: pageCount,
        metadata: updateMeta,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("process-paper error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
