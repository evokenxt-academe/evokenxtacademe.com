"use client";

import * as React from "react";
import { useStudentQuizResult } from "@/hooks/useQuizzes";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Target,
  Trophy,
  Lightbulb,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";

interface StudentQuizDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quizId: string;
  student: {
    userId: string;
    name: string;
    email: string;
    avatar: string | null;
    initials: string;
  } | null;
}

export function StudentQuizDetailSheet({
  open,
  onOpenChange,
  quizId,
  student,
}: StudentQuizDetailSheetProps) {
  const { data: result, isLoading, error } = useStudentQuizResult(
    quizId,
    student?.userId ?? null
  );

  const durationText = React.useMemo(() => {
    if (!result?.durationSec) return "—";
    const mins = Math.floor(result.durationSec / 60);
    const secs = result.durationSec % 60;
    return `${mins}m ${secs}s`;
  }, [result?.durationSec]);

  const initials = student?.initials || "??";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col h-full max-h-screen overflow-hidden p-0 gap-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle className="text-xl font-bold flex items-center gap-2">
            Assessment Details
          </SheetTitle>
          <SheetDescription>
            Detailed review of student's answers, score breakdown, and performance
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-60" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
        ) : error || !result ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle className="h-10 w-10 text-destructive mb-2" />
            <h3 className="font-semibold text-lg">Error loading result</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {error instanceof Error ? error.message : "Failed to load student attempt details."}
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Header info */}
            <div className="p-6 bg-muted/30 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-primary/10">
                  <AvatarImage src={student?.avatar || undefined} />
                  <AvatarFallback className="font-bold">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-base text-foreground leading-tight">
                    {result.student?.name || student?.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {result.student?.email || student?.email}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={result.passed ? "secondary" : "destructive"}
                  className={
                    result.passed
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 font-medium px-2.5 py-0.5 border border-emerald-200 dark:border-emerald-900"
                      : "font-medium px-2.5 py-0.5"
                  }
                >
                  {result.passed ? "PASSED" : "FAILED"}
                </Badge>
                <Badge variant="outline" className="bg-background text-muted-foreground border-border">
                  Score: {result.score} / {result.totalMarks} ({result.percentage}%)
                </Badge>
              </div>
            </div>

            {/* Performance Stats Cards */}
            <div className="p-6 border-b grid grid-cols-3 gap-3 md:gap-4 bg-background">
              <div className="rounded-xl border bg-card p-3 md:p-4 text-card-foreground shadow-xs flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-muted-foreground font-medium">Correct</span>
                  <span className="text-lg font-bold text-foreground leading-none mt-1">
                    {result.correctCount}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border bg-card p-3 md:p-4 text-card-foreground shadow-xs flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400">
                  <XCircle className="h-5 w-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-muted-foreground font-medium">Incorrect</span>
                  <span className="text-lg font-bold text-foreground leading-none mt-1">
                    {result.incorrectCount}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border bg-card p-3 md:p-4 text-card-foreground shadow-xs flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-muted-foreground font-medium">Unanswered</span>
                  <span className="text-lg font-bold text-foreground leading-none mt-1">
                    {result.unansweredCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Metadata Info */}
            <div className="px-6 py-3 bg-muted/20 border-b flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-4">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Time Spent: <span className="font-semibold text-foreground">{durationText}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Submitted:{" "}
                <span className="font-semibold text-foreground">
                  {result.submittedAt
                    ? format(new Date(result.submittedAt), "MMM d, yyyy HH:mm")
                    : "—"}
                </span>
              </span>
            </div>

            {/* Questions List */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="p-6 space-y-6">
                <h4 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground mb-4">
                  Question Review
                </h4>

                {result.review?.map((rev: any) => {
                  const statusBorderColor = rev.isUnanswered
                    ? "border-amber-200 dark:border-amber-900 bg-amber-50/10"
                    : rev.isCorrect
                    ? "border-emerald-200 dark:border-emerald-900 bg-emerald-50/10"
                    : "border-rose-200 dark:border-rose-900 bg-rose-50/10";

                  return (
                    <div
                      key={rev.questionId}
                      className={`p-5 rounded-xl border ${statusBorderColor} transition-all duration-200`}
                    >
                      {/* Question Header */}
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-foreground/5 text-foreground/80">
                            Q{rev.questionNumber}
                          </span>
                          <span className="text-xs text-muted-foreground font-medium">
                            {rev.marks} Mark{rev.marks !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {rev.isUnanswered ? (
                            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Unanswered
                            </Badge>
                          ) : rev.isCorrect ? (
                            <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Correct
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900 flex items-center gap-1">
                              <XCircle className="h-3 w-3" />
                              Incorrect
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Question Text */}
                      <p className="text-sm font-semibold text-foreground mb-4 leading-relaxed">
                        {rev.question}
                      </p>

                      {/* Options */}
                      <div className="space-y-2 mb-4">
                        {rev.options?.map((opt: any) => {
                          let optStyle = "border-border bg-background hover:bg-muted/10";
                          let checkIcon: React.ReactNode = null;

                          if (opt.isSelected) {
                            if (opt.isCorrect) {
                              optStyle = "border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200 font-medium";
                              checkIcon = <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />;
                            } else {
                              optStyle = "border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200 font-medium";
                              checkIcon = <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />;
                            }
                          } else if (opt.isCorrect) {
                            // Highlight correct option if student got it wrong or unanswered
                            optStyle = "border-emerald-400 border-dashed bg-emerald-50/10 dark:bg-emerald-950/5 text-emerald-800 dark:text-emerald-300 font-medium";
                          }

                          return (
                            <div
                              key={opt.id}
                              className={`flex items-center justify-between p-3 rounded-lg border text-sm transition-colors duration-150 ${optStyle}`}
                            >
                              <span className="leading-snug">{opt.text}</span>
                              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                {opt.isCorrect && !opt.isSelected && (
                                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-sm bg-emerald-100/50 dark:bg-emerald-950/30">
                                    Correct Answer
                                  </span>
                                )}
                                {checkIcon}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      {rev.explanation && (
                        <div className="mt-4 pt-3 border-t border-dashed border-border/80 flex gap-2.5 items-start bg-muted/20 p-3 rounded-lg">
                          <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-foreground">Explanation:</span>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {rev.explanation}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
