export interface QuizOption {
  id: string;
  text: string;
  value: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
}

export interface ResultLevel {
  id: string;
  name: string;
  minScore: number;
  maxScore: number;
  description: string;
  embedHTML: string;
}

export interface QuizData {
  questions: QuizQuestion[];
  results: ResultLevel[];
}

export interface UserAnswer {
  questionId: string;
  selectedOptionId: string;
  value: number;
}
