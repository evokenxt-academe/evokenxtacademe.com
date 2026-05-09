"use client";

import { useParams } from "next/navigation";
import { useQuiz, useQuizRanking } from "@/hooks/useQuizzes";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Clock, Target, Users, ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface RankingRow {
  rank: number;
  userId: string;
  name: string;
  email: string;
  avatar: string | null;
  initials: string;
  score: number;
  totalMarks: number;
  percentage: number;
  durationSec: number | null;
  submittedAt: string | null;
}

export default function QuizResultsPage() {
  const router = useRouter();
  const { quizId } = useParams() as { quizId: string };
  const { data: quiz, isLoading: quizLoading } = useQuiz(quizId);
  const { data: rankingData, isLoading: rankingLoading } =
    useQuizRanking(quizId);

  const isLoading = quizLoading || rankingLoading;
  const rankings: RankingRow[] = rankingData?.ranking || [];

  return (
    <div className="mx-auto max-w-7xl space-y-6 md:p-10 p-4">
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
              <BreadcrumbPage>Results & Ranking</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/quizzes")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Results & Analytics
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {quiz?.title} — Performance breakdown and student rankings
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Attempts
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rankings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rankings.length > 0
                ? Math.round(
                    rankings.reduce((acc, r) => acc + r.percentage, 0) /
                      rankings.length,
                  )
                : 0}
              %
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Score</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rankings.length > 0 ? rankings[0].score : 0} /{" "}
              {quiz?.total_marks || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rankings.length > 0
                ? Math.round(
                    rankings.reduce((acc, r) => acc + (r.durationSec || 0), 0) /
                      rankings.length /
                      60,
                  )
                : 0}
              m
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Ranking</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">Rank</TableHead>
                <TableHead>Student</TableHead>
                <TableHead className="text-center">Score</TableHead>
                <TableHead className="text-center">Percentage</TableHead>
                <TableHead className="text-center">Time Taken</TableHead>
                <TableHead className="text-right">Submitted At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-4 mx-auto" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12 mx-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12 mx-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16 mx-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : rankings.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No attempts found for this quiz yet.
                  </TableCell>
                </TableRow>
              ) : (
                rankings.map((row) => (
                  <TableRow key={row.userId}>
                    <TableCell className="text-center font-bold">
                      {row.rank === 1
                        ? "🥇"
                        : row.rank === 2
                          ? "🥈"
                          : row.rank === 3
                            ? "🥉"
                            : row.rank}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={row.avatar || undefined} />
                          <AvatarFallback>{row.initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">{row.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {row.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {row.score} / {row.totalMarks}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          row.percentage >= 70
                            ? "secondary"
                            : row.percentage >= 40
                              ? "secondary"
                              : "destructive"
                        }
                        className={
                          row.percentage >= 70
                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                            : row.percentage >= 40
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                              : ""
                        }
                      >
                        {row.percentage}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {row.durationSec
                        ? `${Math.floor(row.durationSec / 60)}m ${row.durationSec % 60}s`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {row.submittedAt
                        ? format(new Date(row.submittedAt), "MMM d, yyyy HH:mm")
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
