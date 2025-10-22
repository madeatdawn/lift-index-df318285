import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuiz } from "@/contexts/QuizContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";

const Admin = () => {
  const navigate = useNavigate();
  const { quizData, updateQuizData } = useQuiz();
  const [editedData, setEditedData] = useState(quizData);

  useEffect(() => {
    const isLovableEnvironment = 
      window.location.hostname.includes('lovable.app') || 
      window.location.hostname.includes('lovable.dev') ||
      window.location.hostname === 'localhost';
    
    if (!isLovableEnvironment) {
      navigate("/");
    }
  }, [navigate]);

  const handleSave = () => {
    updateQuizData(editedData);
    toast.success("Quiz data saved successfully!");
  };

  const updateQuestion = (questionIndex: number, field: string, value: string) => {
    const newData = { ...editedData };
    if (field === "question") {
      newData.questions[questionIndex].question = value;
    }
    setEditedData(newData);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const newData = { ...editedData };
    newData.questions[questionIndex].options[optionIndex].text = value;
    setEditedData(newData);
  };

  const updateResult = (resultIndex: number, field: string, value: string | number) => {
    const newData = { ...editedData };
    if (field === "name") newData.results[resultIndex].name = value as string;
    else if (field === "minScore") newData.results[resultIndex].minScore = parseFloat(value as string);
    else if (field === "maxScore") newData.results[resultIndex].maxScore = parseFloat(value as string);
    else if (field === "description") newData.results[resultIndex].description = value as string;
    else if (field === "embedHTML") newData.results[resultIndex].embedHTML = value as string;
    setEditedData(newData);
  };

  return (
    <div className="min-h-screen p-6" style={{ background: "var(--gradient-subtle)" }}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/")} size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Admin Panel
            </h1>
          </div>
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>

        <Tabs defaultValue="questions" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          <TabsContent value="questions" className="space-y-6">
            {editedData.questions.map((question, qIndex) => (
              <Card key={question.id} className="p-6" style={{ background: "var(--gradient-card)" }}>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Question {qIndex + 1}
                    </label>
                    <Textarea
                      value={question.question}
                      onChange={(e) => updateQuestion(qIndex, "question", e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-muted-foreground">Options</label>
                    {question.options.map((option, oIndex) => (
                      <div key={option.id} className="flex gap-2 items-start">
                        <span className="mt-3 text-sm font-medium text-primary">
                          {option.id.toUpperCase()})
                        </span>
                        <Textarea
                          value={option.text}
                          onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          value={option.value}
                          disabled
                          className="w-16 text-center"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            {editedData.results.map((result, rIndex) => (
              <Card key={result.id} className="p-6" style={{ background: "var(--gradient-card)" }}>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        Result Name
                      </label>
                      <Input
                        value={result.name}
                        onChange={(e) => updateResult(rIndex, "name", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        Min Score
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        value={result.minScore}
                        onChange={(e) => updateResult(rIndex, "minScore", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        Max Score
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        value={result.maxScore}
                        onChange={(e) => updateResult(rIndex, "maxScore", e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Description
                    </label>
                    <Textarea
                      value={result.description}
                      onChange={(e) => updateResult(rIndex, "description", e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Embed HTML Code
                    </label>
                    <Textarea
                      value={result.embedHTML}
                      onChange={(e) => updateResult(rIndex, "embedHTML", e.target.value)}
                      placeholder="Paste your HTML embed code here..."
                      className="min-h-[150px] font-mono text-sm"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
