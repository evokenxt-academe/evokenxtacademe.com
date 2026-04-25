"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  IconClock,
  IconLoader2,
  IconCheck,
  IconTrophy,
  IconArrowRight,
  IconArrowLeft,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface QuizOption {
  id: string;
  text: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  marks: number;
  position: number;
  options: QuizOption[];
}

interface QuizDetail {
  id: string;
  title: string;
  description: string | null;
  type: string;
  totalMarks: number;
  passingMarks: number;
  timeLimitSec: number | null;
  sectionTitle: string;
  courseName: string;
  courseSlug: string;
  questions: QuizQuestion[];
}

interface QuizAttemptResult {
  attemptId: string;
  score: number;
  totalMarks: number;
  passingMarks: number;
  passed: boolean;
  status: string;
}

type Phase = "intro" | "active" | "submitting" | "result";

interface QuizPlayerProps {
  quiz: QuizDetail;
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function QuizPlayer({ quiz }: QuizPlayerProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizAttemptResult | null>(null);
  const [timeLeft, setTimeLeft] = useState(quiz.timeLimitSec ?? 0);
  const [isStarting, setIsStarting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentQuestion = quiz.questions[currentIndex] ?? null;
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = quiz.questions.length;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  useEffect(() => {
    if (phase === "active" && quiz.timeLimitSec && quiz.timeLimitSec > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [phase, quiz.timeLimitSec]);

  const handleSubmit = useCallback(async () => {
    if (!attemptId || phase !== "active") return;
    setPhase("submitting");
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const answerArray = Object.entries(answers).map(([questionId, selectedOptionId]) => ({
        questionId,
        selectedOptionId,
      }));

      const response = await fetch(`/api/student/quiz/${quiz.id}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit", attemptId, answers: answerArray }),
      });

      if (!response.ok) {
        toast.error("Failed to submit quiz");
        setPhase("active");
        return;
      }

      const data = (await response.json()) as QuizAttemptResult;
      setResult(data);
      setPhase("result");
    } catch {
      toast.error("Failed to submit quiz");
      setPhase("active");
    }
  }, [attemptId, answers, quiz.id, phase]);

  useEffect(() => {
    if (phase === "active" && quiz.timeLimitSec && timeLeft <= 0) {
      handleSubmit();
    }
  }, [timeLeft, phase, quiz.timeLimitSec, handleSubmit]);

  const handleStart = async () => {
    if (isStarting) return;
    setIsStarting(true);
    try {
      const response = await fetch(`/api/student/quiz/${quiz.id}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      if (!response.ok) {
        toast.error("Could not start quiz");
        setIsStarting(false);
        return;
      }
      const data = (await response.json()) as { attemptId: string };
      setAttemptId(data.attemptId);
      setTimeLeft(quiz.timeLimitSec ?? 0);
      setPhase("active");
    } catch {
      toast.error("Could not start quiz");
    } finally {
      setIsStarting(false);
    }
  };

  const selectAnswer = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  // ─── INTRO ────────────────────────────
  if (phase === "intro") {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 py-8">
        <div className="text-center">
          <Badge variant="secondary" className="mb-3">
            {quiz.type === "graded" ? "Graded Quiz" : quiz.type === "final" ? "Final Exam" : "Practice Quiz"}
          </Badge>
          <h1 className="text-2xl font-semibold md:text-3xl">{quiz.title}</h1>
          {quiz.description && <p className="mt-2 text-muted-foreground">{quiz.description}</p>}
          <p className="mt-1 text-sm text-muted-foreground">
            {quiz.courseName} → {quiz.sectionTitle}
          </p>
        </div>

        <div className="grid w-full max-w-sm grid-cols-2 gap-3">
          {[
            { label: "Questions", value: totalQuestions },
            { label: "Total marks", value: quiz.totalMarks },
            { label: "Pass marks", value: quiz.passingMarks },
            { label: "Time limit", value: quiz.timeLimitSec ? formatTimer(quiz.timeLimitSec) : "No limit" },
          ].map((item) => (
            <Card key={item.label}>
              <CardContent className="p-4 text-center">
                <div className="text-xl font-semibold">{item.value}</div>
                <div className="text-xs text-muted-foreground">{item.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button onClick={handleStart} disabled={isStarting} size="lg">
          {isStarting ? <IconLoader2 className="mr-2 size-4 animate-spin" /> : <IconArrowRight className="mr-2 size-4" />}
          Start Quiz
        </Button>
      </div>
    );
  }

  // ─── RESULT ───────────────────────────
  if (phase === "result" && result) {
    const scorePercent = result.totalMarks > 0 ? Math.round((result.score / result.totalMarks) * 100) : 0;

    return (
      <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-6 py-8">
        <div className={`flex size-20 items-center justify-center rounded-full ${result.passed ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"}`}>
          {result.passed ? <IconTrophy className="size-10" /> : <IconAlertTriangle className="size-10" />}
        </div>

        <div className="text-center">
          <Badge variant={result.passed ? "default" : "destructive"}>
            {result.passed ? "Passed" : "Not Passed"}
          </Badge>
          <h1 className="mt-2 text-2xl font-semibold">
            {result.passed ? "Congratulations!" : "Keep Practicing"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {result.passed
              ? "You have successfully passed this quiz."
              : `You need ${result.passingMarks} marks to pass.`}
          </p>
        </div>

        <Card className="w-full">
          <CardContent className="p-6 text-center">
            <div className="text-4xl font-semibold">{result.score}/{result.totalMarks}</div>
            <div className="mt-1 text-sm text-muted-foreground">{scorePercent}% score</div>
            <Progress value={scorePercent} className="mt-4" />
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push(`/learn/${quiz.courseSlug}`)}>
            <IconArrowLeft className="mr-1 size-4" /> Back to course
          </Button>
          <Button onClick={() => router.push("/dashboard")}>Dashboard</Button>
        </div>
      </div>
    );
  }

  // ─── SUBMITTING ───────────────────────
  if (phase === "submitting") {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
        <IconLoader2 className="size-8 animate-spin text-primary" />
        <p className="font-medium">Submitting your answers...</p>
      </div>
    );
  }

  // ─── ACTIVE ───────────────────────────
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            Question <strong>{currentIndex + 1}</strong> of <strong>{totalQuestions}</strong>
          </span>
          <Badge variant="secondary">{answeredCount}/{totalQuestions} answered</Badge>
        </div>
        <div className="flex items-center gap-2">
          {quiz.timeLimitSec && quiz.timeLimitSec > 0 && (
            <Badge variant={timeLeft <= 60 ? "destructive" : "outline"} className="font-mono">
              <IconClock className="mr-1 size-3" />
              {formatTimer(timeLeft)}
            </Badge>
          )}
          <Button onClick={handleSubmit} size="sm" disabled={answeredCount === 0}>
            Submit Quiz
          </Button>
        </div>
      </div>

      <Progress value={progressPercent} className="h-1" />

      {/* Question */}
      {currentQuestion && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="outline">{currentQuestion.marks} {currentQuestion.marks === 1 ? "mark" : "marks"}</Badge>
            </div>
            <CardTitle className="text-lg">{currentQuestion.question}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {currentQuestion.options.map((option) => {
              const isSelected = answers[currentQuestion.id] === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => selectAnswer(currentQuestion.id, option.id)}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "hover:bg-accent"
                  }`}
                >
                  <div className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 ${isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"}`}>
                    {isSelected && <IconCheck className="size-3" />}
                  </div>
                  <span className="text-sm">{option.text}</span>
                </button>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Nav */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" disabled={currentIndex === 0} onClick={() => setCurrentIndex((i) => i - 1)}>
          <IconArrowLeft className="mr-1 size-4" /> Previous
        </Button>
        <div className="flex flex-wrap justify-center gap-1">
          {quiz.questions.map((q, i) => (
            <button
              key={q.id}
              type="button"
              onClick={() => setCurrentIndex(i)}
              className={`flex size-7 items-center justify-center rounded text-xs font-medium transition-colors ${
                i === currentIndex ? "bg-primary text-primary-foreground" : answers[q.id] ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" disabled={currentIndex === totalQuestions - 1} onClick={() => setCurrentIndex((i) => i + 1)}>
          Next <IconArrowRight className="ml-1 size-4" />
        </Button>
      </div>
    </div>
  );
}
