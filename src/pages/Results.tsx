import { useLayoutEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuiz } from "@/contexts/QuizContext";
import elanourIcon from "@/assets/elanoura-icon.svg";

const Results = () => {
  const navigate = useNavigate();
  const { quizData, calculateScore, userAnswers, resetAnswers } = useQuiz();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useLayoutEffect(() => {
    if (userAnswers.length === 0) {
      navigate("/");
      return;
    }

    const score = calculateScore();
    const matchedResult = quizData.results.find(
      r => score >= r.minScore && score <= r.maxScore
    );

    if (matchedResult?.redirectUrl) {
      setIsRedirecting(true);
      setTimeout(() => {
        resetAnswers(); // Clear saved progress before redirecting
        window.location.href = matchedResult.redirectUrl;
      }, 1500);
    } else {
      navigate("/");
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
            className="mt-[40px] text-[50px] leading-tight"
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
  }

  return null;
};

export default Results;
