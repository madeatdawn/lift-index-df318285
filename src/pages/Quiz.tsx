import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuiz } from "@/contexts/QuizContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import elanourIcon from "@/assets/elanoura-icon.svg";

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
      {/* Logo */}
      <a 
        href="https://elanoura.com/" 
        target="_blank" 
        rel="noopener noreferrer"
        className="absolute top-[30px] left-1/2 -translate-x-1/2 z-10"
      >
        <img src={elanourIcon} alt="Élanoura" className="w-[50px]" />
      </a>

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
                className="text-5xl mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
                style={{ fontFamily: 'EditorsNote-Extralight, sans-serif', fontStyle: 'normal', fontWeight: 200 }}
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
      {/* Header section with Logo and Back button */}
      <div className="relative w-full py-8 px-4 md:px-8">
        <div className="flex items-center justify-center relative max-w-3xl mx-auto">
          {/* Back button - left side */}
          <button
            onClick={currentQuestionIndex === 0 ? () => setStarted(false) : handlePrevious}
            className="absolute left-0 rounded-full p-3 transition-all duration-300"
            aria-label="Previous question"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fff'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.7)'}
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
          </button>

          {/* Logo - centered */}
          <a 
            href="https://elanoura.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="z-10"
          >
            <img src={elanourIcon} alt="Élanoura" className="w-[50px]" />
          </a>
        </div>
      </div>

      {/* Main content - centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-16">
        <div className="w-full max-w-3xl space-y-12">
          {/* Progress indicator */}
          <div className="text-center space-y-2">
            <div className="text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1} of {quizData.questions.length}
            </div>
            <Progress value={progress} className="h-1 max-w-xs mx-auto" />
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
              <div className="grid grid-cols-1 gap-4 max-w-2xl mx-auto">
                {currentQuestion.options.map((option, index) => {
                  const optionLabel = String.fromCharCode(65 + index); // A, B, C, D...
                  return (
                    <motion.div
                      key={option.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <button
                        onClick={() => handleAnswer(option.id, option.value)}
                        disabled={isAnswering}
                        className="w-full text-foreground rounded-3xl py-5 px-6 text-left disabled:opacity-50 group"
                        style={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.7)',
                          transition: 'all 0.3s ease 0.1s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(219, 171, 160, 0.3), rgba(196, 175, 198, 0.3))';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
                        }}
                      >
                        <span 
                          style={{ 
                            fontSize: '14px',
                            fontFamily: 'Body, sans-serif',
                            letterSpacing: '0.03em',
                            fontWeight: 400,
                            lineHeight: '1em'
                          }}
                        >
                          <span style={{ color: '#DBABA0', marginRight: '8px' }}>{optionLabel})</span>{option.text}
                        </span>
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Percentage progress - bottom right */}
      <div className="absolute bottom-8 right-8 text-foreground z-10" style={{ fontSize: '13px' }}>
        {Math.round(progress)}%
      </div>
    </div>
  );
};

export default Quiz;
