"use client";

import * as React from "react";
import {
  IconFileImport,
  IconCircleCheck,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

import type { ParsedQuestion } from "../types";
import { QUESTION_TYPE_LABELS } from "../types";

// ── Types ─────────────────────────────────────────────────────

interface QuestionPreviewListProps {
  questions: ParsedQuestion[];
  selectedIndices: Set<number>;
  onToggleSelected: (index: number) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  maxHeight?: string;
}

// ── Component ─────────────────────────────────────────────────

export function QuestionPreviewList({
  questions,
  selectedIndices,
  onToggleSelected,
  emptyTitle = "Parsed questions will appear here",
  emptyDescription = "Paste content and parse to preview generated questions.",
  maxHeight = "400px",
}: QuestionPreviewListProps) {
  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/10 py-16 text-center">
        <IconFileImport className="size-10 text-muted-foreground/30" />
        <p className="mt-3 text-sm font-medium text-muted-foreground">
          {emptyTitle}
        </p>
        <p className="mt-1 max-w-xs text-xs text-muted-foreground/70">
          {emptyDescription}
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="rounded-xl border border-border/60" style={{ maxHeight }}>
      <div className="flex flex-col gap-2 p-3">
        {questions.map((question, index) => (
          <label
            key={`${question.question.slice(0, 40)}-${index}`}
            className="flex cursor-pointer gap-3 rounded-xl border border-border/50 bg-card p-3.5 transition-colors hover:border-primary/30 hover:bg-accent/30"
          >
            <Checkbox
              checked={selectedIndices.has(index)}
              onCheckedChange={() => onToggleSelected(index)}
              className="mt-0.5"
            />
            <div className="min-w-0 flex-1 space-y-2">
              {/* Meta badges */}
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge
                  variant="secondary"
                  className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                >
                  Q{index + 1}
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-full px-2 py-0.5 text-[11px] capitalize"
                >
                  {QUESTION_TYPE_LABELS[question.type] ??
                    question.type.replace(/_/g, " ")}
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-full px-2 py-0.5 text-[11px] capitalize"
                >
                  {question.difficulty}
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-full px-2 py-0.5 text-[11px]"
                >
                  {question.marks} {question.marks === 1 ? "mark" : "marks"}
                </Badge>
              </div>

              {/* Question text */}
              <p className="text-sm font-medium leading-relaxed">
                {question.question}
              </p>

              {/* Options preview */}
              {question.options && question.options.length > 0 && (
                <div className="grid gap-1 sm:grid-cols-2">
                  {question.options.map((opt, optIdx) => (
                    <div
                      key={optIdx}
                      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs ${
                        opt.isCorrect
                          ? "border border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
                          : "border border-border/40 text-muted-foreground"
                      }`}
                    >
                      {opt.isCorrect && (
                        <IconCircleCheck className="size-3 shrink-0" />
                      )}
                      <span className="truncate">{opt.text}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Explanation */}
              {question.explanation && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Explanation:</span>{" "}
                  {question.explanation}
                </p>
              )}

              {/* Tags */}
              {question.tags && question.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {question.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="rounded-full px-2 py-0.5 text-[10px] font-normal"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </label>
        ))}
      </div>
    </ScrollArea>
  );
}
