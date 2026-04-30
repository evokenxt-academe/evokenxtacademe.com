"use client";

import * as React from "react";
import {
  IconBook,
  IconLayoutList,
  IconFileText,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

import type { CourseSectionOption, QuizSummary } from "../types";

// ── Types ─────────────────────────────────────────────────────

interface CourseQuizSelectorProps {
  courseSections: CourseSectionOption[];
  isLoadingCourses: boolean;
  selectedCourseId: string;
  selectedSectionId: string;
  selectedQuizId: string | null;
  quiz: QuizSummary | null;
  isLoadingQuiz: boolean;
  onCourseChange: (courseId: string) => void;
  onSectionChange: (sectionId: string) => void;
}

// ── Component ─────────────────────────────────────────────────

export function CourseQuizSelector({
  courseSections,
  isLoadingCourses,
  selectedCourseId,
  selectedSectionId,
  quiz,
  isLoadingQuiz,
  onCourseChange,
  onSectionChange,
}: CourseQuizSelectorProps) {
  const selectedCourse = courseSections.find(
    (c) => c.courseId === selectedCourseId
  );
  const sections = selectedCourse?.sections ?? [];

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {/* Course */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <IconBook className="size-3.5" />
            Course
          </label>
          {isLoadingCourses ? (
            <Skeleton className="h-10 rounded-xl" />
          ) : (
            <Select value={selectedCourseId} onValueChange={onCourseChange}>
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {courseSections.map((cs) => (
                  <SelectItem key={cs.courseId} value={cs.courseId}>
                    {cs.courseName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Section */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <IconLayoutList className="size-3.5" />
            Section
          </label>
          <Select
            value={selectedSectionId}
            onValueChange={onSectionChange}
            disabled={!selectedCourseId}
          >
            <SelectTrigger className="h-10 rounded-xl">
              <SelectValue
                placeholder={
                  selectedCourseId ? "Select a section" : "Select course first"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {sections.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quiz Status */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <IconFileText className="size-3.5" />
            Quiz
          </label>
          {isLoadingQuiz && selectedSectionId ? (
            <Skeleton className="h-10 rounded-xl" />
          ) : quiz ? (
            <div className="flex h-10 items-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-3">
              <span className="truncate text-sm font-medium">
                {quiz.title}
              </span>
              <Badge
                variant={quiz.isPublished ? "default" : "secondary"}
                className="ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px]"
              >
                {quiz.isPublished ? "Published" : "Draft"}
              </Badge>
            </div>
          ) : (
            <div className="flex h-10 items-center rounded-xl border border-dashed border-border/60 px-3">
              <span className="text-sm text-muted-foreground">
                {selectedSectionId
                  ? "No quiz found — create one below"
                  : "Select a section first"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
