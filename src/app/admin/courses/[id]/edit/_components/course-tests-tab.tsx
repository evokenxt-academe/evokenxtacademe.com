"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QuizCourseTree } from "@/components/quiz/QuizCourseTree";
import { useQuizzes } from "@/hooks/useQuizzes";
import { useChapters } from "@/hooks/useTopics";

interface CourseTestsTabProps {
  courseId: string;
  courseTitle: string;
}

export function CourseTestsTab({ courseId, courseTitle }: CourseTestsTabProps) {
  const [chapter, setChapter] = useState("all");

  const chapterFilter =
    chapter === "all"
      ? undefined
      : chapter === "course-wide"
        ? "course-wide"
        : chapter;

  const { data: quizzes, isLoading } = useQuizzes({
    courseId,
    chapterId: chapterFilter,
  });

  const { data: chapters } = useChapters(courseId);

  const newQuizUrl = (chapterId?: string) => {
    const params = new URLSearchParams({ courseId });
    if (chapterId) params.set("chapterId", chapterId);
    return `/admin/quizzes/new?${params.toString()}`;
  };

  const emptyAction = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="mt-4 gap-2" size="sm">
          <Plus className="h-4 w-4" />
          Add Test
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center">
        <DropdownMenuItem asChild>
          <Link href={newQuizUrl("none")}>All Chapters (course-wide test)</Link>
        </DropdownMenuItem>
        {(chapters ?? []).map((ch) => (
          <DropdownMenuItem key={ch.id} asChild>
            <Link href={newQuizUrl(ch.id)}>{ch.title}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <Card>
      <CardContent className="flex flex-col gap-6 pt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Course Tests</h2>
            <p className="text-sm text-muted-foreground">
              Manage chapter-wise and course-wide tests for {courseTitle}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={chapter} onValueChange={setChapter}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Filter by chapter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Chapters</SelectItem>
                <SelectItem value="course-wide">
                  All Chapters (course-wide test)
                </SelectItem>
                {(chapters ?? []).map((ch) => (
                  <SelectItem key={ch.id} value={ch.id}>
                    {ch.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Test
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={newQuizUrl("none")}>
                    All Chapters (course-wide test)
                  </Link>
                </DropdownMenuItem>
                {(chapters ?? []).map((ch) => (
                  <DropdownMenuItem key={ch.id} asChild>
                    <Link href={newQuizUrl(ch.id)}>{ch.title}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {!isLoading && (quizzes ?? []).length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
            <FileQuestion className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <h3 className="text-base font-semibold">No tests yet</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Add a course-wide exam or chapter-specific tests for your students.
            </p>
            {emptyAction}
          </div>
        ) : (
          <QuizCourseTree
            data={quizzes ?? []}
            isLoading={isLoading}
            singleCourse
            emptyAction={emptyAction}
          />
        )}
      </CardContent>
    </Card>
  );
}
