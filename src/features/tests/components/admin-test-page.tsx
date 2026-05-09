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
  IconFlame,
  IconTrendingUp,
  IconBookmark,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useAdminQuizList, useAdminQuizRanking } from "@/features/tests/hooks";
import { RankingTable } from "@/features/tests/components/ranking-table";
import type { AdminQuizListItem } from "@/features/tests/types";
import { useMediaQuery } from "@/hooks/use-media-query";

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
  const isMobile = useMediaQuery("(max-width: 768px)");

  const selectedQuiz = quizzes?.find((q) => q.id === selectedQuizId) ?? null;

  // Compute totals
  const totalQuizzes = quizzes?.length ?? 0;
  const totalAttempts =
    quizzes?.reduce((sum, q) => sum + q.attemptCount, 0) ?? 0;
  const totalParticipants =
    quizzes?.reduce((sum, q) => sum + q.participantCount, 0) ?? 0;
  const avgPassRate =
    quizzes && quizzes.length > 0
      ? Math.round(
          quizzes.reduce((sum, q) => sum + q.passRate, 0) / quizzes.length,
        )
      : 0;

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-6xl p-4 sm:p-6">
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive">
              Unable to load tests
            </CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
      {/* Page Header */}
      <div className="space-y-1.5 md:space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Test Management
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
          Monitor quiz performance, track student progress, and manage
          assessments across your courses.
        </p>
      </div>

      {/* Summary Stats Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Tests Card */}
        <StatCard
          icon={IconChecklist}
          label="Total Tests"
          value={totalQuizzes}
          gradient="from-blue-500/10 to-cyan-500/10"
          iconColor="text-blue-600 dark:text-blue-400"
          trend={totalQuizzes > 0 ? `${totalQuizzes} active` : "No tests"}
        />

        {/* Total Attempts Card */}
        <StatCard
          icon={IconFlame}
          label="Total Attempts"
          value={totalAttempts}
          gradient="from-orange-500/10 to-red-500/10"
          iconColor="text-orange-600 dark:text-orange-400"
          trend={
            totalAttempts > 0 ? `${totalAttempts} submissions` : "No attempts"
          }
        />

        {/* Participants Card */}
        <StatCard
          icon={IconUsers}
          label="Participants"
          value={totalParticipants}
          gradient="from-emerald-500/10 to-teal-500/10"
          iconColor="text-emerald-600 dark:text-emerald-400"
          trend={
            totalParticipants > 0
              ? `${totalParticipants} students`
              : "No participants"
          }
        />

        {/* Pass Rate Card */}
        <StatCard
          icon={IconTrophy}
          label="Avg Pass Rate"
          value={`${avgPassRate}%`}
          gradient="from-purple-500/10 to-pink-500/10"
          iconColor="text-purple-600 dark:text-purple-400"
          trend={
            avgPassRate >= 70
              ? "Excellent"
              : avgPassRate >= 50
                ? "Good"
                : "Needs improvement"
          }
        />
      </div>

      <Separator className="my-2" />

      {/* Tests List */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            All Quizzes
          </h2>
          <p className="text-sm text-muted-foreground">
            {quizzes && quizzes.length > 0
              ? `${quizzes.length} quiz${quizzes.length !== 1 ? "zes" : ""} available`
              : "No quizzes created yet"}
          </p>
        </div>

        <Card className="overflow-hidden border-border/50 shadow-sm">
          <CardContent className="p-0">
            {!quizzes || quizzes.length === 0 ? (
              <EmptyState />
            ) : isMobile ? (
              // Mobile: Card-based view
              <div className="space-y-3 p-4 sm:p-5">
                {quizzes.map((quiz) => (
                  <QuizCardMobile
                    key={quiz.id}
                    quiz={quiz}
                    onViewRanking={() => setSelectedQuizId(quiz.id)}
                  />
                ))}
              </div>
            ) : (
              // Desktop: Table view
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border/30">
                      <TableHead className="min-w-[200px] font-semibold">
                        Quiz
                      </TableHead>
                      <TableHead className="font-semibold">Course</TableHead>
                      <TableHead className="text-center font-semibold">
                        Questions
                      </TableHead>
                      <TableHead className="text-center font-semibold">
                        Attempts
                      </TableHead>
                      <TableHead className="text-center font-semibold">
                        Avg Score
                      </TableHead>
                      <TableHead className="text-center font-semibold">
                        Pass Rate
                      </TableHead>
                      <TableHead className="text-center font-semibold">
                        Status
                      </TableHead>
                      <TableHead className="text-right font-semibold">
                        Actions
                      </TableHead>
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
      </div>

      {/* Ranking Modal/Drawer */}
      {isMobile ? (
        <Drawer
          open={selectedQuizId !== null}
          onOpenChange={(open) => {
            if (!open) setSelectedQuizId(null);
          }}
        >
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader className="space-y-2">
              <DrawerTitle className="flex items-center gap-2">
                <IconTrophy className="size-5 text-amber-500" />
                Rankings
              </DrawerTitle>
              <DrawerDescription className="line-clamp-2">
                {selectedQuiz
                  ? `${selectedQuiz.title} — ${selectedQuiz.courseName}`
                  : "Loading..."}
              </DrawerDescription>
            </DrawerHeader>
            <div className="overflow-y-auto px-4 pb-6">
              {selectedQuizId && <RankingTable quizId={selectedQuizId} />}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
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
                {selectedQuiz
                  ? `${selectedQuiz.title} — ${selectedQuiz.courseName}`
                  : "Loading..."}
              </DialogDescription>
            </DialogHeader>
            {selectedQuizId && <RankingTable quizId={selectedQuizId} />}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ── Stat Card Component ────────────────────────────────────────────

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  gradient: string;
  iconColor: string;
  trend: string;
}

function StatCard({
  icon: Icon,
  label,
  value,
  gradient,
  iconColor,
  trend,
}: StatCardProps) {
  return (
    <Card className="group overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardContent className="p-5 sm:p-6">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div
              className={`flex size-12 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} backdrop-blur-sm`}
            >
              <Icon className={`size-6 ${iconColor}`} />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide opacity-75">
              {label}
            </p>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight">
              {value}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground/70 font-medium">
              {trend}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Empty State Component ────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 text-center">
      <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
        <IconChecklist className="size-8 text-muted-foreground/40" />
      </div>
      <h3 className="mb-2 text-lg sm:text-xl font-semibold text-foreground">
        No quizzes created yet
      </h3>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground leading-relaxed">
        Start by creating your first quiz in the Quiz Builder to begin tracking
        student performance.
      </p>
      <Button asChild variant="outline" className="gap-2">
        <a href="/admin/quizzes">
          Create First Quiz
          <IconChevronRight className="size-4" />
        </a>
      </Button>
    </div>
  );
}

// ── Mobile Card View Component ────────────────────────────────────

interface QuizCardMobileProps {
  quiz: AdminQuizListItem;
  onViewRanking: () => void;
}

function QuizCardMobile({ quiz, onViewRanking }: QuizCardMobileProps) {
  return (
    <Card
      className="overflow-hidden border-border/50 hover:border-border transition-colors cursor-pointer active:bg-muted/50"
      onClick={onViewRanking}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm sm:text-base truncate text-foreground">
              {quiz.title}
            </h3>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {quiz.courseName}
            </p>
          </div>
          <Badge
            variant={quiz.isPublished ? "default" : "outline"}
            className="text-xs shrink-0"
          >
            {quiz.isPublished ? "Live" : "Draft"}
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 py-2">
          <StatItem label="Questions" value={quiz.questionCount} />
          <StatItem label="Attempts" value={quiz.attemptCount} />
          <StatItem
            label="Pass Rate"
            value={quiz.attemptCount > 0 ? `${quiz.passRate}%` : "—"}
          />
        </div>

        {/* Details */}
        {quiz.attemptCount > 0 && (
          <div className="space-y-2 pt-2 border-t border-border/50">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Average Score</span>
              <span className="font-semibold text-foreground">
                {quiz.averageScore}/{quiz.totalMarks}
              </span>
            </div>
            <PassRateIndicator passRate={quiz.passRate} />
          </div>
        )}

        {/* Action Button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-2 gap-2 hover:bg-muted"
          onClick={onViewRanking}
        >
          <IconEye className="size-4" />
          View Rankings
          <IconChevronRight className="size-4 ml-auto opacity-50" />
        </Button>
      </CardContent>
    </Card>
  );
}

// ── Stat Item Component ──────────────────────────────────────────

function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-lg sm:text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}

// ── Pass Rate Indicator Component ────────────────────────────────

function PassRateIndicator({ passRate }: { passRate: number }) {
  const getColor = (rate: number) => {
    if (rate >= 70) return "bg-emerald-500";
    if (rate >= 40) return "bg-amber-500";
    return "bg-destructive";
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className="text-muted-foreground">Pass Rate</span>
        <span className="font-semibold text-foreground">{passRate}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor(passRate)} transition-all duration-300 rounded-full`}
          style={{ width: `${passRate}%` }}
        />
      </div>
    </div>
  );
}

// ── Quiz Table Row Component ────────────────────────────────────

function QuizTableRow({
  quiz,
  onViewRanking,
}: {
  quiz: AdminQuizListItem;
  onViewRanking: () => void;
}) {
  const passRateVariant =
    quiz.passRate >= 70
      ? "default"
      : quiz.passRate >= 40
        ? "secondary"
        : "destructive";

  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/40 transition-colors border-border/30"
      onClick={onViewRanking}
    >
      <TableCell>
        <div className="flex flex-col gap-1">
          <p className="font-semibold text-sm text-foreground">{quiz.title}</p>
          <p className="text-xs text-muted-foreground">{quiz.sectionTitle}</p>
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {quiz.courseName}
      </TableCell>
      <TableCell className="text-center">
        <span className="text-sm font-semibold text-foreground">
          {quiz.questionCount}
        </span>
      </TableCell>
      <TableCell className="text-center">
        <span className="text-sm font-semibold text-foreground">
          {quiz.attemptCount}
        </span>
      </TableCell>
      <TableCell className="text-center">
        {quiz.attemptCount > 0 ? (
          <span className="text-sm font-semibold text-foreground">
            {quiz.averageScore}/{quiz.totalMarks}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground/50">—</span>
        )}
      </TableCell>
      <TableCell className="text-center">
        {quiz.attemptCount > 0 ? (
          <Badge variant={passRateVariant} className="text-xs font-semibold">
            {quiz.passRate}%
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground/50">—</span>
        )}
      </TableCell>
      <TableCell className="text-center">
        <Badge
          variant={quiz.isPublished ? "default" : "outline"}
          className="text-xs font-semibold"
        >
          {quiz.isPublished ? "Published" : "Draft"}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 hover:bg-muted"
          onClick={(e) => {
            e.stopPropagation();
            onViewRanking();
          }}
        >
          <IconEye className="size-4" />
          <span className="hidden sm:inline text-xs">Rankings</span>
        </Button>
      </TableCell>
    </TableRow>
  );
}
