"use client";

import * as React from "react";
import {
  IconSearch,
  IconFilter,
  IconPlus,
  IconLibrary,
} from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

import type { QuestionBankItem, QuestionType, DifficultyLevel } from "../types";
import { QUESTION_TYPE_LABELS, DIFFICULTY_LABELS } from "../types";
import { useQuestionBank } from "../hooks/use-quiz-builder";
import { QuestionCard } from "./question-form";
import { QuestionFormSheet } from "./question-form-sheet";

interface QuestionBankPanelProps {
  onAddToQuiz: (questionIds: string[]) => void;
  isAddingToQuiz: boolean;
  existingQuestionIds: Set<string>;
}

export function QuestionBankPanel({
  onAddToQuiz,
  isAddingToQuiz,
  existingQuestionIds,
}: QuestionBankPanelProps) {
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = React.useState<string>("all");
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingQuestion, setEditingQuestion] =
    React.useState<QuestionBankItem | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useQuestionBank({
    search: debouncedSearch || undefined,
    type: typeFilter !== "all" ? (typeFilter as QuestionType) : undefined,
    difficulty:
      difficultyFilter !== "all"
        ? (difficultyFilter as DifficultyLevel)
        : undefined,
  });

  const questions = data?.questions ?? [];
  const total = data?.total ?? 0;

  function toggleSelection(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleAddSelected() {
    if (selectedIds.size === 0) return;
    onAddToQuiz(Array.from(selectedIds));
    setSelectedIds(new Set());
  }

  function handleEdit(question: QuestionBankItem) {
    setEditingQuestion(question);
    setIsFormOpen(true);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-1 pb-4">
        <div className="flex items-center gap-2">
          <IconLibrary className="size-5 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Question Bank</h3>
          <Badge
            variant="secondary"
            className="rounded-full px-2 py-0.5 text-[11px]"
          >
            {total}
          </Badge>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditingQuestion(null);
            setIsFormOpen(true);
          }}
          className="rounded-xl text-xs"
        >
          <IconPlus data-icon="inline-start" />
          New
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 pb-3">
        <div className="relative">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            className="h-9 rounded-xl pl-9 text-sm"
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-8 rounded-xl text-xs flex-1">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {Object.entries(QUESTION_TYPE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="h-8 rounded-xl text-xs flex-1">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All levels</SelectItem>
              {Object.entries(DIFFICULTY_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Selection Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between rounded-xl bg-primary/5 border border-primary/20 px-3 py-2 mb-3">
          <span className="text-xs font-medium text-primary">
            {selectedIds.size} selected
          </span>
          <Button
            size="sm"
            onClick={handleAddSelected}
            disabled={isAddingToQuiz}
            className="rounded-xl text-xs h-7"
          >
            {isAddingToQuiz ? "Adding..." : "Add to Quiz"}
          </Button>
        </div>
      )}

      {/* Question List */}
      <ScrollArea className="flex-1 -mx-1">
        <div className="flex flex-col gap-2 px-1 pb-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))
          ) : questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <IconLibrary className="size-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                No questions found
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Create your first question to get started
              </p>
            </div>
          ) : (
            questions.map((q) => {
              const isAlreadyInQuiz = existingQuestionIds.has(q.id);
              return (
                <div key={q.id} className={cn(isAlreadyInQuiz && "opacity-50")}>
                  <QuestionCard
                    question={q}
                    compact
                    isSelected={selectedIds.has(q.id)}
                    onSelect={
                      isAlreadyInQuiz ? undefined : () => toggleSelection(q.id)
                    }
                    onEdit={() => handleEdit(q)}
                  />
                  {isAlreadyInQuiz && (
                    <p className="text-[10px] text-muted-foreground mt-1 ml-8">
                      Already in quiz
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Form Dialog */}
      <QuestionFormSheet
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setEditingQuestion(null);
          }
        }}
        editingQuestion={editingQuestion}
      />
    </div>
  );
}

// ── useDebounce hook ──────────────────────────────────────────

function useDebounce(value: string, delay: number): string {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
