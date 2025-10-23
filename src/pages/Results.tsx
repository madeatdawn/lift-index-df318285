import { useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuiz } from "@/contexts/QuizContext";

const Results = () => {
  const navigate = useNavigate();
  const { quizData, calculateScore, userAnswers } = useQuiz();

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
      window.location.href = matchedResult.redirectUrl;
    } else {
      navigate("/");
    }
  }, [userAnswers, quizData.results, calculateScore, navigate]);

  return null;
};

export default Results;
