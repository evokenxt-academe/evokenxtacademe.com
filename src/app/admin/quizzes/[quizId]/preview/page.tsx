"use client";

import { useParams } from "next/navigation";
import { useQuiz } from "@/hooks/useQuizzes";
import { useQuestions } from "@/hooks/useQuestions";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function QuizPreviewPage() {
  const router = useRouter();
  const { quizId } = useParams() as { quizId: string };
  const { data: quiz, isLoading: quizLoading } = useQuiz(quizId);
  const { data: questions, isLoading: questionsLoading } = useQuestions(quizId);

  const isLoading = quizLoading || questionsLoading;

  return (
    <div className="mx-auto max-w-4xl space-y-6  md:py-10 py-4">
      <div className="flex flex-col gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/admin">Admin</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/admin/quizzes">Quizzes</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {quizLoading ? (
                <Skeleton className="h-4 w-24" />
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={`/admin/quizzes/${quizId}`}>{quiz?.title}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Preview</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Quiz Preview</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {quiz?.title} — Read-only preview of all questions
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))
        ) : !questions || questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 bg-muted/20 rounded-lg border border-dashed">
            <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">
              No questions found in this quiz.
            </p>
            <Button variant="link" asChild className="mt-2">
              <Link href={`/admin/quizzes/${quizId}/builder`}>
                Go to Builder
              </Link>
            </Button>
          </div>
        ) : (
          questions.map((q, idx) => (
            <Card key={q.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                  <CardTitle className="text-base font-semibold">
                    Question {idx + 1}
                  </CardTitle>
                  <div className="text-xs text-muted-foreground">
                    {q.type.replace("_", " ").toUpperCase()} · {q.marks} marks
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className="prose prose-sm dark:prose-invert max-w-none font-medium text-lg mb-4"
                  dangerouslySetInnerHTML={{ __html: q.question_text }}
                />

                {/* Assertion Reasoning Specific */}
                {q.type === "assertion_reasoning" && (
                  <div className="space-y-3 mb-4 p-4 rounded-lg bg-muted/30 border">
                    <div className="space-y-1">
                      <div className="text-xs font-bold uppercase text-muted-foreground">
                        Assertion (A)
                      </div>
                      <div className="text-sm font-medium">
                        {q.assertion_text}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-bold uppercase text-muted-foreground">
                        Reason (R)
                      </div>
                      <div className="text-sm font-medium">{q.reason_text}</div>
                    </div>
                  </div>
                )}

                {/* Options List (MCQ, Multi-select, True/False, Assertion/Reasoning) */}
                {[
                  "mcq",
                  "multiple_select",
                  "true_false",
                  "assertion_reasoning",
                ].includes(q.type) && (
                  <div className="grid gap-2">
                    {q.options?.map((opt: any) => (
                      <div
                        key={opt.id}
                        className={`flex items-center gap-3 p-3 rounded-md border transition-colors ${opt.is_correct ? "border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-900" : "bg-card border-border"}`}
                      >
                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${opt.is_correct ? "bg-green-500 border-green-500 text-white" : "text-muted-foreground"}`}
                        >
                          {String.fromCharCode(65 + (opt.position || 0))}
                        </div>
                        <div className="flex-1 text-sm font-medium">
                          {opt.option_text}
                        </div>
                        {opt.is_correct && (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Numerical Type */}
                {q.type === "numerical" && (
                  <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900">
                    <div className="text-xs font-bold text-green-700 dark:text-green-300 uppercase mb-1">
                      Correct Answer
                    </div>
                    <div className="text-lg font-mono font-bold text-green-600 dark:text-green-400">
                      {q.numerical_answer}
                      {q.numerical_tolerance ? (
                        <span className="text-xs font-normal ml-2">
                          (±{q.numerical_tolerance})
                        </span>
                      ) : (
                        ""
                      )}
                    </div>
                  </div>
                )}

                {/* Subjective/Model Answer */}
                {q.model_answer && (
                  <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border">
                    <div className="text-xs font-bold uppercase text-muted-foreground mb-2">
                      Model Answer
                    </div>
                    <div
                      className="text-sm prose prose-sm dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: q.model_answer }}
                    />
                  </div>
                )}

                {/* Explanation Section */}
                {q.explanation && (
                  <div className="mt-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300 uppercase mb-2">
                      <AlertCircle className="h-3 w-3" />
                      Explanation
                    </div>
                    <div
                      className="text-sm text-blue-600 dark:text-blue-400 prose prose-sm dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: q.explanation }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
