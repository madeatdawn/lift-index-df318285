import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuiz } from "@/contexts/QuizContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";

const Quiz = () => {
  const navigate = useNavigate();
  const { quizData, addAnswer, resetAnswers } = useQuiz();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);

  // Safety checks for quiz data
  if (!quizData || !quizData.questions || quizData.questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--gradient-subtle)" }}>
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Loading quiz data...</p>
        </Card>
      </div>
    );
  }

  const currentQuestion = quizData.questions[currentQuestionIndex];
  
  // Additional safety check for current question
  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--gradient-subtle)" }}>
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Quiz data error. Please refresh the page.</p>
        </Card>
      </div>
    );
  }
  
  const progress = ((currentQuestionIndex + 1) / quizData.questions.length) * 100;

  const handleStart = () => {
    resetAnswers();
    setStarted(true);
  };

  const handleAnswer = (optionId: string, value: number) => {
    if (isAnswering) return; // Prevent multiple clicks
    
    setIsAnswering(true);
    
    addAnswer({
      questionId: currentQuestion.id,
      selectedOptionId: optionId,
      value
    });

    // Wait for animation to complete before moving to next question
    setTimeout(() => {
      if (currentQuestionIndex < quizData.questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setIsAnswering(false);
      } else {
        // Navigate to results after ensuring state is updated
        navigate("/results");
      }
    }, 400);
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  if (!started) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--gradient-subtle)" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl w-full"
        >
          <Card className="p-12 text-center" style={{ background: "var(--gradient-card)", boxShadow: "var(--shadow-elegant)" }}>
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                LIFT Index Quiz
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Discover where you are on your journey and unlock personalized insights 
                to help you reach your next level of growth and impact.
              </p>
              <Button
                size="lg"
                onClick={handleStart}
                className="text-lg px-8 py-6 font-semibold"
              >
                Start Your Assessment
              </Button>
            </motion.div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--gradient-subtle)" }}>
      <div className="max-w-4xl w-full space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>Question {currentQuestionIndex + 1} of {quizData.questions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
          {currentQuestionIndex > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevious}
              className="text-muted-foreground hover:text-foreground"
            >
              ← Previous Question
            </Button>
          )}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-8" style={{ background: "var(--gradient-card)", boxShadow: "var(--shadow-elegant)" }}>
              <h2 className="text-2xl font-bold mb-8 text-foreground">
                {currentQuestion.question}
              </h2>

              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <motion.div
                    key={option.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Button
                      variant="outline"
                      className="w-full text-left h-auto py-4 px-6 justify-start hover:bg-primary/5 hover:border-primary transition-all"
                      onClick={() => handleAnswer(option.id, option.value)}
                      disabled={isAnswering}
                    >
                      <span className="font-medium text-primary mr-3">{option.id.toUpperCase()})</span>
                      <span className="text-foreground">{option.text}</span>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Quiz;
