"use client";

import * as React from "react";
import {
  IconFileTypePdf,
  IconFileUpload,
  IconListCheck,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";

import type { CreateQuestionPayload, ParsedQuestion } from "../types";
import {
  useBulkCreateQuestions,
  useExtractQuestions,
} from "../hooks/use-quiz-builder";

interface PdfUploadPanelProps {
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

export function PdfUploadPanel({ onImported }: PdfUploadPanelProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [parsedQuestions, setParsedQuestions] = React.useState<
    ParsedQuestion[]
  >([]);
  const [selectedIndices, setSelectedIndices] = React.useState<Set<number>>(
    new Set(),
  );

  const extractMutation = useExtractQuestions();
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

  async function handleExtract() {
    if (!file) return;
    const result = await extractMutation.mutateAsync(file);
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
  const progressValue = extractMutation.isPending
    ? 60
    : parsedQuestions.length > 0
      ? 100
      : 0;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex items-start gap-3 rounded-3xl border border-border/70 bg-muted/30 p-4">
        <div className="rounded-2xl bg-background p-2 shadow-sm">
          <IconFileTypePdf className="size-5 text-rose-600" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">Upload a PDF</h3>
          <p className="text-sm text-muted-foreground">
            The PDF is sent to Claude for structured extraction, then you can
            review and import the detected questions.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-3xl border border-dashed border-border/70 bg-muted/20 p-4">
        <input
          type="file"
          accept="application/pdf"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="block w-full cursor-pointer text-sm file:mr-4 file:rounded-xl file:border-0 file:bg-primary file:px-4 file:py-2 file:text-primary-foreground"
        />
        <div className="flex items-center gap-2">
          <Button
            onClick={handleExtract}
            disabled={!file || extractMutation.isPending}
            className="rounded-xl"
          >
            <IconFileUpload className="mr-1 size-4" />
            {extractMutation.isPending ? "Extracting..." : "Extract questions"}
          </Button>
          <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
            {file ? file.name : "No file selected"}
          </Badge>
        </div>
        <Progress value={progressValue} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
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
                  <IconListCheck className="size-10 text-muted-foreground/30" />
                  <p className="mt-3 text-sm font-medium text-muted-foreground">
                    Extracted questions will appear here
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    Upload a PDF to preview each detected question before
                    importing it.
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
