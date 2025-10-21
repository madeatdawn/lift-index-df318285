import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuiz } from "@/contexts/QuizContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ResultLevel } from "@/types/quiz";
import { motion } from "framer-motion";

const Results = () => {
  const navigate = useNavigate();
  const { quizData, calculateScore, userAnswers } = useQuiz();
  const [result, setResult] = useState<ResultLevel | null>(null);

  useEffect(() => {
    if (userAnswers.length === 0) {
      navigate("/");
      return;
    }

    const score = calculateScore();
    const matchedResult = quizData.results.find(
      r => score >= r.minScore && score <= r.maxScore
    );
    setResult(matchedResult || null);
  }, [userAnswers, quizData.results, calculateScore, navigate]);

  if (!result) {
    return null;
  }

  const score = calculateScore();

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--gradient-subtle)" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl w-full"
      >
        <Card className="p-12" style={{ background: "var(--gradient-card)", boxShadow: "var(--shadow-elegant)" }}>
          <div className="text-center space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                {result.name}
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Your Score: {score.toFixed(2)}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="prose prose-lg mx-auto"
            >
              <p className="text-lg text-foreground leading-relaxed">
                {result.description}
              </p>
            </motion.div>

            {result.embedHTML && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-8 p-6 bg-secondary/50 rounded-lg"
                dangerouslySetInnerHTML={{ __html: result.embedHTML }}
              />
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex gap-4 justify-center pt-8"
            >
              <Button
                variant="outline"
                onClick={() => navigate("/")}
              >
                Take Quiz Again
              </Button>
              <Button onClick={() => navigate("/admin")}>
                View Admin Panel
              </Button>
            </motion.div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default Results;
