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
  const [isLoading, setIsLoading] = useState(false);
  const { fetchQuizData, saveQuizData } = useQuizDatabase();

  useEffect(() => {
    loadQuizData();
  }, []);

  // Save answers to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('quizAnswers', JSON.stringify(userAnswers));
  }, [userAnswers]);

  const loadQuizData = async () => {
    const data = await fetchQuizData();
    
    if (data && data.questions.length > 0) {
      setQuizData(data);
    }
    // If no database data, keep using initialQuizData (already set)
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

  const calculateScore = (): number => {
    // Extract valid answer values (1-5 only)
    const values = userAnswers
      .map(a => a?.value)
      .filter((v): v is number => typeof v === 'number' && v >= 1 && v <= 5);

    if (values.length === 0) return 0;

    // Count frequencies for each level (1-5)
    const freq: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    values.forEach(v => { freq[v]++; });

    const counts = Object.values(freq);
    const maxFreq = Math.max(...counts);

    // Find second highest frequency
    const sortedCounts = [...counts].sort((a, b) => b - a);
    const secondMax = sortedCounts[1] ?? 0;

    // Find modes (values with max frequency)
    const modes = Object.entries(freq)
      .filter(([_, count]) => count === maxFreq)
      .map(([val]) => Number(val));

    // Calculate median
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    // Clear-lead threshold scales with quiz length (~34% of answers)
    const n = values.length;
    const minDominance = Math.max(3, Math.ceil(n * 0.34));
    const isClearLead = modes.length === 1 && maxFreq >= minDominance && maxFreq > secondMax;

    if (isClearLead) return modes[0];

    // Tie / no clear lead - use median if it's one of the modes
    if (modes.includes(median)) return median;

    // Support-first fallback: use lowest mode
    return Math.min(...modes);
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
