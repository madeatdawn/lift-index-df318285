import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuiz } from "@/contexts/QuizContext";
import { calculateLiftScore } from "@/lib/liftScoring";
import { resolveRedirectForScore } from "@/lib/resolveResult";

import type { UserAnswer } from "@/types/quiz";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import elanourIcon from "@/assets/elanoura-icon.svg";



// Map referrer hostnames to friendly source names
const mapReferrerToSource = (referrer: string): string => {
  try {
    const hostname = new URL(referrer).hostname.toLowerCase();
    if (hostname.includes('instagram.com') || hostname.includes('l.instagram.com')) return 'instagram';
    if (hostname.includes('tiktok.com')) return 'tiktok';
    if (hostname.includes('mail.google.com') || hostname.includes('gmail.com')) return 'gmail';
    if (hostname.includes('t.co') || hostname.includes('twitter.com') || hostname.includes('x.com')) return 'twitter';
    if (hostname.includes('facebook.com') || hostname.includes('fb.com') || hostname.includes('l.facebook.com')) return 'facebook';
    if (hostname.includes('lnkd.in') || hostname.includes('linkedin.com')) return 'linkedin';
    if (hostname.includes('pinterest.com')) return 'pinterest';
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) return 'youtube';
    if (hostname.includes('mail.yahoo.com')) return 'yahoo-mail';
    if (hostname.includes('outlook.com') || hostname.includes('hotmail.com')) return 'outlook';
    return hostname; // fallback: use the raw hostname
  } catch {
    return 'direct';
  }
};

const detectInAppBrowser = (): string | null => {
  const ua = (navigator.userAgent || navigator.vendor || '').toLowerCase();
  if (ua.includes('instagram')) return 'instagram';
  if (ua.includes('bytedancewebview') || ua.includes('musical_ly') || ua.includes('tiktok')) return 'tiktok';
  if (ua.includes('fban') || ua.includes('fbav') || ua.includes('fb_iab') || ua.includes('fbbv')) return 'facebook';
  if (ua.includes('twitterandroid') || ua.includes('twitteriphone')) return 'twitter';
  if (ua.includes('linkedinapp')) return 'linkedin';
  if (ua.includes('pinterest')) return 'pinterest';
  return null;
};

const detectTrafficSource = (): string => {
  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get('utm_source');
  if (utmSource) return utmSource.toLowerCase();
  if (document.referrer) return mapReferrerToSource(document.referrer);
  // Fallback: detect in-app browsers by user agent (e.g. Instagram DMs strip referrer)
  const inAppBrowser = detectInAppBrowser();
  if (inAppBrowser) return inAppBrowser;
  return 'direct';
};

const Quiz = () => {
  const navigate = useNavigate();
  const { quizData, addAnswer, removeLastAnswer, resetAnswers, userAnswers, isLoading } = useQuiz();
  const trafficSource = useRef<string>(detectTrafficSource());
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [displayedProgress, setDisplayedProgress] = useState(0);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Initialize state once quiz data is loaded
  useEffect(() => {
    if (!isLoading && quizData.questions.length > 0) {
      // Validate saved answers against current questions
      const validAnswerCount = Math.min(userAnswers.length, quizData.questions.length);
      if (validAnswerCount > 0 && validAnswerCount < quizData.questions.length) {
        setCurrentQuestionIndex(validAnswerCount);
        setStarted(true);
      } else if (validAnswerCount >= quizData.questions.length) {
        // User already completed the quiz, reset
        resetAnswers();
        setCurrentQuestionIndex(0);
        setStarted(false);
      }
    }
  }, [isLoading, quizData.questions.length]);

  // If currentQuestionIndex is out of bounds, reset to start
  useEffect(() => {
    const currentQuestion = quizData.questions[currentQuestionIndex];
    if (!currentQuestion && quizData.questions.length > 0 && !isLoading) {
      resetAnswers();
      setCurrentQuestionIndex(0);
      setStarted(false);
    }
  }, [currentQuestionIndex, quizData.questions.length, isLoading]);

  // Keyboard support for selecting answers
  useEffect(() => {
    if (!started || isAnswering || !currentQuestion) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const keyIndex = key.charCodeAt(0) - 97; // 'a' = 0, 'b' = 1, etc.
      
      if (keyIndex >= 0 && keyIndex < currentQuestion.options.length) {
        const option = currentQuestion.options[keyIndex];
        setSelectedOptionId(option.id);
        handleAnswer(option.id, option.value);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [started, isAnswering, currentQuestionIndex]);

  // Reset selected option when question changes
  useEffect(() => {
    setSelectedOptionId(null);
  }, [currentQuestionIndex]);

  // Animate progress percentage counting
  useEffect(() => {
    const targetProgress = (userAnswers.length / quizData.questions.length) * 100;
    const duration = 300; // milliseconds
    const steps = 20;
    const increment = (targetProgress - displayedProgress) / steps;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayedProgress(targetProgress);
        clearInterval(interval);
      } else {
        setDisplayedProgress(prev => prev + increment);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [userAnswers.length, quizData.questions.length]);

  // Handle quiz completion - calculate score and redirect directly
  const handleQuizComplete = (answersSnapshot: UserAnswer[]) => {
    setIsRedirecting(true);

    const score = calculateLiftScore(answersSnapshot);

    // Edge case: no valid answers
    if (score === 0) {
      console.info("[LIFT] No valid answers; resetting quiz", {
        rawValues: answersSnapshot.map((a) => a.value),
      });

      setIsRedirecting(false);
      resetAnswers();
      setCurrentQuestionIndex(0);
      setStarted(false);
      return;
    }

    const levelId = resolution.result?.id;
    const result = resolution.result;

    console.info("[LIFT] Quiz complete", {
      rawValues: answersSnapshot.map((a) => a.value),
      score,
      levelId,
      matchedResultId: result?.id,
      redirectUrl: resolution.url,
      usedFallback: resolution.usedFallback,
    });

    const redirectUrl = resolution.url;


    // Log to Google Sheets — keepalive ensures the request survives the navigation
    // that happens on the next line. Without keepalive, the browser cancels the
    // in-flight fetch on window.location.assign and the log never arrives.
    try {
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/log-quiz-completion`, {
        method: 'POST',
        keepalive: true,
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          answers: answersSnapshot.map((a) => a.value),
          result: result?.name || levelId,
          timestamp: new Date().toISOString(),
          source: trafficSource.current,
        }),
      }).catch((err) => console.warn("[LIFT] Sheet logging failed:", err));
    } catch (err) {
      console.warn("[LIFT] Sheet logging threw:", err);
    }

    // Redirect immediately
    resetAnswers();
    window.location.assign(redirectUrl);
  };

  // Show redirecting state
  if (isRedirecting) {
    return (
      <div className="page-container">
        <div className="results-loading-container">
          <img 
            src={elanourIcon} 
            alt="Élanoura" 
            className="w-[70px] h-auto"
          />
          <p 
            className="mt-[40px] text-[50px] leading-tight text-center"
            style={{ 
              fontFamily: "'Editors Note', serif",
              fontStyle: 'italic',
              fontWeight: 200,
              color: '#DBABA0'
            }}
          >
            Calculating your results...
          </p>
        </div>
      </div>
    );
  }

  const currentQuestion = quizData.questions[currentQuestionIndex];
  
  // Show loading while resetting
  if (!currentQuestion) {
    return (
      <div className="page-container">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Loading quiz...</p>
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

    const newAnswer: UserAnswer = {
      questionId: currentQuestion.id,
      selectedOptionId: optionId,
      value,
    };
    const answersSnapshot = [...userAnswers, newAnswer];

    addAnswer(newAnswer);

    // Wait for animation to complete before moving to next question
    setTimeout(() => {
      if (currentQuestionIndex < quizData.questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
        setIsAnswering(false);
      } else {
        // Quiz complete - calculate score and redirect directly
        handleQuizComplete(answersSnapshot);
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
          className="content-container-narrow flex flex-col items-center"
        >
          {/* Logo */}
          <a 
            href="https://elanoura.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="mb-8"
          >
            <img src={elanourIcon} alt="Élanoura" className="w-[50px]" />
          </a>

          <Card className="card-elevated p-6 md:p-12 text-center">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h1 
                className="text-3xl md:text-5xl mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
                style={{ fontFamily: 'EditorsNote-Extralight, sans-serif', fontStyle: 'normal', fontWeight: 200 }}
              >
                The LIFT Index Assessment
              </h1>
              <div className="text-xl text-muted-foreground mb-8 leading-relaxed text-center">
                <p className="mb-6">Answer the following nine questions based on:</p>
                
                <p className="mb-6">
                  <span style={{ fontFamily: "'Neue Haas Grotesk 65', sans-serif", fontWeight: 500 }}>What is consistently true right now…</span><br />This assessment reflects how you are currently operating, not what you may aspire to or hope for. 
                </p>
                
                <p className="mb-6">
                  <span style={{ fontFamily: "'Neue Haas Grotesk 65', sans-serif", fontWeight: 500 }}>The chapter or initiative you are focused on now…</span><br />Even if you are already successful in other areas of your life or work. Many women move up and down through the levels multiple times.
                </p>
                
                <p className="mb-4">Your results will guide you to a level page with insights, resources, and exercises designed to support what you're navigating now. **Keep in mind you might be between levels, so do check the levels before and after to see which aligns with you most.</p>
                
                <p>Thank you for being here!</p>
              </div>
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
              <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground text-balance">
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
                        onClick={() => {
                          setSelectedOptionId(option.id);
                          handleAnswer(option.id, option.value);
                        }}
                        disabled={isAnswering}
                        className="w-full text-foreground rounded-3xl py-5 px-6 text-left disabled:opacity-50 group relative overflow-hidden"
                        style={{ 
                          background: 'rgba(255, 255, 255, 0.7)'
                        }}
                      >
                        <div 
                          className={`absolute inset-0 rounded-3xl pointer-events-none ${selectedOptionId === option.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                          style={{
                            background: 'linear-gradient(135deg, rgba(219, 171, 160, 0.3), rgba(196, 175, 198, 0.3))',
                            transition: 'opacity 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)'
                          }}
                        />
                        <span 
                          style={{ 
                            fontSize: '14px',
                            fontFamily: 'Body, sans-serif',
                            letterSpacing: '0.03em',
                            fontWeight: 400,
                            lineHeight: '1.5em',
                            display: 'flex',
                            gap: '18px'
                          }}
                        >
                          <span style={{ color: '#DBABA0', flexShrink: 0 }}>{optionLabel})</span>
                          <span>{option.text}</span>
                        </span>
                      </button>
                    </motion.div>
                  );
                })}
              </div>

              {/* Percentage progress - mobile only (below options) */}
              <div className="text-center text-foreground md:hidden pt-4" style={{ fontSize: '20px' }}>
                {Math.round(displayedProgress)}%
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Percentage progress - desktop only (bottom right) */}
      <div className="hidden md:block absolute bottom-8 right-8 text-foreground z-10" style={{ fontSize: '13px' }}>
        {Math.round(displayedProgress)}%
      </div>
    </div>
  );
};

export default Quiz;
