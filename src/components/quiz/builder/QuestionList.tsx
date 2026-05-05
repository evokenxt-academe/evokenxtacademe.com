"use client";

import { useQuestions, useDeleteQuestion, useReorderQuestions } from "@/hooks/useQuestions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { GripVertical, Trash2, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

interface QuestionListProps {
  quizId: string;
  activeId: string | null;
  onSelect: (id: string | null) => void;
}

export function QuestionList({ quizId, activeId, onSelect }: QuestionListProps) {
  const { data: questions, isLoading } = useQuestions(quizId);
  const deleteMutation = useDeleteQuestion(quizId);
  const reorderMutation = useReorderQuestions(quizId);
  const [localItems, setLocalItems] = useState(questions ?? []);

  useEffect(() => {
    setLocalItems(questions ?? []);
  }, [questions]);

  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    const items = Array.from(localItems);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    setLocalItems(items);
    reorderMutation.mutate(items.map((q) => q.id));
  };

  if (isLoading) {
    return <div className="space-y-2 p-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
  }

  const totalMarks = localItems.reduce((acc, q) => acc + (q.marks || 0), 0);

  return (
    <div className="flex h-full flex-col bg-muted/10 border-r">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Questions ({localItems.length})</h3>
          <Badge variant="secondary" className="font-mono text-xs">{totalMarks} marks</Badge>
        </div>
        <Button className="w-full" size="sm" onClick={() => onSelect(null)}>
          <Plus className="mr-2 h-4 w-4" />New Question
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="questions">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="p-2 space-y-1">
                {localItems.map((q, index) => (
                  <Draggable key={q.id} draggableId={q.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`group flex items-center gap-2 rounded-md border p-2 text-sm transition-colors ${
                          snapshot.isDragging ? "bg-accent shadow-md border-primary/50" :
                          activeId === q.id ? "bg-primary/5 border-primary ring-1 ring-primary/20" : "bg-card hover:border-border"
                        }`}
                        onClick={() => onSelect(q.id)}
                      >
                        <div {...provided.dragHandleProps} className="cursor-grab text-muted-foreground/40 hover:text-foreground">
                          <GripVertical className="h-4 w-4" />
                        </div>
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-muted text-[10px] font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1 truncate font-medium">
                          {q.question_text || <span className="text-muted-foreground italic">Empty question</span>}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{q.marks}m</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(q.id); if (activeId === q.id) onSelect(null); }}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </ScrollArea>
    </div>
  );
}
