"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconClock,
  IconLoader2,
  IconTrophy,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { QuestionType, QuizAttemptStatus } from "@/types/supabase";
import { cn } from "@/lib/utils";

export type QuizMeta = {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  type: string;
  total_marks: number;
  passing_marks: number;
  time_limit_sec: number | null;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  max_attempts: number | null;
  show_answers_after: "submit" | "pass" | "never";
  course: { title: string; slug: string; id: string };
};

export type QuizOption = { id: string; option_text: string; position: number };

export type QuizQuestion = {
  id: string;
  type: QuestionType;
  question_text: string;
  marks: number;
  negative_marks: number;
  position: number;
  blank_placeholder: string | null;
  assertion_text: string | null;
  reason_text: string | null;
  numerical_answer: number | null;
  numerical_tolerance: number | null;
  is_mandatory: boolean;
  options: QuizOption[] | null;
};

export type PreviousAttempt = {
  id: string;
  score: number | null;
  total_marks: number | null;
  percentage: number | null;
  passed: boolean | null;
  status: QuizAttemptStatus;
  attempt_number: number;
  started_at: string;
  submitted_at: string | null;
  time_spent_sec: number | null;
};

type Phase = "intro" | "active" | "submitting" | "result";

type AnswerDraft =
  | { kind: "mcq"; selected_option_id: string | null }
  | { kind: "multiple_select"; selected_option_ids: string[] }
  | { kind: "true_false"; selected_option_id: string | null }
  | { kind: "fill_blank"; blank_answer: string }
  | { kind: "numerical"; numerical_answer: number | null }
  | { kind: "subjective"; text_answer: string }
  | { kind: "assertion_reasoning"; selected_option_id: string | null };

type SubmitPayload = {
  attemptId: string;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  status: "submitted" | "timed_out";
  timeSpentSec: number;
  canReview: boolean;
  review?: Array<{
    question_id: string;
    question_text: string;
    explanation: string | null;
    is_correct: boolean | null;
    marks_awarded: number | null;
    selected_option_id: string | null;
    selected_option_ids: string[] | null;
    blank_answer: string | null;
    text_answer: string | null;
    numerical_answer: number | null;
    options?: Array<{
      id: string;
      option_text: string;
      option_is_correct: boolean | null;
    }>;
  }>;
};

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function donutPercent(percent: number): {
  strokeDasharray: string;
  label: string;
} {
  const clamped = Math.max(0, Math.min(100, percent));
  const r = 42;
  const c = 2 * Math.PI * r;
  const filled = (clamped / 100) * c;
  return { strokeDasharray: `${filled} ${c - filled}`, label: `${clamped}%` };
}

export function QuizEngine({
  userId: _userId,
  quiz,
  questions,
  attempts,
}: {
  userId: string;
  quiz: QuizMeta;
  questions: QuizQuestion[];
  attempts: PreviousAttempt[];
}) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerDraft>>({});
  const [result, setResult] = useState<SubmitPayload | null>(null);

  const [timeLeft, setTimeLeft] = useState(quiz.time_limit_sec ?? 0);
  const [isStarting, setIsStarting] = useState(false);
  const startedAtRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const orderedQuestions = useMemo(() => {
    const base = [...questions].sort((a, b) => a.position - b.position);
    if (!quiz.shuffle_questions) return base;
    // Deterministic-ish shuffle per attempt; until attempt exists just shuffle once.
    const seed = attemptId ?? quiz.id;
    let x = 0;
    for (let i = 0; i < seed.length; i++)
      x = (x * 31 + seed.charCodeAt(i)) >>> 0;
    for (let i = base.length - 1; i > 0; i--) {
      x = (x * 1664525 + 1013904223) >>> 0;
      const j = x % (i + 1);
      [base[i], base[j]] = [base[j], base[i]];
    }
    return base;
  }, [questions, quiz.shuffle_questions, quiz.id, attemptId]);

  const currentQuestion = orderedQuestions[currentIndex] ?? null;
  const totalQuestions = orderedQuestions.length;

  const answeredCount = useMemo(() => {
    let count = 0;
    for (const q of orderedQuestions) {
      const a = answers[q.id];
      if (!a) continue;
      switch (a.kind) {
        case "mcq":
        case "true_false":
        case "assertion_reasoning":
          if (a.selected_option_id) count++;
          break;
        case "multiple_select":
          if (a.selected_option_ids.length > 0) count++;
          break;
        case "fill_blank":
          if (a.blank_answer.trim().length > 0) count++;
          break;
        case "numerical":
          if (typeof a.numerical_answer === "number") count++;
          break;
        case "subjective":
          if (a.text_answer.trim().length > 0) count++;
          break;
      }
    }
    return count;
  }, [answers, orderedQuestions]);

  const progressPercent =
    totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  // Timer
  useEffect(() => {
    if (phase !== "active") return;
    if (!quiz.time_limit_sec || quiz.time_limit_sec <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, quiz.time_limit_sec]);

  const timeSpentSec = useMemo(() => {
    if (!startedAtRef.current) return 0;
    return Math.max(0, Math.floor((Date.now() - startedAtRef.current) / 1000));
  }, [phase]); // re-evaluated on re-renders

  const buildSubmitBody = useCallback(() => {
    const list = orderedQuestions.map((q) => {
      const a = answers[q.id];
      return { questionId: q.id, answer: a ?? null };
    });
    return list;
  }, [answers, orderedQuestions]);

  const handleStart = useCallback(async () => {
    if (isStarting) return;
    setIsStarting(true);

    try {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch((err) => {
          console.warn("Fullscreen request rejected:", err);
        });
      }
    } catch (err) {
      console.warn("Fullscreen error:", err);
    }

    try {
      const res = await fetch(`/api/student/quiz/${quiz.id}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(payload.error ?? "Could not start quiz");
      }
      const payload = (await res.json()) as {
        attemptId: string;
        attemptNumber: number;
      };
      setAttemptId(payload.attemptId);
      startedAtRef.current = Date.now();
      setTimeLeft(quiz.time_limit_sec ?? 0);
      setPhase("active");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start quiz");
    } finally {
      setIsStarting(false);
    }
  }, [isStarting, quiz.id, quiz.time_limit_sec]);

  const handleSubmit = useCallback(
    async (status: "submitted" | "timed_out" = "submitted") => {
      if (!attemptId || phase !== "active") return;
      setPhase("submitting");
      if (timerRef.current) clearInterval(timerRef.current);

      try {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch((err) => {
            console.warn("Error exiting fullscreen:", err);
          });
        }
      } catch (err) {
        console.warn("Fullscreen exit error:", err);
      }

      const body = buildSubmitBody();
      const spent = startedAtRef.current
        ? Math.max(1, Math.floor((Date.now() - startedAtRef.current) / 1000))
        : 0;

      try {
        const res = await fetch(`/api/student/quiz/${quiz.id}/attempt`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "submit",
            attemptId,
            status,
            timeSpentSec: spent,
            answers: body,
          }),
        });
        if (!res.ok) {
          const payload = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(payload.error ?? "Failed to submit quiz");
        }
        const payload = (await res.json()) as SubmitPayload;
        setResult(payload);
        setPhase("result");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to submit quiz");
        setPhase("active");
      }
    },
    [attemptId, phase, buildSubmitBody, quiz.id],
  );

  useEffect(() => {
    if (phase !== "active") return;
    if (!quiz.time_limit_sec || quiz.time_limit_sec <= 0) return;
    if (timeLeft > 0) return;
    handleSubmit("timed_out");
  }, [timeLeft, phase, quiz.time_limit_sec, handleSubmit]);

  const setAnswer = useCallback((questionId: string, draft: AnswerDraft) => {
    setAnswers((prev) => ({ ...prev, [questionId]: draft }));
  }, []);

  // INTRO
  if (phase === "intro") {
    const maxAttempts = quiz.max_attempts ?? null;
    const attempted = attempts.length;
    const remaining =
      maxAttempts != null ? Math.max(0, maxAttempts - attempted) : null;

    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Card className="overflow-hidden">
          <CardHeader className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{quiz.type}</Badge>
              <Badge variant="outline">{totalQuestions} questions</Badge>
              {quiz.time_limit_sec ? (
                <Badge variant="outline" className="font-mono">
                  <IconClock data-icon="inline-start" />
                  {formatTimer(quiz.time_limit_sec)}
                </Badge>
              ) : (
                <Badge variant="outline">Untimed</Badge>
              )}
            </div>
            <CardTitle className="text-2xl">{quiz.title}</CardTitle>
            {quiz.description ? (
              <p className="text-sm text-muted-foreground">
                {quiz.description}
              </p>
            ) : null}
            <p className="text-sm text-muted-foreground">{quiz.course.title}</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {quiz.instructions ? (
              <div className="rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground">
                {quiz.instructions}
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Questions", value: totalQuestions },
                { label: "Marks", value: quiz.total_marks },
                { label: "Passing", value: quiz.passing_marks },
                {
                  label: "Attempts",
                  value:
                    remaining == null
                      ? `${attempted}`
                      : `${attempted} (${remaining} left)`,
                },
              ].map((s) => (
                <Card key={s.label}>
                  <CardContent className="p-4 text-center">
                    <div className="font-mono text-xl font-semibold tabular-nums">
                      {s.value}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {s.label}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {maxAttempts != null && remaining === 0 ? (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
                <IconAlertTriangle className="mt-0.5 text-destructive" />
                <div>
                  <p className="font-medium">Attempt limit reached</p>
                  <p className="text-sm text-muted-foreground">
                    You’ve used all available attempts for this quiz.
                  </p>
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button asChild variant="outline" size="lg">
                <Link href={`/dashboard/tests`}>
                  <IconArrowLeft data-icon="inline-start" />
                  Back to test
                </Link>
              </Button>
              <Button
                onClick={handleStart}
                disabled={
                  isStarting || (maxAttempts != null && remaining === 0)
                }
                size="lg"
              >
                {isStarting ? (
                  <IconLoader2
                    data-icon="inline-start"
                    className="animate-spin"
                  />
                ) : null}
                Start Quiz
              </Button>
            </div>
          </CardContent>
        </Card>

        {attempts.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Previous attempts</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {attempts.slice(0, 5).map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      Attempt #{a.attempt_number}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {a.submitted_at
                        ? new Date(a.submitted_at).toLocaleString()
                        : "In progress"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={a.passed ? "default" : "secondary"}>
                      {a.passed ? "Passed" : "—"}
                    </Badge>
                    <span className="font-mono text-sm tabular-nums">
                      {a.score ?? 0}/{a.total_marks ?? quiz.total_marks}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>
    );
  }

  // SUBMITTING
  if (phase === "submitting") {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
        <IconLoader2 className="size-8 animate-spin text-primary" />
        <p className="font-medium">Submitting your attempt…</p>
      </div>
    );
  }

  // RESULT
  if (phase === "result" && result) {
    const pct =
      result.totalMarks > 0
        ? Math.round((result.score / result.totalMarks) * 100)
        : 0;
    const d = donutPercent(pct);
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <Card>
          <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <div
                className={cn(
                  "rounded-2xl border p-4",
                  result.passed
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-destructive/30 bg-destructive/5",
                )}
              >
                <svg
                  width="110"
                  height="110"
                  viewBox="0 0 110 110"
                  role="img"
                  aria-label="Score donut"
                >
                  <circle
                    cx="55"
                    cy="55"
                    r="42"
                    fill="none"
                    stroke="color-mix(in oklab, var(--border), transparent 30%)"
                    strokeWidth="10"
                  />
                  <circle
                    cx="55"
                    cy="55"
                    r="42"
                    fill="none"
                    stroke={
                      result.passed
                        ? "color-mix(in oklab, var(--chart-1), white 10%)"
                        : "color-mix(in oklab, var(--destructive), white 5%)"
                    }
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={d.strokeDasharray}
                    transform="rotate(-90 55 55)"
                  />
                  <text
                    x="55"
                    y="61"
                    textAnchor="middle"
                    className="fill-foreground font-mono text-lg"
                  >
                    {d.label}
                  </text>
                </svg>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={result.passed ? "default" : "destructive"}>
                    {result.passed ? (
                      <IconTrophy data-icon="inline-start" />
                    ) : null}
                    {result.passed ? "PASSED" : "FAILED"}
                  </Badge>
                  <Badge variant="outline" className="font-mono">
                    {result.score}/{result.totalMarks}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Passing score: {quiz.passing_marks} · Time taken:{" "}
                  {formatTimer(result.timeSpentSec)}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href={`/learn/${quiz.course.slug}`}>
                  <IconArrowLeft data-icon="inline-start" />
                  Back to test
                </Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {result.canReview && result.review ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Answer review</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {result.review.map((r, idx) => (
                <div key={r.question_id} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">
                        Question {idx + 1}
                      </p>
                      <p className="mt-1 font-medium">{r.question_text}</p>
                    </div>
                    <Badge
                      variant={
                        r.is_correct
                          ? "default"
                          : r.is_correct === false
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {r.is_correct === true
                        ? "Correct"
                        : r.is_correct === false
                          ? "Wrong"
                          : "Pending"}
                    </Badge>
                  </div>
                  {r.explanation ? (
                    <p className="mt-3 text-sm text-muted-foreground">
                      {r.explanation}
                    </p>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>
    );
  }

  // ACTIVE
  const q = currentQuestion;
  if (!q) return null;

  const a = answers[q.id] ?? null;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{quiz.title}</p>
          <p className="text-xs text-muted-foreground">
            {currentIndex + 1} / {totalQuestions}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {quiz.time_limit_sec && quiz.time_limit_sec > 0 ? (
            <Badge
              variant={
                timeLeft <= 60
                  ? "destructive"
                  : timeLeft <= 300
                    ? "secondary"
                    : "outline"
              }
              className="font-mono"
            >
              <IconClock data-icon="inline-start" />
              {formatTimer(timeLeft)}
            </Badge>
          ) : null}
        </div>
      </div>

      <Progress value={progressPercent} className="h-1" />

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{q.type}</Badge>
              <Badge variant="secondary">
                {q.marks} {q.marks === 1 ? "mark" : "marks"}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              Answered: {answeredCount}/{totalQuestions}
            </span>
          </div>
          <CardTitle className="text-lg leading-snug">
            {q.question_text}
          </CardTitle>
          {q.type === "assertion_reasoning" &&
          (q.assertion_text || q.reason_text) ? (
            <div className="mt-2 grid gap-2 text-sm text-muted-foreground">
              {q.assertion_text ? (
                <div className="rounded-lg border bg-muted/30 p-3">
                  <span className="font-medium text-foreground">
                    Assertion (A):{" "}
                  </span>
                  {q.assertion_text}
                </div>
              ) : null}
              {q.reason_text ? (
                <div className="rounded-lg border bg-muted/30 p-3">
                  <span className="font-medium text-foreground">
                    Reason (R):{" "}
                  </span>
                  {q.reason_text}
                </div>
              ) : null}
            </div>
          ) : null}
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {(() => {
            switch (q.type) {
              case "mcq":
              case "true_false":
              case "assertion_reasoning": {
                const options = (q.options ?? [])
                  .slice()
                  .sort((x, y) => x.position - y.position);
                const selected =
                  a && "selected_option_id" in a ? a.selected_option_id : null;
                return (
                  <div className="flex flex-col gap-2">
                    {options.map((opt, idx) => {
                      const isSelected = selected === opt.id;
                      const letter = String.fromCharCode(65 + idx);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() =>
                            setAnswer(q.id, {
                              kind:
                                q.type === "true_false" ? "true_false" : q.type,
                              selected_option_id: opt.id,
                            } as AnswerDraft)
                          }
                          className={cn(
                            "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "hover:bg-accent",
                          )}
                        >
                          <div
                            className={cn(
                              "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 font-mono text-xs",
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-muted-foreground/30 text-muted-foreground",
                            )}
                            aria-hidden
                          >
                            {isSelected ? (
                              <IconCheck className="size-3" />
                            ) : (
                              letter
                            )}
                          </div>
                          <div className="text-sm">{opt.option_text}</div>
                        </button>
                      );
                    })}
                  </div>
                );
              }
              case "multiple_select": {
                const options = (q.options ?? [])
                  .slice()
                  .sort((x, y) => x.position - y.position);
                const selected =
                  a?.kind === "multiple_select" ? a.selected_option_ids : [];
                return (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-muted-foreground">
                      Select all that apply.
                    </p>
                    {options.map((opt) => {
                      const isChecked = selected.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            const next = isChecked
                              ? selected.filter((id) => id !== opt.id)
                              : [...selected, opt.id];
                            setAnswer(q.id, {
                              kind: "multiple_select",
                              selected_option_ids: next,
                            });
                          }}
                          className={cn(
                            "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                            isChecked
                              ? "border-primary bg-primary/5"
                              : "hover:bg-accent",
                          )}
                        >
                          <Checkbox
                            checked={isChecked}
                            aria-label="Select option"
                          />
                          <div className="text-sm">{opt.option_text}</div>
                        </button>
                      );
                    })}
                  </div>
                );
              }
              case "fill_blank": {
                const value = a?.kind === "fill_blank" ? a.blank_answer : "";
                return (
                  <div className="flex flex-col gap-2">
                    <Input
                      value={value}
                      placeholder={q.blank_placeholder ?? "Type your answer"}
                      onChange={(e) =>
                        setAnswer(q.id, {
                          kind: "fill_blank",
                          blank_answer: e.target.value,
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Answer exactly as expected (case-insensitive).
                    </p>
                  </div>
                );
              }
              case "numerical": {
                const value =
                  a?.kind === "numerical" ? a.numerical_answer : null;
                return (
                  <div className="flex flex-col gap-2">
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={value ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        setAnswer(q.id, {
                          kind: "numerical",
                          numerical_answer: v === "" ? null : Number(v),
                        });
                      }}
                      placeholder="Enter a number"
                    />
                    {q.numerical_tolerance != null ? (
                      <p className="text-xs text-muted-foreground">
                        Accept ± {q.numerical_tolerance}
                      </p>
                    ) : null}
                  </div>
                );
              }
              case "subjective": {
                const value = a?.kind === "subjective" ? a.text_answer : "";
                const words = value.trim()
                  ? value.trim().split(/\s+/).length
                  : 0;
                return (
                  <div className="flex flex-col gap-2">
                    <Textarea
                      value={value}
                      onChange={(e) =>
                        setAnswer(q.id, {
                          kind: "subjective",
                          text_answer: e.target.value,
                        })
                      }
                      rows={8}
                      placeholder="Write your answer…"
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Answer will be reviewed manually.</span>
                      <span className="font-mono tabular-nums">
                        {words} words
                      </span>
                    </div>
                  </div>
                );
              }
            }
          })()}

          <Separator />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Button
              variant="outline"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              className="w-full sm:w-auto"
            >
              <IconArrowLeft data-icon="inline-start" />
              Prev
            </Button>
            <div className="flex flex-wrap justify-center gap-1 order-3 sm:order-none">
              {orderedQuestions.map((qq, idx) => {
                const has = answers[qq.id] != null;
                const isCurrent = idx === currentIndex;
                return (
                  <button
                    key={qq.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={cn(
                      "flex size-7 items-center justify-center rounded-md text-xs font-medium transition-colors",
                      isCurrent
                        ? "bg-primary text-primary-foreground"
                        : has
                          ? "bg-primary/15 text-primary hover:bg-primary/20"
                          : "bg-muted text-muted-foreground hover:bg-accent",
                    )}
                    aria-label={`Question ${idx + 1}${has ? " answered" : ""}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            {currentIndex === totalQuestions - 1 ? (
              <Button
                onClick={() => handleSubmit("submitted")}
                disabled={!attemptId}
                className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
              >
                Submit
                <IconCheck className="ml-2 size-4" />
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() =>
                  setCurrentIndex((i) => Math.min(totalQuestions - 1, i + 1))
                }
                className="w-full sm:w-auto"
              >
                Next
                <IconArrowRight className="ml-2 size-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Time spent:{" "}
        <span className="font-mono tabular-nums">
          {formatTimer(timeSpentSec)}
        </span>
      </p>
    </div>
  );
}
