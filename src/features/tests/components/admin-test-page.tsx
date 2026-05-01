"use client";

import { useState } from "react";
import {
  IconChecklist,
  IconTrophy,
  IconUsers,
  IconTarget,
  IconChevronRight,
  IconCircleCheck,
  IconCircleX,
  IconEye,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAdminQuizList, useAdminQuizRanking } from "@/features/tests/hooks";
import { RankingTable } from "@/features/tests/components/ranking-table";
import type { AdminQuizListItem } from "@/features/tests/types";

function formatDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDuration(seconds: number | null) {
  if (!seconds || seconds <= 0) return "No limit";
  const mins = Math.round(seconds / 60);
  return `${mins} min`;
}

export function AdminTestPage() {
  const { data: quizzes, isLoading, error } = useAdminQuizList();
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);

  const selectedQuiz = quizzes?.find((q) => q.id === selectedQuizId) ?? null;

  // Compute totals
  const totalQuizzes = quizzes?.length ?? 0;
  const totalAttempts = quizzes?.reduce((sum, q) => sum + q.attemptCount, 0) ?? 0;
  const totalParticipants = quizzes?.reduce((sum, q) => sum + q.participantCount, 0) ?? 0;
  const avgPassRate =
    quizzes && quizzes.length > 0
      ? Math.round(quizzes.reduce((sum, q) => sum + q.passRate, 0) / quizzes.length)
      : 0;

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6 p-5 md:p-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-7xl p-5 md:p-6">
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Unable to load tests</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-5 md:p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Test Management</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          View all quizzes, track performance metrics, and access student rankings.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-xl border-border/60">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <IconChecklist className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total Tests</p>
              <p className="text-2xl font-semibold">{totalQuizzes}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-border/60">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
              <IconTarget className="size-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total Attempts</p>
              <p className="text-2xl font-semibold">{totalAttempts}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-border/60">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
              <IconUsers className="size-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Participants</p>
              <p className="text-2xl font-semibold">{totalParticipants}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-border/60">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <IconTrophy className="size-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Avg Pass Rate</p>
              <p className="text-2xl font-semibold">{avgPassRate}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Quiz Table */}
      <Card className="rounded-xl border-border/60 overflow-hidden">
        <CardHeader>
          <CardTitle>All Quizzes</CardTitle>
          <CardDescription>
            Click on a quiz to view student rankings and performance details.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {!quizzes || quizzes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <IconChecklist className="mb-3 size-10 text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">No quizzes created yet</p>
              <p className="text-xs text-muted-foreground/70">
                Go to the Quiz Builder to create your first test.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Quiz</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead className="text-center">Questions</TableHead>
                    <TableHead className="text-center">Attempts</TableHead>
                    <TableHead className="text-center">Avg Score</TableHead>
                    <TableHead className="text-center">Pass Rate</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quizzes.map((quiz) => (
                    <QuizTableRow
                      key={quiz.id}
                      quiz={quiz}
                      onViewRanking={() => setSelectedQuizId(quiz.id)}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ranking Dialog */}
      <Dialog
        open={selectedQuizId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedQuizId(null);
        }}
      >
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconTrophy className="size-5 text-amber-500" />
              Student Rankings
            </DialogTitle>
            <DialogDescription>
              {selectedQuiz ? `${selectedQuiz.title} — ${selectedQuiz.courseName}` : "Loading..."}
            </DialogDescription>
          </DialogHeader>
          {selectedQuizId && <RankingTable quizId={selectedQuizId} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Quiz Table Row ─────────────────────────────────────────────

function QuizTableRow({
  quiz,
  onViewRanking,
}: {
  quiz: AdminQuizListItem;
  onViewRanking: () => void;
}) {
  return (
    <TableRow className="cursor-pointer hover:bg-muted/30" onClick={onViewRanking}>
      <TableCell>
        <div className="flex flex-col gap-0.5">
          <p className="font-medium text-sm">{quiz.title}</p>
          <p className="text-xs text-muted-foreground">{quiz.sectionTitle}</p>
        </div>
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">{quiz.courseName}</span>
      </TableCell>
      <TableCell className="text-center">
        <span className="text-sm font-medium">{quiz.questionCount}</span>
      </TableCell>
      <TableCell className="text-center">
        <span className="text-sm font-medium">{quiz.attemptCount}</span>
      </TableCell>
      <TableCell className="text-center">
        <span className="text-sm font-medium">
          {quiz.attemptCount > 0 ? `${quiz.averageScore}/${quiz.totalMarks}` : "—"}
        </span>
      </TableCell>
      <TableCell className="text-center">
        {quiz.attemptCount > 0 ? (
          <Badge
            variant={quiz.passRate >= 70 ? "default" : quiz.passRate >= 40 ? "secondary" : "destructive"}
            className="text-xs"
          >
            {quiz.passRate}%
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="text-center">
        <Badge variant={quiz.isPublished ? "default" : "outline"} className="text-xs">
          {quiz.isPublished ? "Published" : "Draft"}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="sm" onClick={onViewRanking}>
          <IconEye className="size-4 mr-1" />
          Ranking
        </Button>
      </TableCell>
    </TableRow>
  );
}
