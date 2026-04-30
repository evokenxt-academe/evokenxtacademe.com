"use client";

import * as React from "react";
import {
  IconGripVertical,
  IconTrash,
  IconEdit,
  IconCopy,
  IconListCheck,
} from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

import type { QuizQuestion, QuestionBankItem } from "../types";
import {
  useQuizQuestions,
  useRemoveQuestionFromQuiz,
  useReorderQuestions,
  useDuplicateQuestion,
} from "../hooks/use-quiz-builder";
import { QuestionCard } from "./question-form";
import { QuestionFormSheet } from "./question-form-sheet";

interface QuizQuestionListProps {
  quizId: string | null;
}

export function QuizQuestionList({ quizId }: QuizQuestionListProps) {
  const { data, isLoading } = useQuizQuestions(quizId);
  const removeMutation = useRemoveQuestionFromQuiz();
  const reorderMutation = useReorderQuestions();
  const duplicateMutation = useDuplicateQuestion();

  const [editingQuestion, setEditingQuestion] =
    React.useState<QuestionBankItem | null>(null);
  const [isEditFormOpen, setIsEditFormOpen] = React.useState(false);
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);

  const questions = data?.questions ?? [];

  // ── Drag & Drop handlers ──────────────────────────────────

  function handleDragStart(e: React.DragEvent, index: number) {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));

    // Make the drag image semi-transparent
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5";
    }
  }

  function handleDragEnd(e: React.DragEvent) {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  }

  function handleDrop(e: React.DragEvent, dropIndex: number) {
    e.preventDefault();
    const dragIndex = draggedIndex;

    if (dragIndex === null || dragIndex === dropIndex || !quizId) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Calculate new order
    const reordered = [...questions];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, moved);

    // Submit reorder
    reorderMutation.mutate({
      quizId,
      orderedIds: reordered.map((q) => q.id),
    });

    setDraggedIndex(null);
    setDragOverIndex(null);
  }

  function handleRemove(quizQuestionId: string) {
    if (!quizId) return;
    removeMutation.mutate({ quizId, quizQuestionId });
  }

  function handleDuplicate(questionId: string) {
    duplicateMutation.mutate(questionId);
  }

  function handleEdit(question: QuestionBankItem) {
    setEditingQuestion(question);
    setIsEditFormOpen(true);
  }

  // ── Render ────────────────────────────────────────────────

  if (!quizId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <IconListCheck className="size-12 text-muted-foreground/20 mb-4" />
        <p className="text-sm font-medium text-muted-foreground">
          Select a section to load or create a quiz
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <IconListCheck className="size-12 text-muted-foreground/20 mb-4" />
        <p className="text-sm font-medium text-muted-foreground">
          No questions in this quiz yet
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1 max-w-xs">
          Create new questions or select from the Question Bank to add them here
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2 pb-3">
        <h3 className="text-sm font-semibold">Quiz Questions</h3>
        <Badge
          variant="secondary"
          className="rounded-full px-2 py-0.5 text-[11px]"
        >
          {questions.length} {questions.length === 1 ? "question" : "questions"}
        </Badge>
        <Badge
          variant="secondary"
          className="rounded-full px-2 py-0.5 text-[11px]"
        >
          {questions.reduce(
            (sum, q) => sum + (q.marksOverride ?? q.question?.marks ?? 0),
            0,
          )}{" "}
          marks total
        </Badge>
      </div>

      <div className="flex flex-col gap-2">
        {questions.map((qq, index) => {
          if (!qq.question) return null;

          const isDragTarget =
            dragOverIndex === index && draggedIndex !== index;

          return (
            <div
              key={qq.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              className={cn(
                "transition-all duration-150",
                draggedIndex === index && "opacity-50",
                isDragTarget && "translate-y-1",
              )}
            >
              {/* Drop indicator line */}
              {isDragTarget && (
                <div className="h-0.5 bg-primary rounded-full mb-1 mx-4" />
              )}

              <QuestionCard
                question={qq.question}
                index={index}
                isDraggable
                onEdit={() => handleEdit(qq.question)}
                onDuplicate={() => handleDuplicate(qq.question.id)}
                onRemove={() => handleRemove(qq.id)}
              />
            </div>
          );
        })}
      </div>

      {/* Edit Form */}
      <QuestionFormSheet
        open={isEditFormOpen}
        onOpenChange={(open) => {
          setIsEditFormOpen(open);
          if (!open) {
            setEditingQuestion(null);
          }
        }}
        editingQuestion={editingQuestion}
      />
    </>
  );
}
