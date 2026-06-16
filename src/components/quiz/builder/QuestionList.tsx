"use client";

import {
  useQuestions,
  useDeleteQuestion,
  useReorderQuestions,
} from "@/hooks/useQuestions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { GripVertical, Trash2, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";

interface QuestionListProps {
  quizId: string;
  activeId: string | null;
  onSelect: (id: string | null) => void;
  className?: string;
}

export function QuestionList({
  quizId,
  activeId,
  onSelect,
  className,
}: QuestionListProps) {
  const { data: questions, isLoading } = useQuestions(quizId);
  const deleteMutation = useDeleteQuestion(quizId);
  const reorderMutation = useReorderQuestions(quizId);
  const [localItems, setLocalItems] = useState(questions ?? []);

  useEffect(() => {
    setLocalItems(questions ?? []);
  }, [questions]);

  const onDragEnd = (result: {
    destination?: { index: number } | null;
    source: { index: number };
  }) => {
    if (!result.destination) return;
    const items = Array.from(localItems);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    setLocalItems(items);
    reorderMutation.mutate(items.map((q) => q.id));
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-2 p-3", className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  const totalMarks = localItems.reduce((acc, q) => acc + (q.marks || 0), 0);

  return (
    <div
      className={cn(
        "flex h-full min-h-0 w-full flex-col border-r bg-muted/5",
        className,
      )}
    >
      <div className="shrink-0 border-b px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">
              Questions
            </p>
            <p className="text-base font-semibold leading-tight">
              {localItems.length}
              <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                · {totalMarks} marks
              </span>
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 shrink-0 gap-1.5"
            onClick={() => onSelect(null)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {localItems.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm text-muted-foreground">No questions yet</p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Use Add to create your first question
            </p>
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="questions">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-1.5 p-2"
                >
                  {localItems.map((q, index) => (
                    <Draggable key={q.id} draggableId={q.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          role="button"
                          tabIndex={0}
                          onClick={() => onSelect(q.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onSelect(q.id);
                            }
                          }}
                          className={cn(
                            "group relative flex w-full cursor-pointer gap-1.5 rounded-lg border px-2 py-2.5 text-left transition-colors",
                            snapshot.isDragging
                              ? "z-10 border-primary/40 bg-accent shadow-md"
                              : activeId === q.id
                                ? "border-primary/60 bg-primary/5"
                                : "border-transparent bg-card hover:border-border hover:bg-card/80",
                          )}
                        >
                          <div
                            {...provided.dragHandleProps}
                            className="mt-0.5 shrink-0 cursor-grab touch-none text-muted-foreground/30 hover:text-muted-foreground active:cursor-grabbing"
                            onClick={(e) => e.stopPropagation()}
                            aria-label="Drag to reorder"
                          >
                            <GripVertical className="h-4 w-4" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-2">
                              <span className="mt-0.5 shrink-0 text-[11px] font-semibold tabular-nums text-muted-foreground">
                                {index + 1}.
                              </span>
                              <p className="line-clamp-2 text-sm leading-snug text-foreground">
                                {q.question_text || (
                                  <span className="italic text-muted-foreground">
                                    Empty question
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="mt-1.5 flex items-center justify-between pl-5">
                              <span className="text-[11px] text-muted-foreground">
                                {q.marks} mark{q.marks === 1 ? "" : "s"}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground opacity-100 hover:text-destructive md:opacity-0 md:group-hover:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteMutation.mutate(q.id);
                                  if (activeId === q.id) onSelect(null);
                                }}
                                aria-label="Delete question"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
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
        )}
      </div>
    </div>
  );
}
