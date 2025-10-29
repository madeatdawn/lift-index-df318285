import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuiz } from "@/contexts/QuizContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";

const Quiz = () => {
  const navigate = useNavigate();
  const { quizData, addAnswer, removeLastAnswer, resetAnswers, userAnswers } = useQuiz();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(() => {
    // Resume from saved progress
    return userAnswers.length > 0 ? userAnswers.length : 0;
  });
  const [started, setStarted] = useState(userAnswers.length > 0);
  const [isAnswering, setIsAnswering] = useState(false);

  // Safety checks for quiz data
  if (!quizData || !quizData.questions || quizData.questions.length === 0) {
    return (
      <div className="page-container">
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
      <div className="page-container">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Quiz data error. Please refresh the page.</p>
        </Card>
      </div>
    );
  }
  
  const progress = (userAnswers.length / quizData.questions.length) * 100;

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
        // Navigate to results - don't set isAnswering to false so we stay in loading state
        navigate("/results", { replace: true });
      }
    }, 400);
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      removeLastAnswer();
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  if (!started) {
    return (
      <div className="page-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="content-container-narrow"
        >
          <Card className="card-elevated p-12 text-center">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h1 
                className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
                style={{ fontStyle: 'normal' }}
              >
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
    <div className="min-h-screen bg-background relative flex flex-col">
      {/* Back button - absolute positioned */}
      {currentQuestionIndex > 0 && (
        <button
          onClick={handlePrevious}
          className="absolute top-8 left-8 text-foreground hover:opacity-60 transition-opacity z-10"
          aria-label="Previous question"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
      )}

      {/* Main content - centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-3xl space-y-12">
          {/* Progress indicator */}
          <div className="text-center space-y-2">
            <div className="text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1} of {quizData.questions.length}
            </div>
            <Progress value={progress} className="h-1.5 max-w-xs mx-auto" />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              {/* Question */}
              <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground">
                {currentQuestion.question}
              </h2>

              {/* Options grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                {currentQuestion.options.map((option, index) => (
                  <motion.div
                    key={option.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <button
                      onClick={() => handleAnswer(option.id, option.value)}
                      disabled={isAnswering}
                      className="w-full bg-card hover:bg-card/80 text-foreground rounded-3xl py-8 px-6 text-center transition-all hover:shadow-lg disabled:opacity-50 border border-border/50"
                    >
                      <span className="text-lg">{option.text}</span>
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Decorative wave at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none overflow-hidden">
        <svg
          className="absolute bottom-0 w-full"
          viewBox="0 0 1200 40"
          preserveAspectRatio="none"
          style={{ height: '40px' }}
        >
          <path
            d="M0,20 Q150,10 300,20 T600,20 T900,20 T1200,20 L1200,40 L0,40 Z"
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="1"
            opacity="0.5"
          />
        </svg>
      </div>
    </div>
  );
};

export default Quiz;
