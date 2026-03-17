import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { QuizOption } from "@/types/quiz";

interface SortableOptionItemProps {
  option: QuizOption;
  questionIndex: number;
  optionIndex: number;
  onUpdateText: (qIndex: number, oIndex: number, value: string) => void;
  onUpdateValue: (qIndex: number, oIndex: number, value: number) => void;
  onRemove: (qIndex: number, oIndex: number) => void;
}

export const SortableOptionItem = ({
  option,
  questionIndex,
  optionIndex,
  onUpdateText,
  onUpdateValue,
  onRemove,
}: SortableOptionItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: option.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex gap-2 items-start">
      <button
        type="button"
        className="mt-3 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="mt-3 text-sm font-medium text-primary">
        {option.id.toUpperCase()})
      </span>
      <Textarea
        value={option.text}
        onChange={(e) => onUpdateText(questionIndex, optionIndex, e.target.value)}
        className="flex-1"
      />
      <Input
        type="number"
        value={option.value}
        onChange={(e) => onUpdateValue(questionIndex, optionIndex, parseFloat(e.target.value) || 0)}
        className="w-16 text-center"
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRemove(questionIndex, optionIndex)}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
};
