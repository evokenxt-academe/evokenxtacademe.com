"use client";

import * as React from "react";
import { IconFileTypePdf, IconUpload, IconFileCheck, IconX, IconListCheck } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { ParsedQuestion } from "../types";
import { useExtractQuestions, useImportPdfToQuiz } from "../hooks/use-quiz-builder";
import { QuestionPreviewList } from "./question-preview-list";

interface TabImportPdfProps {
  quizId: string | null;
  onImported?: () => void;
}

export function TabImportPdf({ quizId, onImported }: TabImportPdfProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [parsed, setParsed] = React.useState<ParsedQuestion[]>([]);
  const [selected, setSelected] = React.useState<Set<number>>(new Set());
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const extractMutation = useExtractQuestions();
  const importMutation = useImportPdfToQuiz();

  function toggle(i: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  function handleFileSelect(selectedFile: File | null) {
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setParsed([]);
      setSelected(new Set());
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile ?? null);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave() {
    setIsDragOver(false);
  }

  function removeFile() {
    setFile(null);
    setParsed([]);
    setSelected(new Set());
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleExtract() {
    if (!file) return;
    const result = await extractMutation.mutateAsync(file);
    setParsed(result.questions);
    setSelected(new Set(result.questions.map((_, i) => i)));
  }

  async function handleImport() {
    if (!quizId) return;
    const selectedIndices = parsed
      .map((_, i) => i)
      .filter((i) => selected.has(i));
    if (selectedIndices.length === 0 || !file) return;
    await importMutation.mutateAsync({ quizId, file, selectedIndices });
    removeFile();
    onImported?.();
  }

  const count = selected.size;
  const progress = extractMutation.isPending ? 60 : parsed.length > 0 ? 100 : 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Header info */}
      <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/20 p-4">
        <div className="rounded-xl bg-background p-2 shadow-sm">
          <IconFileTypePdf className="size-5 text-rose-600" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">Import from PDF</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Upload a PDF file containing questions. The system will extract and parse questions for review before importing.
          </p>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors ${
          isDragOver
            ? "border-primary bg-primary/5"
            : file
              ? "border-emerald-500/40 bg-emerald-500/5"
              : "border-border/60 bg-muted/10 hover:border-border hover:bg-muted/20"
        }`}
      >
        {file ? (
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <IconFileCheck className="size-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={removeFile} className="ml-2 size-8 text-muted-foreground hover:text-destructive">
              <IconX className="size-4" />
            </Button>
          </div>
        ) : (
          <>
            <div className="rounded-xl bg-muted/50 p-3">
              <IconUpload className="size-8 text-muted-foreground/50" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">
                Drag & drop your PDF here
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                or click to browse
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="rounded-xl">
              Choose File
            </Button>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
          className="hidden"
        />
      </div>

      {/* Extract button + progress */}
      {file && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Button type="button" onClick={handleExtract} disabled={extractMutation.isPending} className="rounded-xl">
              <IconFileTypePdf className="mr-1.5 size-4" />
              {extractMutation.isPending ? "Extracting..." : "Extract Questions"}
            </Button>
            {parsed.length > 0 && (
              <>
                <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">{parsed.length} detected</Badge>
                <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">{count} selected</Badge>
              </>
            )}
          </div>
          {(extractMutation.isPending || parsed.length > 0) && (
            <Progress value={progress} className="h-1.5" />
          )}
        </div>
      )}

      {/* Preview list */}
      {(parsed.length > 0 || file) && (
        <QuestionPreviewList
          questions={parsed}
          selectedIndices={selected}
          onToggleSelected={toggle}
          emptyTitle="Extracted questions will appear here"
          emptyDescription="Upload a PDF and click Extract to preview detected questions."
        />
      )}

      {/* Import action */}
      {parsed.length > 0 && (
        <div className="flex items-center justify-end gap-3">
          <Button type="button" onClick={handleImport} disabled={count === 0 || importMutation.isPending} className="rounded-xl">
            <IconListCheck className="mr-1.5 size-4" />
            {importMutation.isPending ? "Importing..." : `Add ${count} Question${count === 1 ? "" : "s"} to Bank`}
          </Button>
        </div>
      )}
    </div>
  );
}
