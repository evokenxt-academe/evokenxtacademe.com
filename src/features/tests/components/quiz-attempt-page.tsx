"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IconArrowLeft, IconArrowRight, IconSend } from "@tabler/icons-react";
import {
  Maximize,
  Minimize,
  LogOut,
  Menu,
  X,
  Clock,
} from "lucide-react";
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
import { NavigationPanel } from "@/features/tests/components/navigation-panel";
import { QuestionItem } from "@/features/tests/components/question-item";
import { useAttempt, useQuiz, useSaveAnswer, useSubmitAttempt } from "@/features/tests/hooks";
import { cn } from "@/lib/utils";

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);

  const quiz = quizQuery.data;
  const attempt = attemptQuery.data;

  const answers = localAnswers ?? attempt?.answers ?? {};

  // Track Fullscreen state
  useEffect(() => {
    const handleFSChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFSChange);
    setIsFullscreen(!!document.fullscreenElement);
    return () => {
      document.removeEventListener("fullscreenchange", handleFSChange);
    };
  }, []);

  // Try auto-fullscreen on mount
  useEffect(() => {
    const enterFS = async () => {
      try {
        if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
      } catch (err) {
        console.warn("Auto-fullscreen on mount blocked:", err);
      }
    };
    const timer = setTimeout(enterFS, 500);
    return () => clearTimeout(timer);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen toggle failed:", err);
    }
  };

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
        .then(async (result) => {
          toast.message("Time is up. Your test was submitted.");
          if (document.fullscreenElement) {
            await document.exitFullscreen().catch(() => {});
          }
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
      if (document.fullscreenElement) {
        await document.exitFullscreen().catch(() => {});
      }
      router.replace(`/dashboard/tests/result/${result.attemptId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit test.");
    }
  };

  const handleExit = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
    }
    router.push("/dashboard/tests");
  };

  if (quizQuery.isLoading || attemptQuery.isLoading) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background text-foreground gap-4">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm font-medium text-muted-foreground">Loading test player...</p>
      </div>
    );
  }

  if (!quiz || quizQuery.error) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background p-5">
        <Card className="w-full max-w-md rounded-xl">
          <CardHeader>
            <CardTitle>Quiz unavailable</CardTitle>
            <CardDescription>
              {quizQuery.error instanceof Error ? quizQuery.error.message : "Unable to load quiz."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleExit} className="w-full">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background p-5">
        <Card className="w-full max-w-md rounded-xl">
          <CardHeader>
            <CardTitle>No active attempt</CardTitle>
            <CardDescription>Start this test first to begin attempting questions.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push(`/dashboard/tests/${quizId}/start`)} className="w-full">
              Go to start page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (quiz.questions.length === 0) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background p-5">
        <Card className="w-full max-w-md rounded-xl">
          <CardHeader>
            <CardTitle>No questions available</CardTitle>
            <CardDescription>This quiz has no questions yet. Please contact support.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleExit} className="w-full">
              Back to Dashboard
            </Button>
          </CardContent>
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

  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background text-foreground overflow-hidden">
      {/* ── Top Header Bar ───────────────────────────────────────── */}
      <header className="h-16 shrink-0 border-b bg-card px-4 sm:px-6 flex items-center justify-between">
        {/* Left Section: Exit + Titles */}
        <div className="flex items-center gap-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <LogOut className="size-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Exit practice/test?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your progress is saved automatically. You can resume this attempt later from the dashboard.
                  {secondsLeft != null && (
                    <span className="block mt-2 font-medium text-destructive">
                      Warning: The timer will continue to run in the background.
                    </span>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Resume Test</AlertDialogCancel>
                <AlertDialogAction onClick={handleExit}>Exit Test</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-tight line-clamp-1">{quiz.title}</span>
            <span className="text-[11px] text-muted-foreground font-medium leading-none line-clamp-1">{quiz.courseName}</span>
          </div>
        </div>

        {/* Center: Live Timer Badge */}
        {timeLabel && (
          <div className="flex items-center gap-2">
            <Clock className={cn("size-4", isDangerTime ? "text-destructive animate-pulse" : "text-muted-foreground")} />
            <Badge
              variant={isDangerTime ? "destructive" : "secondary"}
              className="font-mono text-sm sm:text-base tabular-nums px-2.5 py-0.5 border"
            >
              {timeLabel}
            </Badge>
          </div>
        )}

        {/* Right Section: Mobile map toggle + Fullscreen */}
        <div className="flex items-center gap-2">
          {/* Progress label for desktop */}
          <div className="hidden sm:flex flex-col items-end text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{answeredQuestionIds.size}/{quiz.questions.length} Answered</span>
            <span>{progressPercent}% complete</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="text-muted-foreground hover:text-foreground hidden sm:flex"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMapOpen(!isMapOpen)}
            className="lg:hidden gap-1 px-2.5"
          >
            <Menu className="size-4" />
            <span>Map</span>
          </Button>
        </div>
      </header>

      {/* ── Main Panel View ───────────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex relative overflow-hidden">
        {/* Left Side: Question Container */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:p-8 flex justify-center items-start">
          <div className="w-full max-w-3xl flex flex-col gap-6">
            {/* Header progress line for mobile */}
            <div className="sm:hidden space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                <span>Progress: {answeredQuestionIds.size}/{quiz.questions.length} Answered</span>
                <span>{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} className="h-1 bg-muted" />
            </div>

            {/* Render active question */}
            <QuestionItem
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              selectedOptionId={answers[currentQuestion.id]}
              onSelect={(optionId) => handleSelect(currentQuestion.id, optionId)}
            />
          </div>
        </main>

        {/* Right Side: Sliding Panel for Navigation / Question Map */}
        {/* Overlay backdrop for mobile */}
        {isMapOpen && (
          <div
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMapOpen(false)}
          />
        )}

        <aside
          className={cn(
            "fixed inset-y-0 right-0 z-50 w-72 border-l bg-card shadow-2xl flex flex-col p-5 gap-4 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:shadow-none shrink-0",
            isMapOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
          )}
        >
          {/* Drawer Close for Mobile */}
          <div className="flex items-center justify-between lg:hidden border-b pb-2">
            <span className="font-semibold text-sm">Question Map</span>
            <Button variant="ghost" size="icon" className="size-8" onClick={() => setIsMapOpen(false)}>
              <X className="size-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 pr-1">
            <NavigationPanel
              totalQuestions={quiz.questions.length}
              questionIds={quiz.questions.map((question) => question.id)}
              answeredCount={answeredQuestionIds.size}
              answeredQuestionIds={answeredQuestionIds}
              currentIndex={currentQuestionIndex}
              timeLabel={null}
              isDangerTime={isDangerTime}
              onJump={(idx) => {
                setCurrentQuestionIndex(idx);
                setIsMapOpen(false); // auto-close drawer on selection
              }}
            />
          </div>
        </aside>
      </div>

      {/* ── Bottom Navigation Bar ─────────────────────────────────── */}
      <footer className="h-20 shrink-0 border-t bg-card px-4 sm:px-8 flex items-center justify-between">
        {/* Previous Button */}
        <Button
          variant="outline"
          onClick={() => setCurrentQuestionIndex((prev) => Math.max(prev - 1, 0))}
          disabled={currentQuestionIndex === 0}
          className="gap-1.5 h-11"
        >
          <IconArrowLeft className="size-4" />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        {/* Question progress tracker text */}
        <div className="text-xs sm:text-sm text-muted-foreground font-medium">
          Question <span className="text-foreground font-semibold">{currentQuestionIndex + 1}</span> of <span className="text-foreground font-semibold">{quiz.questions.length}</span>
        </div>

        {/* Next or Submit Button */}
        {isLastQuestion ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                className="gap-1.5 h-11 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
                disabled={submitMutation.isPending}
              >
                <IconSend className="size-4" />
                <span>{submitMutation.isPending ? "Submitting..." : "Submit Test"}</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Submit test now?</AlertDialogTitle>
                <AlertDialogDescription>
                  You answered {answeredQuestionIds.size} of {quiz.questions.length} questions.
                  {quiz.questions.length - answeredQuestionIds.size > 0 && (
                    <span className="block mt-2 font-semibold text-destructive">
                      {quiz.questions.length - answeredQuestionIds.size} questions are still unanswered.
                    </span>
                  )}
                  Are you ready to submit your attempt? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Go Back</AlertDialogCancel>
                <AlertDialogAction onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                  Confirm Submit
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Button
            variant="default"
            onClick={() =>
              setCurrentQuestionIndex((prev) =>
                Math.min(prev + 1, quiz.questions.length - 1),
              )
            }
            className="gap-1.5 h-11 px-5"
          >
            <span>Next</span>
            <IconArrowRight className="size-4" />
          </Button>
        )}
      </footer>
    </div>
  );
}
