"use client";

import * as React from "react";
import {
  IconClipboardText,
  IconFileImport,
  IconListCheck,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

import type { CreateQuestionPayload, ParsedQuestion } from "../types";
import {
  useBulkCreateQuestions,
  useParseQuestions,
} from "../hooks/use-quiz-builder";

interface PasteImportPanelProps {
  onImported?: () => void;
}

function toCreatePayload(question: ParsedQuestion): CreateQuestionPayload {
  return {
    question: question.question,
    type: question.type,
    explanation: question.explanation,
    difficulty: question.difficulty,
    tags: question.tags ?? [],
    marks: question.marks,
    options: (question.options ?? []).map((option, index) => ({
      text: option.text,
      isCorrect: option.isCorrect,
      position: index,
    })),
  };
}

export function PasteImportPanel({ onImported }: PasteImportPanelProps) {
  const [text, setText] = React.useState("");
  const [parsedQuestions, setParsedQuestions] = React.useState<
    ParsedQuestion[]
  >([]);
  const [selectedIndices, setSelectedIndices] = React.useState<Set<number>>(
    new Set(),
  );

  const parseMutation = useParseQuestions();
  const importMutation = useBulkCreateQuestions();

  function toggleSelected(index: number) {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  async function handleParse() {
    const result = await parseMutation.mutateAsync(text);
    setParsedQuestions(result.questions);
    setSelectedIndices(new Set(result.questions.map((_, index) => index)));
  }

  async function handleImport() {
    const selectedQuestions = parsedQuestions.filter((_, index) =>
      selectedIndices.has(index),
    );
    if (selectedQuestions.length === 0) return;

    await importMutation.mutateAsync({
      questions: selectedQuestions.map(toCreatePayload),
    });
    onImported?.();
  }

  const selectedCount = selectedIndices.size;
  const canImport = selectedCount > 0 && !importMutation.isPending;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex items-start gap-3 rounded-3xl border border-border/70 bg-muted/30 p-4">
        <div className="rounded-2xl bg-background p-2 shadow-sm">
          <IconClipboardText className="size-5 text-primary" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">Paste questions</h3>
          <p className="text-sm text-muted-foreground">
            Paste plain text, JSON, or lightly structured exam content. The
            parser will normalize it into question-bank entries.
          </p>
        </div>
      </div>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={
          "1. What is 2 + 2?\nA) 3\nB) 4\nAnswer: B\n\n2. Define revenue recognition..."
        }
        className="min-h-45 flex-1 resize-none rounded-3xl"
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={handleParse}
          disabled={!text.trim() || parseMutation.isPending}
          className="rounded-xl"
        >
          <IconListCheck className="mr-1 size-4" />
          {parseMutation.isPending ? "Parsing..." : "Parse questions"}
        </Button>
        <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
          {parsedQuestions.length} detected
        </Badge>
        <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
          {selectedCount} selected
        </Badge>
      </div>

      <Card className="min-h-0 flex-1 rounded-3xl border-border/70">
        <CardContent className="h-full p-0">
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-3 p-4">
              {parsedQuestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <IconFileImport className="size-10 text-muted-foreground/30" />
                  <p className="mt-3 text-sm font-medium text-muted-foreground">
                    Parsed questions will appear here
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    Paste content, then parse to preview the generated question
                    cards.
                  </p>
                </div>
              ) : (
                parsedQuestions.map((question, index) => (
                  <label
                    key={`${question.question}-${index}`}
                    className="flex cursor-pointer gap-3 rounded-2xl border border-border/60 bg-background p-3 transition-colors hover:border-primary/40"
                  >
                    <Checkbox
                      checked={selectedIndices.has(index)}
                      onCheckedChange={() => toggleSelected(index)}
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="rounded-full px-2 py-0.5 text-[11px]"
                        >
                          Q{index + 1}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="rounded-full px-2 py-0.5 text-[11px] capitalize"
                        >
                          {question.type.replace(/_/g, " ")}
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
                          {question.marks} marks
                        </Badge>
                      </div>
                      <p className="text-sm font-medium leading-6">
                        {question.question}
                      </p>
                      {question.explanation ? (
                        <p className="text-xs text-muted-foreground">
                          {question.explanation}
                        </p>
                      ) : null}
                      {question.tags?.length ? (
                        <div className="flex flex-wrap gap-1.5">
                          {question.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="rounded-full px-2 py-0.5 text-[10px]"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </label>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button
          onClick={handleImport}
          disabled={!canImport}
          className="rounded-xl"
        >
          {importMutation.isPending
            ? "Importing..."
            : `Import ${selectedCount} question${selectedCount === 1 ? "" : "s"}`}
        </Button>
      </div>
    </div>
  );
}
