import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuiz } from "@/contexts/QuizContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { AdminPasswordGate } from "@/components/AdminPasswordGate";
import { QuizQuestion, ResultLevel } from "@/types/quiz";
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { SortableOptionItem } from "@/components/admin/SortableOptionItem";

const Admin = () => {
  const navigate = useNavigate();
  const { quizData, updateQuizData } = useQuiz();
  const [editedData, setEditedData] = useState(quizData);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (questionIndex: number) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const newData = { ...editedData };
    const options = newData.questions[questionIndex].options;
    const oldIndex = options.findIndex((o) => o.id === active.id);
    const newIndex = options.findIndex((o) => o.id === over.id);
    newData.questions[questionIndex].options = arrayMove(options, oldIndex, newIndex);
    setEditedData(newData);
  };

  useEffect(() => {
    setEditedData(quizData);
  }, [quizData]);

  const handleSave = () => {
    updateQuizData(editedData);
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

  const updateOptionValue = (questionIndex: number, optionIndex: number, value: number) => {
    const newData = { ...editedData };
    newData.questions[questionIndex].options[optionIndex].value = value;
    setEditedData(newData);
  };

  const addOption = (questionIndex: number) => {
    const newData = { ...editedData };
    const options = newData.questions[questionIndex].options;
    const newId = `opt_${Date.now()}`;
    options.push({ id: newId, text: "New option - edit this text", value: 1 });
    setEditedData(newData);
    toast.info("Option added. Don't forget to save!");
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const newData = { ...editedData };
    if (newData.questions[questionIndex].options.length <= 2) {
      toast.error("Each question must have at least 2 options.");
      return;
    }
    newData.questions[questionIndex].options = newData.questions[questionIndex].options.filter((_, i) => i !== optionIndex);
    setEditedData(newData);
    toast.info("Option removed. Don't forget to save!");
  };

  const addResult = () => {
    const newResult: ResultLevel = {
      id: `result_${Date.now()}`,
      name: "New Result",
      minScore: 0,
      maxScore: 0,
      description: "Edit this description",
      embedHTML: "",
      redirectUrl: "",
    };
    setEditedData({ ...editedData, results: [...editedData.results, newResult] });
    toast.info("Result added. Don't forget to save!");
  };

  const removeResult = (resultIndex: number) => {
    if (editedData.results.length <= 1) {
      toast.error("You must have at least one result.");
      return;
    }
    setEditedData({
      ...editedData,
      results: editedData.results.filter((_, i) => i !== resultIndex),
    });
    toast.info("Result removed. Don't forget to save!");
  };

  const updateResult = (resultIndex: number, field: string, value: string | number) => {
    const newData = { ...editedData };
    if (field === "name") newData.results[resultIndex].name = value as string;
    else if (field === "minScore") newData.results[resultIndex].minScore = parseFloat(value as string);
    else if (field === "maxScore") newData.results[resultIndex].maxScore = parseFloat(value as string);
    else if (field === "description") newData.results[resultIndex].description = value as string;
    else if (field === "embedHTML") newData.results[resultIndex].embedHTML = value as string;
    else if (field === "redirectUrl") newData.results[resultIndex].redirectUrl = value as string;
    setEditedData(newData);
  };

  const addQuestion = () => {
    const newQuestionId = `q${editedData.questions.length + 1}_${Date.now()}`;
    const newQuestion: QuizQuestion = {
      id: newQuestionId,
      question: "New question - edit this text",
      options: [
        { id: "a", text: "Option A - edit this text", value: 1 },
        { id: "b", text: "Option B - edit this text", value: 2 },
        { id: "c", text: "Option C - edit this text", value: 3 },
        { id: "d", text: "Option D - edit this text", value: 4 },
        { id: "e", text: "Option E - edit this text", value: 5 },
      ],
    };
    setEditedData({
      ...editedData,
      questions: [...editedData.questions, newQuestion],
    });
    toast.info("New question added. Don't forget to save!");
  };

  const removeQuestion = (questionIndex: number) => {
    if (editedData.questions.length <= 1) {
      toast.error("You must have at least one question.");
      return;
    }
    const newQuestions = editedData.questions.filter((_, i) => i !== questionIndex);
    setEditedData({
      ...editedData,
      questions: newQuestions,
    });
    toast.info("Question removed. Don't forget to save!");
  };

  return (
    <AdminPasswordGate>
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
            <TabsTrigger value="questions">Questions ({editedData.questions.length})</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          <TabsContent value="questions" className="space-y-6">
            <div className="flex justify-end">
              <Button onClick={addQuestion} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Question
              </Button>
            </div>
            
            {editedData.questions.map((question, qIndex) => (
              <Card key={question.id} className="p-6" style={{ background: "var(--gradient-card)" }}>
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        Question {qIndex + 1}
                      </label>
                      <Textarea
                        value={question.question}
                        onChange={(e) => updateQuestion(qIndex, "question", e.target.value)}
                        className="min-h-[80px]"
                      />
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => removeQuestion(qIndex)}
                      className="mt-6"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-muted-foreground">Options (drag to reorder, scoring: 1-5)</label>
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd(qIndex)}>
                      <SortableContext items={question.options.map((o) => o.id)} strategy={verticalListSortingStrategy}>
                        {question.options.map((option, oIndex) => (
                          <SortableOptionItem
                            key={option.id}
                            option={option}
                            questionIndex={qIndex}
                            optionIndex={oIndex}
                            onUpdateText={updateOption}
                            onUpdateValue={updateOptionValue}
                            onRemove={removeOption}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                    <Button variant="outline" size="sm" onClick={() => addOption(qIndex)} className="gap-1 mt-1">
                      <Plus className="h-3 w-3" />
                      Add Option
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            <div className="flex justify-center pt-4">
              <Button onClick={addQuestion} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Another Question
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            <div className="flex justify-end">
              <Button onClick={addResult} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Result
              </Button>
            </div>
            {editedData.results.map((result, rIndex) => (
              <Card key={result.id} className="p-6" style={{ background: "var(--gradient-card)" }}>
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                  <div className="grid grid-cols-3 gap-4 flex-1">
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
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => removeResult(rIndex)}
                    className="mt-6"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
                      Redirect URL
                    </label>
                    <Input
                      type="url"
                      value={result.redirectUrl}
                      onChange={(e) => updateResult(rIndex, "redirectUrl", e.target.value)}
                      placeholder="https://example.com/result-page"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Embed HTML Code (Optional)
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
    </AdminPasswordGate>
  );
};

export default Admin;
