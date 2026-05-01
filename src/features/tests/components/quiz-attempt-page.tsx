"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IconArrowLeft, IconArrowRight, IconSend } from "@tabler/icons-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { NavigationPanel } from "@/features/tests/components/navigation-panel";
import { QuestionItem } from "@/features/tests/components/question-item";
import { useAttempt, useQuiz, useSaveAnswer, useSubmitAttempt } from "@/features/tests/hooks";

function formatClock(seconds: number) {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const rem = safe % 60;
  return `${minutes.toString().padStart(2, "0")}:${rem.toString().padStart(2, "0")}`;
}

export function QuizAttemptPage({ quizId }: { quizId: string }) {
  const router = useRouter();
  const quizQuery = useQuiz(quizId);
  const attemptQuery = useAttempt(quizId);
  const saveAnswerMutation = useSaveAnswer();
  const submitMutation = useSubmitAttempt();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [localAnswers, setLocalAnswers] = useState<Record<string, string> | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());

  const quiz = quizQuery.data;
  const attempt = attemptQuery.data;

  const answers = localAnswers ?? attempt?.answers ?? {};

  useEffect(() => {
    if (!quiz?.timeLimitSec || !attempt?.startedAt) return;
    const id = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [quiz?.timeLimitSec, attempt?.startedAt]);

  const secondsLeft =
    !quiz?.timeLimitSec || !attempt?.startedAt
      ? null
      : Math.max(
          quiz.timeLimitSec -
            Math.floor((nowTick - new Date(attempt.startedAt).getTime()) / 1000),
          0,
        );

  useEffect(() => {
    if (
      secondsLeft === 0 &&
      attempt?.id &&
      !submitMutation.isPending &&
      !submitMutation.isSuccess
    ) {
      void submitMutation
        .mutateAsync({ attemptId: attempt.id, timedOut: true })
        .then((result) => {
          toast.message("Time is up. Your test was submitted.");
          router.replace(`/dashboard/tests/result/${result.attemptId}`);
        })
        .catch((error) => {
          toast.error(error instanceof Error ? error.message : "Auto-submit failed.");
        });
    }
  }, [
    secondsLeft,
    attempt?.id,
    submitMutation,
    router,
  ]);

  const answeredQuestionIds = new Set(Object.keys(answers));

  const handleSelect = async (questionId: string, optionId: string) => {
    if (!attempt?.id) return;
    setLocalAnswers((prev) => ({ ...(prev ?? attempt.answers), [questionId]: optionId }));
    try {
      await saveAnswerMutation.mutateAsync({
        attemptId: attempt.id,
        questionId,
        selectedOptionId: optionId,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save answer.");
    }
  };

  const handleSubmit = async () => {
    if (!attempt?.id) return;
    try {
      const result = await submitMutation.mutateAsync({ attemptId: attempt.id });
      router.replace(`/dashboard/tests/result/${result.attemptId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit test.");
    }
  };

  if (quizQuery.isLoading || attemptQuery.isLoading) {
    return (
      <div className="mx-auto grid w-full max-w-7xl gap-5 p-5 md:p-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-[340px] rounded-xl" />
          <div className="flex justify-between">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
        <Skeleton className="h-[460px] rounded-xl" />
      </div>
    );
  }

  if (!quiz || quizQuery.error) {
    return (
      <div className="p-5 md:p-6">
        <Card className="mx-auto max-w-xl rounded-xl">
          <CardHeader>
            <CardTitle>Quiz unavailable</CardTitle>
            <CardDescription>
              {quizQuery.error instanceof Error ? quizQuery.error.message : "Unable to load quiz."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="p-5 md:p-6">
        <Card className="mx-auto max-w-xl rounded-xl">
          <CardHeader>
            <CardTitle>No active attempt</CardTitle>
            <CardDescription>Start this test first to begin attempting questions.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push(`/dashboard/tests/${quizId}/start`)}>
              Go to start page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (quiz.questions.length === 0) {
    return (
      <div className="p-5 md:p-6">
        <Card className="mx-auto max-w-xl rounded-xl">
          <CardHeader>
            <CardTitle>No questions available</CardTitle>
            <CardDescription>This quiz has no questions yet. Please contact support.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const timeLabel = secondsLeft == null ? null : formatClock(secondsLeft);
  const isDangerTime = secondsLeft != null && secondsLeft <= 60;
  const progressPercent = quiz.questions.length > 0
    ? Math.round((answeredQuestionIds.size / quiz.questions.length) * 100)
    : 0;

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-5 p-5 md:p-6 xl:grid-cols-[1fr_320px]">
      {/* Main Content */}
      <div className="flex flex-col gap-4">
        {/* Top Info Bar */}
        <Card className="rounded-xl border-border/60">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold">{quiz.title}</h2>
                <p className="text-sm text-muted-foreground">
                  Question {currentQuestionIndex + 1} of {quiz.questions.length}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{answeredQuestionIds.size} answered</Badge>
                {timeLabel ? (
                  <Badge
                    variant={isDangerTime ? "destructive" : "secondary"}
                    className="text-base font-mono tabular-nums px-3"
                  >
                    {timeLabel}
                  </Badge>
                ) : null}
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                <span>Progress</span>
                <span>{answeredQuestionIds.size}/{quiz.questions.length}</span>
              </div>
              <Progress value={progressPercent} className="h-1.5" />
            </div>
          </CardContent>
        </Card>

        {/* Question */}
        <QuestionItem
          question={currentQuestion}
          questionNumber={currentQuestionIndex + 1}
          selectedOptionId={answers[currentQuestion.id]}
          onSelect={(optionId) => handleSelect(currentQuestion.id, optionId)}
        />

        {/* Navigation */}
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex((prev) => Math.max(prev - 1, 0))}
            disabled={currentQuestionIndex === 0}
          >
            <IconArrowLeft className="mr-1.5 size-4" />
            Previous
          </Button>

          <Button
            variant="outline"
            onClick={() =>
              setCurrentQuestionIndex((prev) =>
                Math.min(prev + 1, quiz.questions.length - 1),
              )
            }
            disabled={currentQuestionIndex === quiz.questions.length - 1}
          >
            Next
            <IconArrowRight className="ml-1.5 size-4" />
          </Button>
        </div>
      </div>

      {/* Sidebar */}
      <div className="flex flex-col gap-4 xl:sticky xl:top-6 xl:self-start">
        <NavigationPanel
          totalQuestions={quiz.questions.length}
          questionIds={quiz.questions.map((question) => question.id)}
          answeredCount={answeredQuestionIds.size}
          answeredQuestionIds={answeredQuestionIds}
          currentIndex={currentQuestionIndex}
          timeLabel={timeLabel}
          isDangerTime={isDangerTime}
          onJump={setCurrentQuestionIndex}
        />

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button className="w-full gap-2" disabled={submitMutation.isPending}>
              <IconSend className="size-4" />
              {submitMutation.isPending ? "Submitting..." : "Submit Test"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Submit test now?</AlertDialogTitle>
              <AlertDialogDescription>
                You answered {answeredQuestionIds.size} of {quiz.questions.length} questions.
                {quiz.questions.length - answeredQuestionIds.size > 0 && (
                  <span className="block mt-1 font-medium text-destructive">
                    {quiz.questions.length - answeredQuestionIds.size} questions are still unanswered.
                  </span>
                )}
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSubmit}>Confirm Submit</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
