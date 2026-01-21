import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { action, quizData, adminPassword } = await req.json();

    // Verify admin password
    const expectedPassword = "elanoura2025";
    if (adminPassword !== expectedPassword) {
      console.error("Invalid admin password provided");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'save') {
      console.log("Saving quiz data...", { 
        questionsCount: quizData.questions?.length,
        resultsCount: quizData.results?.length 
      });

      // Delete existing data using service role
      const { error: deleteOptionsError } = await supabaseAdmin
        .from("quiz_options")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      
      if (deleteOptionsError) {
        console.error("Error deleting options:", deleteOptionsError);
        throw deleteOptionsError;
      }

      const { error: deleteQuestionsError } = await supabaseAdmin
        .from("quiz_questions")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      
      if (deleteQuestionsError) {
        console.error("Error deleting questions:", deleteQuestionsError);
        throw deleteQuestionsError;
      }

      const { error: deleteResultsError } = await supabaseAdmin
        .from("quiz_results")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      
      if (deleteResultsError) {
        console.error("Error deleting results:", deleteResultsError);
        throw deleteResultsError;
      }

      // Insert questions
      const questionsToInsert = quizData.questions.map((q: any, index: number) => ({
        question_id: q.id,
        question: q.question,
        sort_order: index,
      }));

      const { error: questionsError } = await supabaseAdmin
        .from("quiz_questions")
        .insert(questionsToInsert);

      if (questionsError) {
        console.error("Error inserting questions:", questionsError);
        throw questionsError;
      }

      // Insert options
      const optionsToInsert = quizData.questions.flatMap((q: any) =>
        q.options.map((opt: any, oIndex: number) => ({
          question_id: q.id,
          option_id: opt.id,
          text: opt.text,
          value: opt.value,
          sort_order: oIndex,
        }))
      );

      const { error: optionsError } = await supabaseAdmin
        .from("quiz_options")
        .insert(optionsToInsert);

      if (optionsError) {
        console.error("Error inserting options:", optionsError);
        throw optionsError;
      }

      // Insert results
      const resultsToInsert = quizData.results.map((r: any, index: number) => ({
        result_id: r.id,
        name: r.name,
        min_score: r.minScore,
        max_score: r.maxScore,
        description: r.description,
        embed_html: r.embedHTML,
        redirect_url: r.redirectUrl,
        sort_order: index,
      }));

      const { error: resultsError } = await supabaseAdmin
        .from("quiz_results")
        .insert(resultsToInsert);

      if (resultsError) {
        console.error("Error inserting results:", resultsError);
        throw resultsError;
      }

      console.log("Quiz data saved successfully");
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in admin-quiz function:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
