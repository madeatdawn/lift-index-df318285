import React, { createContext, useContext, useState, ReactNode } from "react";
import { QuizData, UserAnswer } from "@/types/quiz";
import { initialQuizData } from "@/data/quizData";

interface QuizContextType {
  quizData: QuizData;
  updateQuizData: (data: QuizData) => void;
  userAnswers: UserAnswer[];
  addAnswer: (answer: UserAnswer) => void;
  resetAnswers: () => void;
  calculateScore: () => number;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export const QuizProvider = ({ children }: { children: ReactNode }) => {
  const [quizData, setQuizData] = useState<QuizData>(() => {
    try {
      const saved = localStorage.getItem('quizData');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate that the parsed data has the required structure
        if (parsed.questions && Array.isArray(parsed.questions) && parsed.results && Array.isArray(parsed.results)) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Error loading quiz data from localStorage:', error);
      localStorage.removeItem('quizData'); // Clear corrupted data
    }
    return initialQuizData;
  });
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);

  const updateQuizData = (data: QuizData) => {
    setQuizData(data);
    try {
      localStorage.setItem('quizData', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving quiz data to localStorage:', error);
    }
  };

  const addAnswer = (answer: UserAnswer) => {
    setUserAnswers(prev => [...prev, answer]);
  };

  const resetAnswers = () => {
    setUserAnswers([]);
  };

  const calculateScore = () => {
    if (userAnswers.length === 0) return 0;
    const total = userAnswers.reduce((sum, answer) => sum + answer.value, 0);
    return total / userAnswers.length;
  };

  return (
    <QuizContext.Provider value={{ quizData, updateQuizData, userAnswers, addAnswer, resetAnswers, calculateScore }}>
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
