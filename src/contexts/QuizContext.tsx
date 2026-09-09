import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { QuizData, UserAnswer } from "@/types/quiz";
import { initialQuizData } from "@/data/quizData";
import { useQuizDatabase } from "@/hooks/useQuizDatabase";
import { calculateLiftScore } from "@/lib/liftScoring";
import { isUsableQuizData } from "@/lib/resolveResult";
import { toast } from "sonner";

interface QuizContextType {
  quizData: QuizData;
  updateQuizData: (data: QuizData) => Promise<boolean>;
  userAnswers: UserAnswer[];
  addAnswer: (answer: UserAnswer) => void;
  removeLastAnswer: () => void;
  resetAnswers: () => void;
  calculateScore: () => number;
  isLoading: boolean;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

const copyQuizData = (data: QuizData): QuizData =>
  JSON.parse(JSON.stringify(data)) as QuizData;

export const QuizProvider = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname === "/admin";
  // Public quiz data is bundled with the app. Cloud availability must never be
  // able to delay, replace, or invalidate an assessment already in progress.
  const [quizData, setQuizData] = useState<QuizData>(() => copyQuizData(initialQuizData));
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>(() => {
    try {
      const saved = localStorage.getItem('quizAnswers');
      const parsed: unknown = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed as UserAnswer[] : [];
    } catch {
      localStorage.removeItem('quizAnswers');
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(isAdminRoute);
  const { fetchQuizData, saveQuizData } = useQuizDatabase();

  useEffect(() => {
    if (!isAdminRoute) {
      setQuizData(copyQuizData(initialQuizData));
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);
    void fetchQuizData().then((data) => {
      if (!active) return;
      if (data && isUsableQuizData(data)) setQuizData(copyQuizData(data));
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [isAdminRoute]);

  useEffect(() => {
    localStorage.setItem('quizAnswers', JSON.stringify(userAnswers));
  }, [userAnswers]);

  const updateQuizData = async (data: QuizData) => {
    const success = await saveQuizData(data);
    
    if (success) {
      setQuizData(copyQuizData(data));
      toast.success("Quiz data saved successfully!");
    } else {
      toast.error("Failed to save quiz data. Please try again.");
    }
    return success;
  };

  const addAnswer = (answer: UserAnswer) => {
    setUserAnswers(prev => [...prev, answer]);
  };

  const removeLastAnswer = () => {
    setUserAnswers(prev => prev.slice(0, -1));
  };

  const resetAnswers = () => {
    setUserAnswers([]);
    localStorage.removeItem('quizAnswers');
  };

  const calculateScore = (): number => {
    return calculateLiftScore(userAnswers);
  };

  return (
    <QuizContext.Provider value={{ quizData, updateQuizData, userAnswers, addAnswer, removeLastAnswer, resetAnswers, calculateScore, isLoading }}>
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error("useQuiz must be used within QuizProvider");
  }
  return context;
};
