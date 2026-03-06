import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { record: postFields } = await req.json(); // record contains the new lab_post
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log(`Processing batch matches for post: ${postFields.id}`);

    // 1. Fetch all student profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('account_type', 'student');

    if (profileError) throw profileError;
    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ message: "No students to match" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Calculate Keyword Overlap for all students
    const calculateOverlap = (userItems: string[] | null, postItems: string[] | null) => {
      if (!postItems || postItems.length === 0) return 1;
      if (!userItems || userItems.length === 0) return 0;
      const userSet = new Set(userItems.map(i => i.toLowerCase()));
      const matches = postItems.filter(i => userSet.has(i.toLowerCase()));
      return matches.length / postItems.length;
    };

    const studentScores = profiles.map(profile => {
      const fieldsScore = calculateOverlap(profile.research_fields, postFields.tags) * 20;
      const methodsScore = calculateOverlap(profile.methods, postFields.methods) * 10;
      const toolsScore = calculateOverlap(profile.tools, postFields.tools) * 10;
      const keywordScore = Math.round(fieldsScore + methodsScore + toolsScore);
      return { profile, keywordScore };
    });

    // Sort by keyword score
    studentScores.sort((a, b) => b.keywordScore - a.keywordScore);

    // Pick top 5 for full LLM analysis to save cost, but store others with just keyword score
    const topStudents = studentScores.slice(0, 5);
    const otherStudents = studentScores.slice(5, 50); // limit to next 45 to save DB ops

    const resultsToUpsert = [];

    // 3. Call LLM for top 5
    for (const item of topStudents) {
      const { profile, keywordScore } = item;
      
      try {
        const systemPrompt = `You are an academic research matching assistant. Compute match score component: Skills Match (0-30), Proximity (0-20), LLM Synthesis (0-10). Total score is keyword_score (${keywordScore}/40) + these components.`;
        const userPrompt = `Profile: ${JSON.stringify(profile)}\nPost: ${JSON.stringify(postFields)}`;

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
            tools: [{
              type: "function",
              function: {
                name: "return_match_score",
                parameters: {
                  type: "object",
                  properties: {
                    skills_score: { type: "number" },
                    proximity_score: { type: "number" },
                    llm_score: { type: "number" },
                    overall_score: { type: "number" },
                    reason: { type: "string" }
                  },
                  required: ["skills_score", "proximity_score", "llm_score", "overall_score", "reason"]
                }
              }
            }],
            tool_choice: { type: "function", function: { name: "return_match_score" } }
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const args = JSON.parse(data.choices[0].message.tool_calls[0].function.arguments);
          resultsToUpsert.push({
            student_id: profile.id,
            post_id: postFields.id,
            keyword_score: keywordScore,
            skills_score: args.skills_score,
            proximity_score: args.proximity_score,
            llm_score: args.llm_score,
            overall_score: args.overall_score,
            explanation: args.reason,
            updated_at: new Date().toISOString()
          });
        }
      } catch (e) {
        console.error(`Error matching student ${profile.id}:`, e);
      }
    }

    // 4. Add others with just keyword score (simple estimation)
    for (const item of otherStudents) {
      resultsToUpsert.push({
        student_id: item.profile.id,
        post_id: postFields.id,
        keyword_score: item.keywordScore,
        skills_score: 0,
        proximity_score: 0,
        llm_score: 0,
        overall_score: item.keywordScore, // Just use keyword score as baseline
        explanation: "Preliminary match based on research fields and skills overlap. Calculate for full details.",
        updated_at: new Date().toISOString()
      });
    }

    // 5. Upsert all results
    if (resultsToUpsert.length > 0) {
      const { error: upsertError } = await supabase
        .from('match_scores')
        .upsert(resultsToUpsert, { onConflict: 'student_id,post_id' });
      
      if (upsertError) throw upsertError;
    }

    return new Response(JSON.stringify({ 
      message: `Processed ${resultsToUpsert.length} matches`,
      top_matches: resultsToUpsert.length 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in batch-match-score:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
