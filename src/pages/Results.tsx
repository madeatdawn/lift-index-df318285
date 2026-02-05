import { useLayoutEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuiz } from "@/contexts/QuizContext";
import elanourIcon from "@/assets/elanoura-icon.svg";

// Direct mapping from score to level ID
const LEVEL_MAP: Record<number, string> = {
  1: 'seeking',
  2: 'striving',
  3: 'steadfast',
  4: 'shining',
  5: 'significance'
};

const Results = () => {
  const navigate = useNavigate();
  const { quizData, calculateScore, userAnswers, resetAnswers } = useQuiz();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useLayoutEffect(() => {
    const score = calculateScore();
    
    // Handle edge case: incomplete quiz or error
    if (score === 0 || userAnswers.length === 0) {
      navigate('/quiz');
      return;
    }

    // Direct ID mapping instead of score ranges
    const levelId = LEVEL_MAP[score];
    const matchedResult = quizData.results.find(r => r.id === levelId);

    if (matchedResult?.redirectUrl) {
      setIsRedirecting(true);
      // Clear saved progress and redirect
      resetAnswers();
      window.location.href = matchedResult.redirectUrl;
    }
  }, [userAnswers, quizData.results, calculateScore, resetAnswers, navigate]);

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
          Loading your results...
        </p>
      </div>
    </div>
  );
};

export default Results;
