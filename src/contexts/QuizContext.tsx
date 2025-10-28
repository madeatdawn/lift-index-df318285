import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { QuizData, UserAnswer } from "@/types/quiz";
import { initialQuizData } from "@/data/quizData";
import { useQuizDatabase } from "@/hooks/useQuizDatabase";
import { toast } from "sonner";

interface QuizContextType {
  quizData: QuizData;
  updateQuizData: (data: QuizData) => void;
  userAnswers: UserAnswer[];
  addAnswer: (answer: UserAnswer) => void;
  removeLastAnswer: () => void;
  resetAnswers: () => void;
  calculateScore: () => number;
  isLoading: boolean;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export const QuizProvider = ({ children }: { children: ReactNode }) => {
  const [quizData, setQuizData] = useState<QuizData>(initialQuizData);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>(() => {
    // Load saved answers from localStorage
    const saved = localStorage.getItem('quizAnswers');
    return saved ? JSON.parse(saved) : [];
  });
  const [isLoading, setIsLoading] = useState(true);
  const { fetchQuizData, saveQuizData } = useQuizDatabase();

  useEffect(() => {
    loadQuizData();
  }, []);

  // Save answers to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('quizAnswers', JSON.stringify(userAnswers));
  }, [userAnswers]);

  const loadQuizData = async () => {
    setIsLoading(true);
    const data = await fetchQuizData();
    
    if (data && data.questions.length > 0) {
      // Use data from database
      setQuizData(data);
    } else {
      // No data in database, use initial data and save it
      setQuizData(initialQuizData);
      await saveQuizData(initialQuizData);
    }
    
    setIsLoading(false);
  };

  const updateQuizData = async (data: QuizData) => {
    setQuizData(data);
    const success = await saveQuizData(data);
    
    if (success) {
      toast.success("Quiz data saved successfully!");
    } else {
      toast.error("Failed to save quiz data. Please try again.");
    }
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

  const calculateScore = () => {
    if (userAnswers.length === 0) return 0;
    const total = userAnswers.reduce((sum, answer) => sum + answer.value, 0);
    return total / userAnswers.length;
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
