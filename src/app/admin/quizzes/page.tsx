"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { QuizStatsRow } from "@/components/quiz/QuizStatsRow";
import { QuizAnalyticsRow } from "@/components/quiz/QuizAnalyticsRow";
import { QuizCourseTree } from "@/components/quiz/QuizCourseTree";
import { LiveIndicator } from "@/components/quiz/LiveIndicator";
import { useQuizzes } from "@/hooks/useQuizzes";
import { useChapters } from "@/hooks/useTopics";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function QuizDashboardPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [program, setProgram] = useState("all");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [course, setCourse] = useState("all");
  const [chapter, setChapter] = useState("all");

  const filters = {
    search: search || undefined,
    program: program !== "all" ? program : undefined,
    type: type !== "all" ? type : undefined,
    status: status !== "all" ? status : undefined,
    courseId: course !== "all" ? course : undefined,
    chapterId:
      chapter === "all"
        ? undefined
        : chapter === "course-wide"
          ? "course-wide"
          : chapter,
  };

  const { data: quizzes, isLoading } = useQuizzes(filters);

  const { data: allQuizzesForCourses } = useQuizzes({
    program: program !== "all" ? program : undefined,
    type: type !== "all" ? type : undefined,
    status: status !== "all" ? status : undefined,
  });

  const { data: chapters } = useChapters(course !== "all" ? course : undefined);

  const courseOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const q of allQuizzesForCourses ?? []) {
      if (q.course_id && q.course_title) {
        map.set(q.course_id, q.course_title);
      }
    }
    return Array.from(map.entries())
      .map(([id, title]) => ({ id, title }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [allQuizzesForCourses]);

  const handleCourseChange = (value: string) => {
    setCourse(value);
    setChapter("all");
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Quizzes & Tests
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Manage course-wise and chapter-wise assessments
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <LiveIndicator table="quizzes" />
          <Button
            onClick={() => router.push("/admin/quizzes/new")}
            className="gap-2"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Quiz
          </Button>
        </div>
      </div>

      <QuizStatsRow />
      <QuizAnalyticsRow />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-50 max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search quizzes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={course} onValueChange={handleCourseChange}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Course" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {courseOptions.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={chapter}
          onValueChange={setChapter}
          disabled={course === "all"}
        >
          <SelectTrigger className="w-48">
            <SelectValue
              placeholder={course === "all" ? "Select course first" : "Chapter"}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Chapters</SelectItem>
            <SelectItem value="course-wide">
              All Chapters (Course-wide test)
            </SelectItem>
            {(chapters ?? []).map((ch) => (
              <SelectItem key={ch.id} value={ch.id}>
                {ch.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={program} onValueChange={setProgram}>
          <SelectTrigger className="w-35">
            <SelectValue placeholder="Program" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Programs</SelectItem>
            <SelectItem value="ACCA">ACCA</SelectItem>
            <SelectItem value="CFA">CFA</SelectItem>
            <SelectItem value="CMA">CMA</SelectItem>
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-35">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="practice">Practice</SelectItem>
            <SelectItem value="graded">Graded</SelectItem>
            <SelectItem value="mock_exam">Mock Exam</SelectItem>
            <SelectItem value="final_exam">Final Exam</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-30">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <QuizCourseTree
        data={quizzes ?? []}
        isLoading={isLoading}
        defaultExpandedCourseId={course !== "all" ? course : undefined}
      />
    </div>
  );
}
