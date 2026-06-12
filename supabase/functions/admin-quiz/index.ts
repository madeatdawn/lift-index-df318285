import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EXPECTED_RESULT_IDS = ["seeking", "striving", "steadfast", "shining", "significance"];

const isSafeAbsoluteUrl = (url: unknown): boolean => {
  if (typeof url !== "string" || !url) return false;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

const validateQuizData = (data: any): string[] => {
  const errors: string[] = [];
  if (!data || typeof data !== "object") return ["quizData must be an object"];

  const questions = Array.isArray(data.questions) ? data.questions : [];
  const results = Array.isArray(data.results) ? data.results : [];

  if (questions.length === 0) errors.push("At least one question is required");

  questions.forEach((q: any, qi: number) => {
    if (!q?.id || typeof q.id !== "string") errors.push(`Question ${qi + 1}: missing id`);
    if (!q?.question || typeof q.question !== "string") errors.push(`Question ${qi + 1}: missing text`);
    if (!Array.isArray(q?.options) || q.options.length === 0) {
      errors.push(`Question ${qi + 1}: must have at least one option`);
      return;
    }
    q.options.forEach((opt: any, oi: number) => {
      const v = Number(opt?.value);
      if (!Number.isFinite(v) || v < 1 || v > 5) {
        errors.push(`Question ${qi + 1} option ${oi + 1}: value must be 1-5`);
      }
      if (!opt?.id) errors.push(`Question ${qi + 1} option ${oi + 1}: missing id`);
      if (!opt?.text) errors.push(`Question ${qi + 1} option ${oi + 1}: missing text`);
    });
  });

  const ids = new Set(results.map((r: any) => r?.id));
  for (const expected of EXPECTED_RESULT_IDS) {
    if (!ids.has(expected)) errors.push(`Missing required result level: "${expected}"`);
  }

  results.forEach((r: any, ri: number) => {
    const min = Number(r?.minScore);
    const max = Number(r?.maxScore);
    if (!Number.isFinite(min) || min < 1 || min > 5) errors.push(`Result ${ri + 1} (${r?.id}): minScore must be 1-5`);
    if (!Number.isFinite(max) || max < 1 || max > 5) errors.push(`Result ${ri + 1} (${r?.id}): maxScore must be 1-5`);
    if (Number.isFinite(min) && Number.isFinite(max) && min > max) {
      errors.push(`Result ${ri + 1} (${r?.id}): minScore > maxScore`);
    }
    if (!isSafeAbsoluteUrl(r?.redirectUrl)) {
      errors.push(`Result ${ri + 1} (${r?.id}): redirectUrl must be a valid http(s) URL`);
    }
  });

  for (const score of [1, 2, 3, 4, 5]) {
    const hit = results.some((r: any) => score >= Number(r?.minScore) && score <= Number(r?.maxScore));
    if (!hit) errors.push(`No result level covers score ${score}`);
  }

  return errors;
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

      // Delete existing data using service role - use gte on sort_order to match all rows
      const { error: deleteOptionsError } = await supabaseAdmin
        .from("quiz_options")
        .delete()
        .gte("sort_order", 0);
      
      if (deleteOptionsError) {
        console.error("Error deleting options:", deleteOptionsError);
        throw deleteOptionsError;
      }
      console.log("Deleted all options");

      const { error: deleteQuestionsError } = await supabaseAdmin
        .from("quiz_questions")
        .delete()
        .gte("sort_order", 0);
      
      if (deleteQuestionsError) {
        console.error("Error deleting questions:", deleteQuestionsError);
        throw deleteQuestionsError;
      }
      console.log("Deleted all questions");

      const { error: deleteResultsError } = await supabaseAdmin
        .from("quiz_results")
        .delete()
        .gte("sort_order", 0);
      
      if (deleteResultsError) {
        console.error("Error deleting results:", deleteResultsError);
        throw deleteResultsError;
      }
      console.log("Deleted all results");

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
