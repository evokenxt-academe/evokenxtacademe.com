"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileUp, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { ParsedQuestion } from "@/features/admin/quiz-builder/types";

type ImportResult = {
  success: true;
  total: number;
  questions: ParsedQuestion[];
};

async function importPdfToQuiz(quizId: string, file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`/api/admin/quizzes/${quizId}/import-pdf`, {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    body: formData,
  });

  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error || `Request failed (${res.status})`);
  }

  return res.json() as Promise<ImportResult>;
}

function typeLabel(type: ParsedQuestion["type"]) {
  switch (type) {
    case "mcq":
      return "mcq";
    case "multiple_select":
      return "multi_select";
    case "true_or_false":
      return "true_false";
    case "subjective":
      return "short_answer";
    default:
      return type;
  }
}

export function PdfImportEditor({ quizId }: { quizId: string }) {
  const queryClient = useQueryClient();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [lastResult, setLastResult] = React.useState<ImportResult | null>(null);

  const mutation = useMutation({
    mutationFn: ({ file }: { file: File }) => importPdfToQuiz(quizId, file),
    onSuccess: (data) => {
      setLastResult(data);
      queryClient.invalidateQueries({ queryKey: ["quiz-questions", quizId] });
      queryClient.invalidateQueries({ queryKey: ["questions", quizId] }); // legacy builder refresh
      toast.success(`${data.total} question(s) imported`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to import PDF");
    },
  });

  const buttonLabel = mutation.isPending
    ? "Parsing PDF…"
    : mutation.isError
      ? "Retry"
      : lastResult
        ? "Import Another PDF"
        : "Import PDF";

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Please select a PDF file");
      e.target.value = "";
      return;
    }
    mutation.mutate({ file });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold">Import from PDF</h3>
          <p className="text-sm text-muted-foreground">
            Upload a PDF, we’ll extract text and parse questions using deterministic rules.
          </p>
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={onPickFile}
            className="hidden"
          />
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={mutation.isPending}
            className="w-full rounded-xl sm:w-auto"
          >
            <FileUp className="mr-2 size-4" />
            {buttonLabel}
          </Button>
        </div>
      </div>

      {lastResult && (
        <>
          <Separator />
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Preview ({lastResult.total} detected)
            </p>
          </div>

          <div className="space-y-3">
            {lastResult.questions.map((q, idx) => (
              <div
                key={`${idx}-${q.question.slice(0, 24)}`}
                className="rounded-xl border border-border/60 bg-card p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-relaxed">
                    {q.question}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="rounded-full">
                      {typeLabel(q.type)}
                    </Badge>
                    <Badge variant="outline" className="rounded-full">
                      {q.difficulty}
                    </Badge>
                  </div>
                </div>

                {q.options?.length ? (
                  <div className="mt-3 grid gap-1.5 text-sm text-muted-foreground">
                    {q.options.slice(0, 6).map((opt, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <FileText className="mt-0.5 size-3.5 opacity-60" />
                        <span className={opt.isCorrect ? "font-medium text-foreground" : ""}>
                          {opt.text}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

