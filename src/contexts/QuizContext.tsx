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
    const saved = localStorage.getItem('quizData');
    return saved ? JSON.parse(saved) : initialQuizData;
  });
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);

  const updateQuizData = (data: QuizData) => {
    setQuizData(data);
    localStorage.setItem('quizData', JSON.stringify(data));
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
