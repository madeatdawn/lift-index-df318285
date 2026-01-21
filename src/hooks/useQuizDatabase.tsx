import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { QuizData, QuizQuestion, QuizOption, ResultLevel } from "@/types/quiz";

export const useQuizDatabase = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuizData = async (): Promise<QuizData | null> => {
    try {
      setLoading(true);
      setError(null);

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from("quiz_questions")
        .select("*")
        .order("sort_order");

      if (questionsError) throw questionsError;

      // Fetch options
      const { data: optionsData, error: optionsError } = await supabase
        .from("quiz_options")
        .select("*")
        .order("sort_order");

      if (optionsError) throw optionsError;

      // Fetch results
      const { data: resultsData, error: resultsError } = await supabase
        .from("quiz_results")
        .select("*")
        .order("sort_order");

      if (resultsError) throw resultsError;

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

      return { questions, results };
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
