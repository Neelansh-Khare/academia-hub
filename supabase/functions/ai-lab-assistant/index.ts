import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================
// API Integration Functions
// ============================================

interface Paper {
  title: string;
  authors: string[];
  url: string;
  abstract: string;
  year: number;
  citationCount?: number;
  venue?: string;
  source: 'semantic_scholar' | 'arxiv';
}

interface Dataset {
  name: string;
  description: string;
  url: string;
  downloads?: number;
  likes?: number;
}

interface ProjectIdea {
  title: string;
  description: string;
  methodology?: string;
}

interface PaperSection {
  title: string;
  description: string;
}

interface Library {
  name: string;
  description: string;
  url: string;
}

// Semantic Scholar API - Task 2.1
async function searchSemanticScholar(query: string, limit: number = 10): Promise<Paper[]> {
  console.log(`Searching Semantic Scholar for: ${query}`);

  try {
    const encodedQuery = encodeURIComponent(query);
    const fields = 'title,authors,abstract,year,citationCount,venue,url,externalIds';
    const response = await fetch(
      `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodedQuery}&limit=${limit}&fields=${fields}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(`Semantic Scholar API error: ${response.status}`);
      return [];
    }

    const data = await response.json();

    if (!data.data || !Array.isArray(data.data)) {
      return [];
    }

    return data.data.map((paper: any) => ({
      title: paper.title || 'Untitled',
      authors: paper.authors?.map((a: any) => a.name) || [],
      url: paper.url || (paper.externalIds?.DOI ? `https://doi.org/${paper.externalIds.DOI}` : ''),
      abstract: paper.abstract || '',
      year: paper.year || 0,
      citationCount: paper.citationCount || 0,
      venue: paper.venue || '',
      source: 'semantic_scholar' as const,
    }));
  } catch (error) {
    console.error('Semantic Scholar search error:', error);
    return [];
  }
}

// arXiv API - Task 2.2
async function searchArxiv(query: string, limit: number = 10): Promise<Paper[]> {
  console.log(`Searching arXiv for: ${query}`);

  try {
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(
      `https://export.arxiv.org/api/query?search_query=all:${encodedQuery}&start=0&max_results=${limit}&sortBy=relevance&sortOrder=descending`
    );

    if (!response.ok) {
      console.error(`arXiv API error: ${response.status}`);
      return [];
    }

    const xmlText = await response.text();

    // Parse XML response (basic parsing without external libraries)
    const papers: Paper[] = [];
    const entries = xmlText.split('<entry>').slice(1);

    for (const entry of entries) {
      const getTag = (tag: string): string => {
        const match = entry.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
        return match ? match[1].trim() : '';
      };

      const title = getTag('title').replace(/\s+/g, ' ');
      const abstract = getTag('summary').replace(/\s+/g, ' ');
      const published = getTag('published');
      const year = published ? parseInt(published.substring(0, 4)) : 0;

      // Get authors
      const authorMatches = entry.matchAll(/<author>\s*<name>([^<]+)<\/name>/g);
      const authors = Array.from(authorMatches).map(m => m[1].trim());

      // Get arXiv link
      const linkMatch = entry.match(/href="(https:\/\/arxiv\.org\/abs\/[^"]+)"/);
      const url = linkMatch ? linkMatch[1] : '';

      if (title && url) {
        papers.push({
          title,
          authors,
          url,
          abstract,
          year,
          source: 'arxiv' as const,
        });
      }
    }

    return papers;
  } catch (error) {
    console.error('arXiv search error:', error);
    return [];
  }
}

// HuggingFace Datasets API - Task 2.3
async function searchHuggingFaceDatasets(query: string, limit: number = 10): Promise<Dataset[]> {
  console.log(`Searching HuggingFace Datasets for: ${query}`);

  try {
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(
      `https://huggingface.co/api/datasets?search=${encodedQuery}&limit=${limit}&sort=downloads&direction=-1`
    );

    if (!response.ok) {
      console.error(`HuggingFace API error: ${response.status}`);
      return [];
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((dataset: any) => ({
      name: dataset.id || 'Unknown',
      description: dataset.description || dataset.cardData?.description || `Dataset for ${query}`,
      url: `https://huggingface.co/datasets/${dataset.id}`,
      downloads: dataset.downloads || 0,
      likes: dataset.likes || 0,
    }));
  } catch (error) {
    console.error('HuggingFace search error:', error);
    return [];
  }
}

// Deduplicate papers by title similarity
function deduplicatePapers(papers: Paper[]): Paper[] {
  const seen = new Map<string, Paper>();

  for (const paper of papers) {
    // Normalize title for comparison
    const normalizedTitle = paper.title.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (!seen.has(normalizedTitle)) {
      seen.set(normalizedTitle, paper);
    } else {
      // Keep the one with more info (prefer Semantic Scholar for citations)
      const existing = seen.get(normalizedTitle)!;
      if (paper.citationCount && (!existing.citationCount || paper.citationCount > existing.citationCount)) {
        seen.set(normalizedTitle, paper);
      }
    }
  }

  return Array.from(seen.values());
}

// Generate project ideas and outline using LLM - Task 2.4
async function generateProjectIdeasAndOutline(
  prompt: string,
  papers: Paper[],
  datasets: Dataset[],
  apiKey: string
): Promise<{ project_ideas: ProjectIdea[]; outline: { sections: PaperSection[] }; libraries: Library[] }> {
  console.log('Generating project ideas and outline with LLM');

  const paperSummaries = papers.slice(0, 5).map(p =>
    `- "${p.title}" (${p.year}): ${p.abstract?.substring(0, 200)}...`
  ).join('\n');

  const datasetSummaries = datasets.slice(0, 5).map(d =>
    `- ${d.name}: ${d.description?.substring(0, 100)}...`
  ).join('\n');

  const systemPrompt = `You are a research advisor helping generate project ideas and paper outlines. You must respond with valid JSON only, no markdown or explanations.`;

  const userPrompt = `Based on the research topic: "${prompt}"

Here are relevant papers found:
${paperSummaries || 'No papers found yet.'}

Here are relevant datasets:
${datasetSummaries || 'No specific datasets found.'}

Generate a JSON response with:
1. "project_ideas": Array of 3-4 specific, actionable research project ideas. Each should have:
   - "title": A concise project title
   - "description": A detailed description (2-3 sentences) explaining the approach, expected outcomes, and why it's novel
   - "methodology": Brief methodology suggestion

2. "outline": A paper outline with "sections" array containing 6-8 sections. Each section has:
   - "title": Section title (e.g., "Introduction", "Related Work", etc.)
   - "description": What this section should cover (1-2 sentences)

3. "libraries": Array of 4-6 relevant Python/ML libraries and tools. Each should have:
   - "name": Library name
   - "description": Brief description of what it does and why it's useful for this research
   - "url": GitHub or documentation URL

Respond ONLY with valid JSON, no markdown code blocks.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      console.error(`OpenAI API error: ${response.status}`);
      throw new Error('OpenAI API error');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Clean up response - remove markdown code blocks if present
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.slice(7);
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.slice(3);
    }
    if (jsonContent.endsWith('```')) {
      jsonContent = jsonContent.slice(0, -3);
    }
    jsonContent = jsonContent.trim();

    const parsed = JSON.parse(jsonContent);

    return {
      project_ideas: parsed.project_ideas || [],
      outline: parsed.outline || { sections: [] },
      libraries: parsed.libraries || [],
    };
  } catch (error) {
    console.error('LLM generation error:', error);
    // Return default structure on error
    return {
      project_ideas: [
        {
          title: `Novel Approach to ${prompt}`,
          description: `Explore innovative methods combining recent advances in the field. Focus on addressing current limitations identified in the literature.`,
          methodology: 'Literature review, prototype development, empirical evaluation',
        },
        {
          title: `Benchmark Study for ${prompt}`,
          description: `Create a comprehensive benchmark comparing existing approaches. Identify gaps and propose improvements.`,
          methodology: 'Systematic comparison, statistical analysis, ablation studies',
        },
      ],
      outline: {
        sections: [
          { title: 'Introduction', description: 'Background, motivation, and research questions' },
          { title: 'Related Work', description: 'Survey of existing approaches and their limitations' },
          { title: 'Methodology', description: 'Proposed approach and technical details' },
          { title: 'Experiments', description: 'Experimental setup, datasets, and evaluation metrics' },
          { title: 'Results', description: 'Quantitative and qualitative results' },
          { title: 'Discussion', description: 'Analysis of findings and implications' },
          { title: 'Conclusion', description: 'Summary and future directions' },
        ],
      },
      libraries: [
        { name: 'PyTorch', description: 'Deep learning framework for building neural networks', url: 'https://pytorch.org' },
        { name: 'Hugging Face Transformers', description: 'State-of-the-art NLP models and tools', url: 'https://huggingface.co/transformers' },
        { name: 'scikit-learn', description: 'Machine learning library for classical algorithms', url: 'https://scikit-learn.org' },
      ],
    };
  }
}

// ============================================
// Main Research Assistant Handler
// ============================================

async function handleResearchAssistant(prompt: string, apiKey: string) {
  console.log(`Research Assistant processing: ${prompt}`);

  // Run API calls in parallel for better performance
  const [semanticScholarPapers, arxivPapers, datasets] = await Promise.all([
    searchSemanticScholar(prompt, 10),
    searchArxiv(prompt, 10),
    searchHuggingFaceDatasets(prompt, 10),
  ]);

  console.log(`Found ${semanticScholarPapers.length} Semantic Scholar papers`);
  console.log(`Found ${arxivPapers.length} arXiv papers`);
  console.log(`Found ${datasets.length} datasets`);

  // Combine and deduplicate papers
  const allPapers = [...semanticScholarPapers, ...arxivPapers];
  const uniquePapers = deduplicatePapers(allPapers);

  // Sort by citation count (if available) and year
  uniquePapers.sort((a, b) => {
    if (a.citationCount && b.citationCount) {
      return b.citationCount - a.citationCount;
    }
    return (b.year || 0) - (a.year || 0);
  });

  // Take top 10 papers
  const topPapers = uniquePapers.slice(0, 10);

  // Generate project ideas, outline, and library recommendations
  const { project_ideas, outline, libraries } = await generateProjectIdeasAndOutline(
    prompt,
    topPapers,
    datasets,
    apiKey
  );

  // Format papers for frontend
  const formattedPapers = topPapers.map(p => ({
    title: p.title,
    authors: p.authors,
    url: p.url,
    abstract: p.abstract,
    year: p.year,
    citationCount: p.citationCount,
    venue: p.venue,
  }));

  // Format datasets for frontend
  const formattedDatasets = datasets.slice(0, 10).map(d => ({
    name: d.name,
    description: d.description,
    url: d.url,
  }));

  return {
    topic: prompt,
    papers: formattedPapers,
    project_ideas,
    outline,
    datasets: formattedDatasets,
    libraries,
  };
}

// ============================================
// Main Server Handler
// ============================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    // Handle research_assistant type requests
    if (body.type === 'research_assistant' && body.prompt) {
      console.log("Research Assistant invoked with prompt:", body.prompt);

      const result = await handleResearchAssistant(body.prompt, OPENAI_API_KEY);

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle regular chat messages (original functionality)
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      throw new Error("Messages array is required for chat mode");
    }

    console.log("AI Lab Assistant invoked with", messages.length, "messages");

    const systemPrompt = `You are an AI Lab Assistant for AcademiaLink, a professional network for academic research collaboration. Your role is to help researchers with:
- Finding and matching with relevant labs, RAships, and collaborations
- Crafting professional cold emails and outreach messages
- Discovering grant opportunities and funding sources
- Providing advice on academic career development
- Answering questions about research best practices

Be concise, professional, and actionable. Focus on concrete next steps the researcher can take.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 401) {
        return new Response(JSON.stringify({ error: "Invalid API key. Please check your OpenAI API key." }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("OpenAI API error:", response.status, text);
      return new Response(JSON.stringify({ error: "OpenAI API error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Error in ai-lab-assistant:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
