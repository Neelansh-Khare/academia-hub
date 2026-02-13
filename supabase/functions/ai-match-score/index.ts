import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profileFields, postFields } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    console.log("Computing match score for profile and post");

    // 1. Calculate Keyword Overlap Score (0-40 points)
    const calculateOverlap = (userItems: string[] | null, postItems: string[] | null) => {
      if (!postItems || postItems.length === 0) return 1; // Neutral if post has no requirements
      if (!userItems || userItems.length === 0) return 0;
      
      const userSet = new Set(userItems.map(i => i.toLowerCase()));
      const matches = postItems.filter(i => userSet.has(i.toLowerCase()));
      return matches.length / postItems.length;
    };

    const fieldsScore = calculateOverlap(profileFields.research_fields, postFields.tags) * 20;
    const methodsScore = calculateOverlap(profileFields.methods, postFields.methods) * 10;
    const toolsScore = calculateOverlap(profileFields.tools, postFields.tools) * 10;
    
    const keywordScore = Math.round(fieldsScore + methodsScore + toolsScore);

    const systemPrompt = `You are an academic research matching assistant. Given a researcher's profile and a lab post, compute a match score and provide a brief explanation.

We have already calculated a Keyword Overlap Score: ${keywordScore}/40.

Now, you must evaluate the remaining components to reach a total score (0-100):

1. **Skills Match Score (0-30 points)**:
   - Evaluate the user's bio, degree status, and explicit skills against the post's description and requirements.
   - Consider experience depth and relevance.

2. **Proximity & Alignment Score (0-20 points)**:
   - Institutional affiliation (same university = high score).
   - Geographic location (if relevant/specified).
   - Remote work alignment.
   - Career stage alignment (e.g., undergrad vs. post-doc).

3. **LLM Synthesis Score (0-10 points)**:
   - Your overall "vibe check" or assessment of fit based on nuanced factors not captured above.

Return JSON with the individual scores and a final combined score.
{ "keyword_score": number, "skills_score": number, "proximity_score": number, "llm_score": number, "overall_score": number, "reason": string }`;

    const userPrompt = `Profile: ${JSON.stringify(profileFields, null, 2)}
Post: ${JSON.stringify(postFields, null, 2)}

The keyword overlap score is already ${keywordScore}/40. 
Compute the remaining match components (Skills /30, Proximity /20, LLM /10) and provide the final overall_score and explanation.`;

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
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_match_score",
              description: "Return the match score breakdown and explanation",
              parameters: {
                type: "object",
                properties: {
                  keyword_score: { type: "number", description: "Calculated keyword overlap score (0-40)" },
                  skills_score: { type: "number", description: "Skills match score (0-30)" },
                  proximity_score: { type: "number", description: "Proximity and alignment score (0-20)" },
                  llm_score: { type: "number", description: "LLM synthesis score (0-10)" },
                  overall_score: { type: "number", description: "Final combined score (0-100)" },
                  reason: { type: "string", description: "Brief explanation of the score" }
                },
                required: ["keyword_score", "skills_score", "proximity_score", "llm_score", "overall_score", "reason"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "return_match_score" } }
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

    const data = await response.json();
    console.log("AI response:", JSON.stringify(data, null, 2));

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in ai-match-score:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
