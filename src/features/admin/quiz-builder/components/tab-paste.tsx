"use client";

import * as React from "react";
import { IconClipboardText, IconListCheck, IconSparkles } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { CreateQuestionPayload, ParsedQuestion } from "../types";
import { useBulkCreateQuestions, useParseQuestions } from "../hooks/use-quiz-builder";
import { QuestionPreviewList } from "./question-preview-list";

interface TabPasteProps {
  quizId: string | null;
  onImported?: () => void;
}

function toCreatePayload(q: ParsedQuestion): CreateQuestionPayload {
  return {
    question: q.question,
    type: q.type,
    explanation: q.explanation,
    difficulty: q.difficulty,
    tags: q.tags ?? [],
    marks: q.marks,
    options: (q.options ?? []).map((o, i) => ({ text: o.text, isCorrect: o.isCorrect, position: i })),
  };
}

export function TabPaste({ quizId, onImported }: TabPasteProps) {
  const [text, setText] = React.useState("");
  const [parsed, setParsed] = React.useState<ParsedQuestion[]>([]);
  const [selected, setSelected] = React.useState<Set<number>>(new Set());

  const parseMutation = useParseQuestions();
  const importMutation = useBulkCreateQuestions();

  function toggle(i: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  async function handleParse() {
    const result = await parseMutation.mutateAsync(text);
    setParsed(result.questions);
    setSelected(new Set(result.questions.map((_, i) => i)));
  }

  async function handleImport() {
    const qs = parsed.filter((_, i) => selected.has(i));
    if (qs.length === 0) return;
    await importMutation.mutateAsync({ quizId: quizId ?? undefined, questions: qs.map(toCreatePayload) });
    setText("");
    setParsed([]);
    setSelected(new Set());
    onImported?.();
  }

  const count = selected.size;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/20 p-4">
        <div className="rounded-xl bg-background p-2 shadow-sm">
          <IconClipboardText className="size-5 text-primary" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">Paste Questions</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Paste plain text, JSON, or structured exam content. The parser will normalize it into question-bank entries.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Paste your questions</label>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"1. What is 2 + 2?\nA) 3\nB) 4\nC) 5\nD) 6\nAnswer: B\n\n2. Define revenue recognition.\nAnswer: Revenue recognition is..."}
          className="min-h-[200px] resize-y rounded-xl font-mono text-sm"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={handleParse} disabled={!text.trim() || parseMutation.isPending} className="rounded-xl">
          <IconSparkles className="mr-1.5 size-4" />
          {parseMutation.isPending ? "Parsing..." : "Parse Questions"}
        </Button>
        {parsed.length > 0 && (
          <>
            <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">{parsed.length} detected</Badge>
            <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">{count} selected</Badge>
            <div className="ml-auto flex gap-1.5">
              <Button type="button" variant="ghost" size="sm" onClick={() => setSelected(new Set(parsed.map((_, i) => i)))} className="text-xs">Select All</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setSelected(new Set())} className="text-xs">Deselect All</Button>
            </div>
          </>
        )}
      </div>

      <QuestionPreviewList
        questions={parsed}
        selectedIndices={selected}
        onToggleSelected={toggle}
        emptyTitle="Parsed questions will appear here"
        emptyDescription="Paste content above, then click Parse to preview generated questions."
      />

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
