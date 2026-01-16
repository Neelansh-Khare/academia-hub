import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Publication {
  title: string;
  authors?: string[];
  venue?: string;
  year?: number;
  url?: string;
  doi?: string;
  abstract?: string;
  citation_count?: number;
  source: string;
  source_id?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { source, orcid_id, author_name, user_id } = await req.json();

    if (!user_id) {
      throw new Error("user_id is required");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let publications: Publication[] = [];

    if (source === "orcid" && orcid_id) {
      // Scrape from ORCID
      publications = await scrapeORCIDPublications(orcid_id);
    } else if (source === "semantic_scholar" && author_name) {
      // Scrape from Semantic Scholar
      const semanticScholarKey = Deno.env.get("SEMANTIC_SCHOLAR_API_KEY");
      publications = await scrapeSemanticScholarPublications(author_name, semanticScholarKey);
    } else {
      throw new Error("Invalid source or missing required parameters");
    }

    // Save publications to database
    const publicationsToInsert = publications.map((pub) => ({
      user_id,
      title: pub.title,
      authors: pub.authors || [],
      venue: pub.venue || null,
      year: pub.year || null,
      url: pub.url || null,
      doi: pub.doi || null,
      abstract: pub.abstract || null,
      citation_count: pub.citation_count || 0,
      source: pub.source,
      source_id: pub.source_id || null,
    }));

    // Insert publications, skipping duplicates based on title and source
    const { data: existingPubs, error: fetchError } = await supabase
      .from("publications")
      .select("title, source, source_id")
      .eq("user_id", user_id);

    if (fetchError) {
      console.error("Error fetching existing publications:", fetchError);
    }

    const existingKeys = new Set(
      (existingPubs || []).map((p) => `${p.title}_${p.source}_${p.source_id || ""}`)
    );

    const newPublications = publicationsToInsert.filter(
      (pub) => !existingKeys.has(`${pub.title}_${pub.source}_${pub.source_id || ""}`)
    );

    if (newPublications.length > 0) {
      const { error: insertError } = await supabase
        .from("publications")
        .insert(newPublications);

      if (insertError) {
        console.error("Error inserting publications:", insertError);
        throw insertError;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_found: publications.length,
        new_added: newPublications.length,
        publications: newPublications,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in scrape-publications:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function scrapeORCIDPublications(orcidId: string): Promise<Publication[]> {
  try {
    // Extract ORCID ID from URL if full URL is provided
    const cleanOrcidId = orcidId.replace(/https?:\/\/orcid\.org\//, "").replace(/\/$/, "");

    const url = `https://pub.orcid.org/v3.0/${cleanOrcidId}/works`;
    
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`ORCID API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const works = data.group || [];

    const publications: Publication[] = [];

    for (const workGroup of works) {
      const workSummary = workGroup["work-summary"]?.[0];
      if (!workSummary) continue;

      const title = workSummary.title?.title?.value || "Untitled";
      const year = workSummary["publication-date"]?.year?.value
        ? parseInt(workSummary["publication-date"].year.value)
        : undefined;
      
      const urlElement = workSummary.url?.value;
      const doi = workSummary["external-ids"]?.["external-id"]
        ?.find((id: any) => id["external-id-type"] === "doi")?.["external-id-value"];

      const externalIds = workSummary["external-ids"]?.["external-id"] || [];
      const putCode = workSummary["put-code"];

      publications.push({
        title,
        year,
        url: urlElement || (doi ? `https://doi.org/${doi}` : undefined),
        doi,
        source: "orcid",
        source_id: putCode?.toString(),
      });
    }

    return publications;
  } catch (error) {
    console.error("Error scraping ORCID:", error);
    throw error;
  }
}

async function scrapeSemanticScholarPublications(
  authorName: string,
  apiKey?: string
): Promise<Publication[]> {
  try {
    // Search for author first
    const searchUrl = `https://api.semanticscholar.org/graph/v1/author/search?query=${encodeURIComponent(
      authorName
    )}&limit=1`;

    const searchHeaders: HeadersInit = {
      Accept: "application/json",
    };
    if (apiKey) {
      searchHeaders["x-api-key"] = apiKey;
    }

    const searchResponse = await fetch(searchUrl, { headers: searchHeaders });

    if (!searchResponse.ok) {
      throw new Error(`Semantic Scholar search error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    const authors = searchData.data || [];

    if (authors.length === 0) {
      return [];
    }

    const authorId = authors[0].authorId;

    // Fetch author's papers
    const papersUrl = `https://api.semanticscholar.org/graph/v1/author/${authorId}/papers?fields=title,authors,year,url,abstract,citationCount,venue,externalIds&limit=100`;

    const papersResponse = await fetch(papersUrl, { headers: searchHeaders });

    if (!papersResponse.ok) {
      throw new Error(`Semantic Scholar papers error: ${papersResponse.status}`);
    }

    const papersData = await papersResponse.json();
    const papers = papersData.data || [];

    const publications: Publication[] = papers.map((paper: any) => ({
      title: paper.title || "Untitled",
      authors: paper.authors?.map((a: any) => a.name) || [],
      year: paper.year || undefined,
      url: paper.url || undefined,
      doi: paper.externalIds?.DOI || undefined,
      abstract: paper.abstract || undefined,
      citation_count: paper.citationCount || 0,
      venue: paper.venue || undefined,
      source: "semantic_scholar",
      source_id: paper.paperId,
    }));

    return publications;
  } catch (error) {
    console.error("Error scraping Semantic Scholar:", error);
    throw error;
  }
}
