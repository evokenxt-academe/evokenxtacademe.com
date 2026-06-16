"use client";

import { useMemo, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ChevronRight,
  Layers,
  MoreHorizontal,
  Pencil,
  Eye,
  BarChart3,
  Copy,
  Trash2,
  FileQuestion,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { usePublishQuiz, useDeleteQuiz } from "@/hooks/useQuizzes";
import { toast } from "sonner";
import type { QuizSummary } from "@/types/quiz";

const TYPE_BADGE: Record<string, string> = {
  practice: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  graded: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  mock_exam: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  final_exam: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const COURSE_WIDE_KEY = "__course_wide__";

type QuizRow = QuizSummary & { subject_name?: string | null };

interface CourseGroup {
  courseId: string;
  courseTitle: string;
  programBody: string | null;
  levelLabel: string | null;
  chapters: ChapterGroup[];
  totalQuizzes: number;
}

interface ChapterGroup {
  key: string;
  chapterId: string | null;
  chapterTitle: string;
  quizzes: QuizRow[];
}

function groupQuizzesByCourse(quizzes: QuizRow[]): CourseGroup[] {
  const courseMap = new Map<string, CourseGroup>();

  for (const quiz of quizzes) {
    const courseId = quiz.course_id ?? "unknown";
    const courseTitle = quiz.course_title ?? "Unknown Course";

    if (!courseMap.has(courseId)) {
      courseMap.set(courseId, {
        courseId,
        courseTitle,
        programBody: quiz.program_body,
        levelLabel: quiz.level_label,
        chapters: [],
        totalQuizzes: 0,
      });
    }

    const course = courseMap.get(courseId)!;
    course.totalQuizzes += 1;

    const chapterKey = quiz.chapter_id ?? COURSE_WIDE_KEY;
    let chapter = course.chapters.find((c) => c.key === chapterKey);
    if (!chapter) {
      chapter = {
        key: chapterKey,
        chapterId: quiz.chapter_id,
        chapterTitle: quiz.chapter_id
          ? (quiz.chapter_title ?? "Untitled Chapter")
          : "All Chapters (Course-wide)",
        quizzes: [],
      };
      course.chapters.push(chapter);
    }
    chapter.quizzes.push(quiz);
  }

  return Array.from(courseMap.values())
    .map((course) => ({
      ...course,
      chapters: course.chapters.sort((a, b) => {
        if (a.chapterId === null) return -1;
        if (b.chapterId === null) return 1;
        return a.chapterTitle.localeCompare(b.chapterTitle);
      }),
    }))
    .sort((a, b) => a.courseTitle.localeCompare(b.courseTitle));
}

function groupQuizzesByChapter(quizzes: QuizRow[]): ChapterGroup[] {
  const chapterMap = new Map<string, ChapterGroup>();

  for (const quiz of quizzes) {
    const chapterKey = quiz.chapter_id ?? COURSE_WIDE_KEY;
    let chapter = chapterMap.get(chapterKey);
    if (!chapter) {
      chapter = {
        key: chapterKey,
        chapterId: quiz.chapter_id,
        chapterTitle: quiz.chapter_id
          ? (quiz.chapter_title ?? "Untitled Chapter")
          : "All Chapters (Course-wide)",
        quizzes: [],
      };
      chapterMap.set(chapterKey, chapter);
    }
    chapter.quizzes.push(quiz);
  }

  return Array.from(chapterMap.values()).sort((a, b) => {
    if (a.chapterId === null) return -1;
    if (b.chapterId === null) return 1;
    return a.chapterTitle.localeCompare(b.chapterTitle);
  });
}

interface QuizChapterSectionsProps {
  chapters: ChapterGroup[];
  onPublish: (id: string, published: boolean) => void;
  onDelete: (id: string) => void;
  onNavigate: (path: string) => void;
  emptyAction?: ReactNode;
}

export function QuizChapterSections({
  chapters,
  onPublish,
  onDelete,
  onNavigate,
  emptyAction,
}: QuizChapterSectionsProps) {
  if (chapters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
        <FileQuestion className="mb-4 h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No tests in this section yet.</p>
        {emptyAction}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {chapters.map((chapter) => (
        <div key={chapter.key} className="space-y-2">
          <div className="flex items-center gap-2">
            <ChevronRight className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">{chapter.chapterTitle}</h3>
            <Badge variant="secondary" className="text-xs">
              {chapter.quizzes.length}
            </Badge>
          </div>
          <div className="ml-6 space-y-2">
            {chapter.quizzes.map((quiz) => (
              <QuizRowCard
                key={quiz.id}
                quiz={quiz}
                onPublish={(published) => onPublish(quiz.id, published)}
                onDelete={() => onDelete(quiz.id)}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface QuizCourseTreeProps {
  data: QuizRow[];
  isLoading: boolean;
  defaultExpandedCourseId?: string;
  singleCourse?: boolean;
  emptyAction?: ReactNode;
}

export function QuizCourseTree({
  data,
  isLoading,
  defaultExpandedCourseId,
  singleCourse = false,
  emptyAction,
}: QuizCourseTreeProps) {
  const router = useRouter();
  const publishMutation = usePublishQuiz();
  const deleteMutation = useDeleteQuiz();

  const courses = useMemo(() => groupQuizzesByCourse(data), [data]);

  const defaultExpanded = defaultExpandedCourseId
    ? [defaultExpandedCourseId]
    : courses.length === 1
      ? [courses[0].courseId]
      : [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
        <FileQuestion className="mb-4 h-12 w-12 text-muted-foreground/40" />
        <h3 className="text-lg font-semibold">No quizzes found</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a quiz for a course or chapter to get started.
        </p>
        {emptyAction ?? (
          <Button className="mt-4" onClick={() => router.push("/admin/quizzes/new")}>
            + New Quiz
          </Button>
        )}
      </div>
    );
  }

  if (singleCourse) {
    const chapters = groupQuizzesByChapter(data);
    return (
      <QuizChapterSections
        chapters={chapters}
        onPublish={(id, published) =>
          publishMutation.mutate({ id, published })
        }
        onDelete={(id) => deleteMutation.mutate(id)}
        onNavigate={(path) => router.push(path)}
        emptyAction={emptyAction}
      />
    );
  }

  return (
    <Accordion
      type="multiple"
      defaultValue={defaultExpanded}
      className="space-y-3"
    >
      {courses.map((course) => (
        <AccordionItem
          key={course.courseId}
          value={course.courseId}
          className="overflow-hidden rounded-lg border bg-card px-0"
        >
          <AccordionTrigger className="px-4 py-4 hover:no-underline data-[state=open]:border-b">
            <div className="flex flex-1 items-center gap-3 text-left">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <BookOpen className="size-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{course.courseTitle}</p>
                <p className="text-xs text-muted-foreground">
                  {[course.programBody, course.levelLabel]
                    .filter(Boolean)
                    .join(" · ") || "Course"}
                  {" · "}
                  {course.totalQuizzes} test{course.totalQuizzes !== 1 ? "s" : ""}
                  {" · "}
                  {course.chapters.length} chapter group
                  {course.chapters.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-2">
            <QuizChapterSections
              chapters={course.chapters}
              onPublish={(id, published) =>
                publishMutation.mutate({ id, published })
              }
              onDelete={(id) => deleteMutation.mutate(id)}
              onNavigate={(path) => router.push(path)}
            />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

function QuizRowCard({
  quiz,
  onPublish,
  onDelete,
  onNavigate,
}: {
  quiz: QuizRow;
  onPublish: (published: boolean) => void;
  onDelete: () => void;
  onNavigate: (path: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <Link
          href={`/admin/quizzes/${quiz.id}`}
          className="font-medium hover:underline"
        >
          {quiz.title}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <Badge
            variant="secondary"
            className={`text-xs ${TYPE_BADGE[quiz.type] ?? ""}`}
          >
            {quiz.type.replace("_", " ")}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {quiz.question_count} questions · {quiz.total_marks} marks
          </span>
          {quiz.attempt_count > 0 && (
            <span className="text-xs text-muted-foreground">
              · {quiz.attempt_count} attempts
              {quiz.avg_score != null ? ` · avg ${quiz.avg_score}%` : ""}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {quiz.is_published ? "Published" : "Draft"}
          </span>
          <Switch
            checked={quiz.is_published}
            onCheckedChange={onPublish}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onNavigate(`/admin/quizzes/${quiz.id}`)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onNavigate(`/admin/quizzes/${quiz.id}/builder`)}
            >
              <Layers className="mr-2 h-4 w-4" />
              Builder
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onNavigate(`/admin/quizzes/${quiz.id}/preview`)}
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onNavigate(`/admin/quizzes/${quiz.id}/results`)}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Results
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={async () => {
                const res = await fetch(`/api/quiz/${quiz.id}/duplicate`, {
                  method: "POST",
                });
                if (res.ok) {
                  const { newQuizId } = await res.json();
                  toast.success("Quiz duplicated");
                  onNavigate(`/admin/quizzes/${newQuizId}`);
                } else {
                  toast.error("Duplication failed");
                }
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete quiz?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete &quot;{quiz.title}&quot; and all
                    its questions.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onDelete}
                    className="bg-destructive text-destructive-foreground"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
