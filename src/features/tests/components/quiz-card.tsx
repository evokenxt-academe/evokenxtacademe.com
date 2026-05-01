"use client";

import Link from "next/link";
import { IconArrowRight } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { QuizSummaryItem } from "@/features/tests/types";

function formatDuration(seconds: number | null) {
  if (!seconds || seconds <= 0) return "No time limit";
  const mins = Math.round(seconds / 60);
  return `${mins} min`;
}

function statusLabel(status: QuizSummaryItem["status"]) {
  if (status === "in_progress") return "Ongoing";
  if (status === "completed") return "Completed";
  return "New";
}

function ctaLabel(status: QuizSummaryItem["status"]) {
  if (status === "in_progress") return "Resume";
  if (status === "completed") return "Result";
  return "Start";
}

function ctaHref(quiz: QuizSummaryItem) {
  if (quiz.status === "in_progress") return `/dashboard/tests/${quiz.id}/attempt`;
  if (quiz.status === "completed" && quiz.latestAttemptId) {
    return `/dashboard/tests/result/${quiz.latestAttemptId}`;
  }
  return `/dashboard/tests/${quiz.id}/start`;
}

const CardDecorator = () => (
  <div className="pointer-events-none absolute inset-0 z-10">
    <span className="absolute -left-px -top-px block size-2 border-l-2 border-t-2 border-primary"></span>
    <span className="absolute -right-px -top-px block size-2 border-r-2 border-t-2 border-primary"></span>
    <span className="absolute -bottom-px -left-px block size-2 border-b-2 border-l-2 border-primary"></span>
    <span className="absolute -bottom-px -right-px block size-2 border-b-2 border-r-2 border-primary"></span>
  </div>
);

export function QuizCard({ quiz }: { quiz: QuizSummaryItem }) {
  const isCompleted = quiz.status === "completed";
  const isInProgress = quiz.status === "in_progress";

  // Clean up title if it's redundant with section title
  const displayTitle = quiz.title.startsWith(quiz.sectionTitle) 
    ? quiz.title.replace(quiz.sectionTitle, "").replace(/^[\s—\-:]+/, "") || quiz.title
    : quiz.title;

  return (
    <div className="group relative flex h-full min-h-[340px] flex-col rounded-none border border-border/50 bg-card transition-all duration-300 hover:border-foreground/20 hover:shadow-lg">
      <CardDecorator />
      
      <div className="flex-1 flex flex-col p-5">
        {/* Top Info */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
              {quiz.courseName}
            </span>
            <span className="text-[10px] font-bold text-primary uppercase tracking-tight">
              {quiz.sectionTitle}
            </span>
          </div>
          <Badge 
            variant={isCompleted ? "default" : isInProgress ? "secondary" : "outline"}
            className="rounded-none text-[8px] font-bold uppercase tracking-widest px-1.5 h-4.5"
          >
            {statusLabel(quiz.status)}
          </Badge>
        </div>

        {/* Title */}
        <h3 className="text-lg font-black leading-tight group-hover:text-primary transition-colors line-clamp-2">
          {displayTitle === quiz.title ? quiz.title : `${quiz.sectionTitle}: ${displayTitle}`}
        </h3>

        {/* Description */}
        <p className="mt-3 text-[11px] text-muted-foreground/70 line-clamp-2">
          {quiz.description ?? "Access the full evaluation module."}
        </p>

        {/* Stats Row */}
        <div className="mt-auto pt-5 grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Marks</span>
            <span className="text-sm font-bold text-white">{quiz.totalMarks} pts</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Time Limit</span>
            <span className="text-sm font-bold text-white">{formatDuration(quiz.timeLimitSec)}</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Footer */}
      <div className="flex items-center justify-between bg-muted/10 p-5">
        <Link href={`/dashboard/tests/${quiz.id}`} className="text-[10px] font-bold hover:text-primary transition-colors uppercase tracking-widest">
          Details
        </Link>
        <Button asChild variant="secondary" className="h-9 rounded-none px-5 text-xs font-black transition-all group-hover:bg-primary group-hover:text-primary-foreground">
          <Link href={ctaHref(quiz)}>
            {ctaLabel(quiz.status)}
            <IconArrowRight className="ml-1.5 size-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
