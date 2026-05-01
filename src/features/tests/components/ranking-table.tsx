"use client";

import {
  IconMedal,
  IconTrophy,
  IconClockHour4,
  IconCalendarEvent,
} from "@tabler/icons-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminQuizRanking } from "@/features/tests/hooks";

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDuration(seconds: number | null) {
  if (seconds == null || seconds <= 0) return "—";
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  if (min === 0) return `${sec}s`;
  return `${min}m ${sec}s`;
}

function getRankBadge(rank: number) {
  if (rank === 1) return <IconMedal className="size-5 text-amber-500" />;
  if (rank === 2) return <IconMedal className="size-5 text-zinc-400" />;
  if (rank === 3) return <IconMedal className="size-5 text-amber-700" />;
  return <span className="text-sm font-semibold text-muted-foreground">{rank}</span>;
}

interface RankingTableProps {
  quizId: string;
}

export function RankingTable({ quizId }: RankingTableProps) {
  const { data: ranking, isLoading, error } = useAdminQuizRanking(quizId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="size-9 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        Failed to load ranking. {error.message}
      </div>
    );
  }

  if (!ranking || ranking.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <IconTrophy className="mb-3 size-10 text-muted-foreground/20" />
        <p className="text-sm font-medium text-muted-foreground">No submissions yet</p>
        <p className="text-xs text-muted-foreground/70">
          Rankings will appear once students submit their attempts.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16 text-center">Rank</TableHead>
            <TableHead className="min-w-[180px]">Student</TableHead>
            <TableHead className="text-center">Score</TableHead>
            <TableHead className="text-center">Percentage</TableHead>
            <TableHead className="text-center">
              <div className="flex items-center justify-center gap-1">
                <IconClockHour4 className="size-3.5" />
                Duration
              </div>
            </TableHead>
            <TableHead className="text-right">
              <div className="flex items-center justify-end gap-1">
                <IconCalendarEvent className="size-3.5" />
                Submitted
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ranking.map((entry) => (
            <TableRow key={entry.userId}>
              <TableCell className="text-center">
                <div className="flex items-center justify-center">
                  {getRankBadge(entry.rank)}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="size-8">
                    {entry.avatar && <AvatarImage src={entry.avatar} alt={entry.name} />}
                    <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                      {entry.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{entry.name}</span>
                    <span className="text-xs text-muted-foreground">{entry.email}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <span className="text-sm font-semibold">
                  {entry.score}/{entry.totalMarks}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <Badge
                  variant={
                    entry.percentage >= 80
                      ? "default"
                      : entry.percentage >= 50
                        ? "secondary"
                        : "destructive"
                  }
                  className="text-xs"
                >
                  {entry.percentage}%
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <span className="text-sm text-muted-foreground">
                  {formatDuration(entry.durationSec)}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <span className="text-sm text-muted-foreground">
                  {formatDate(entry.submittedAt)}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
