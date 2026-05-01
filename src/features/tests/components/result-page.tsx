"use client";

import Link from "next/link";
import {
  IconArrowLeft,
  IconCircleCheck,
  IconCircleX,
  IconInfoCircle,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAttemptResult } from "@/features/tests/hooks";

export function ResultPage({ attemptId }: { attemptId: string }) {
  const resultQuery = useAttemptResult(attemptId);

  if (resultQuery.isLoading) {
    return (
      <div className="p-4 md:p-6">
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!resultQuery.data || resultQuery.error) {
    return (
      <div className="p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Result unavailable</CardTitle>
            <CardDescription>
              {resultQuery.error instanceof Error ? resultQuery.error.message : "Unable to load result."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const result = resultQuery.data;
  const isPassed = result.score >= result.passingMarks;
  const attemptedCount = result.correctCount + result.incorrectCount;
  const accuracy = attemptedCount > 0 ? Math.round((result.correctCount / attemptedCount) * 100) : 0;
  const completion = result.review.length > 0 ? Math.round((attemptedCount / result.review.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <Card className="border-border/70">
        <CardHeader className="gap-4 border-b bg-muted/20">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-balance text-lg md:text-2xl">{result.quizTitle}</CardTitle>
              <CardDescription>Attempt summary and answer review</CardDescription>
            </div>
            <Badge variant={isPassed ? "secondary" : "destructive"} className="px-3 py-1 text-sm">
              {isPassed ? "Pass" : "Fail"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 pt-6 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border bg-background p-4">
            <p className="text-2xl font-semibold">
              {result.score}
              <span className="text-base text-muted-foreground">/{result.totalMarks}</span>
            </p>
            <p className="text-sm text-muted-foreground">Final score</p>
          </div>
          <div className="rounded-lg border bg-background p-4">
            <p className="text-2xl font-semibold">{result.passingMarks}</p>
            <p className="text-sm text-muted-foreground">Passing marks</p>
          </div>
          <div className="rounded-lg border bg-background p-4">
            <p className="text-2xl font-semibold">{result.correctCount}</p>
            <p className="text-sm text-muted-foreground">Correct</p>
          </div>
          <div className="rounded-lg border bg-background p-4">
            <p className="text-2xl font-semibold">{accuracy}%</p>
            <p className="text-sm text-muted-foreground">Accuracy</p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="review">Review answers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardContent className="grid gap-3 pt-6 sm:grid-cols-2">
              <div className="rounded-lg border p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
                <p className="mt-1 font-medium capitalize text-foreground">{result.status.replace("_", " ")}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Attempted</p>
                <p className="mt-1 font-medium text-foreground">
                  {attemptedCount}/{result.review.length} ({completion}%)
                </p>
              </div>
              <Button asChild variant="outline" className="w-fit">
                <Link href="/dashboard/tests">
                  <IconArrowLeft data-icon="inline-start" />
                  Back to tests
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="review">
          <Card>
            <CardContent className="pt-6">
              <ScrollArea className="h-[520px] pr-4">
                <div className="flex flex-col gap-4">
                  {result.review.map((item, index) => {
                    const earnedMarks = item.isCorrect ? item.marks : 0;
                    return (
                      <Card key={item.questionId} className="border-border/70">
                        <CardHeader>
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <CardTitle className="text-base">
                              Q{index + 1}. {item.question}
                            </CardTitle>
                            <Badge variant={item.isCorrect ? "secondary" : "outline"}>
                              {earnedMarks}/{item.marks} marks
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                          <p className="flex items-center gap-2 font-medium">
                            {item.isCorrect ? (
                              <IconCircleCheck className="text-emerald-600" />
                            ) : (
                              <IconCircleX className="text-red-500" />
                            )}
                            Selected: {item.selectedOptionText ?? "Not answered"}
                          </p>
                          <p className="text-muted-foreground">
                            Correct answer:{" "}
                            <span className="text-foreground">{item.correctOptionText ?? "Not available"}</span>
                          </p>
                          {item.explanation ? (
                            <div className="rounded-md border bg-muted/30 p-3">
                              <p className="mb-1 flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                <IconInfoCircle className="size-3.5" />
                                Explanation
                              </p>
                              <p className="text-sm text-foreground">{item.explanation}</p>
                            </div>
                          ) : null}
                        </CardContent>
                      </Card>
                    );
                  })}
                  {result.review.length === 0 ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">No answer review available</CardTitle>
                        <CardDescription>
                          Question-level review data could not be generated for this attempt.
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ) : null}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
