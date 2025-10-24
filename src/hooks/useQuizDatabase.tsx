import { useEffect, useState } from "react";
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

      // Delete existing data
      await supabase.from("quiz_options").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("quiz_questions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("quiz_results").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      // Insert questions
      const questionsToInsert = quizData.questions.map((q, index) => ({
        question_id: q.id,
        question: q.question,
        sort_order: index,
      }));

      const { error: questionsError } = await supabase
        .from("quiz_questions")
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      // Insert options
      const optionsToInsert = quizData.questions.flatMap((q, qIndex) =>
        q.options.map((opt, oIndex) => ({
          question_id: q.id,
          option_id: opt.id,
          text: opt.text,
          value: opt.value,
          sort_order: oIndex,
        }))
      );

      const { error: optionsError } = await supabase
        .from("quiz_options")
        .insert(optionsToInsert);

      if (optionsError) throw optionsError;

      // Insert results
      const resultsToInsert = quizData.results.map((r, index) => ({
        result_id: r.id,
        name: r.name,
        min_score: r.minScore,
        max_score: r.maxScore,
        description: r.description,
        embed_html: r.embedHTML,
        redirect_url: r.redirectUrl,
        sort_order: index,
      }));

      const { error: resultsError } = await supabase
        .from("quiz_results")
        .insert(resultsToInsert);

      if (resultsError) throw resultsError;

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
