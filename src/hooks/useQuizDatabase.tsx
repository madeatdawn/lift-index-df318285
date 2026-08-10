import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { QuizData, QuizQuestion, QuizOption, ResultLevel } from "@/types/quiz";
import { isUsableQuizData, validateQuizDataForSave } from "@/lib/resolveResult";

const publicQuizClient = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);

export const useQuizDatabase = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuizData = async (): Promise<QuizData | null> => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [questionsResult, optionsResult, resultsResult] = await Promise.all([
        publicQuizClient.from("quiz_questions").select("*").order("sort_order"),
        publicQuizClient.from("quiz_options").select("*").order("sort_order"),
        publicQuizClient.from("quiz_results").select("*").order("sort_order"),
      ]);

      if (questionsResult.error) throw questionsResult.error;
      if (optionsResult.error) throw optionsResult.error;
      if (resultsResult.error) throw resultsResult.error;

      const questionsData = questionsResult.data;
      const optionsData = optionsResult.data;
      const resultsData = resultsResult.data;

      // Transform database data to QuizData format
      const questions: QuizQuestion[] = (questionsData || []).map((q) => ({
        id: q.question_id,
        question: q.question,
        options: (optionsData || [])
          .filter((opt) => opt.question_id === q.question_id)
          .map((opt): QuizOption => ({
            id: opt.option_id,
            text: opt.text,
            value: Number(opt.value),
          })),
      }));

      const results: ResultLevel[] = (resultsData || []).map((r) => ({
        id: r.result_id,
        name: r.name,
        minScore: Number(r.min_score),
        maxScore: Number(r.max_score),
        description: r.description,
        embedHTML: r.embed_html || "",
        redirectUrl: r.redirect_url,
      }));

      const quizData = { questions, results };
      if (!isUsableQuizData(quizData)) {
        throw new Error("The live quiz configuration is incomplete; using the safe bundled version");
      }

      return quizData;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch quiz data";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const saveQuizData = async (quizData: QuizData): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Client-side validation guard. The edge function ALSO validates — this is
      // just a fast-fail so the admin sees specific errors before we hit the network.
      const check = validateQuizDataForSave(quizData);
      if (!check.valid) {
        const msg = `Cannot save: ${check.errors.join("; ")}`;
        setError(msg);
        throw new Error(msg);
      }

      // Use edge function for admin operations (bypasses RLS with service role)
      const { data, error: fnError } = await supabase.functions.invoke('admin-quiz', {
        body: {
          action: 'save',
          quizData,
          adminPassword: 'elanoura2025',
        },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      // Bust the client cache so the next quiz load picks up the new config
      // immediately instead of serving stale results.
      try { sessionStorage.removeItem('quizData'); } catch { /* ignore */ }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save quiz data";
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  };


  return {
    fetchQuizData,
    saveQuizData,
    loading,
    error,
  };
};
