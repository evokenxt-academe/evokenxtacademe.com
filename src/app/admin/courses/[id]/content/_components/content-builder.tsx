"use client";

import * as React from "react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { IconArrowLeft, IconLayoutSidebar, IconClick } from "@tabler/icons-react";
import { toast } from "sonner";

import { ChapterList } from "./chapter-list";
import { ChapterEditor } from "./chapter-editor";
import { LectureEditor } from "./lecture-editor";
import { StudyMaterialsSection } from "./study-materials-section";
import {
  fetchChapters,
  fetchCourseById,
  type Chapter,
  type Lecture,
  type CourseDetail,
} from "@/lib/supabase/queries/courses-admin";
import { createClient } from "@/lib/supabase/client";

interface ContentBuilderProps {
  courseId: string;
}

type Selection =
  | { type: "chapter"; chapter: Chapter }
  | { type: "lecture"; lecture: Lecture; chapter: Chapter }
  | null;

export function ContentBuilder({ courseId }: ContentBuilderProps) {
  const [course, setCourse] = React.useState<CourseDetail | null>(null);
  const [chapters, setChapters] = React.useState<Chapter[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selection, setSelection] = React.useState<Selection>(null);

  const loadData = React.useCallback(async () => {
    try {
      const [courseData, chaptersData] = await Promise.all([
        fetchCourseById(courseId),
        fetchChapters(courseId),
      ]);
      setCourse(courseData);
      setChapters(chaptersData);
    } catch {
      toast.error("Failed to load course content");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Realtime for chapters + lectures
  React.useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`content-${courseId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chapters",
          filter: `course_id=eq.${courseId}`,
        },
        () => {
          loadData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lectures",
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [courseId, loadData]);

  const selectedId = selection
    ? selection.type === "chapter"
      ? selection.chapter.id
      : selection.lecture.id
    : null;

  const handleRefresh = () => {
    loadData();
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-8rem)]">
        <div className="flex w-72 flex-col gap-3 border-r p-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-px w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="mt-4 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-3/4" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-lg border bg-card">
      {/* Left Panel */}
      <div className="flex w-72 shrink-0 flex-col border-r">
        {/* Course title + back */}
        <div className="flex items-center gap-2 px-4 py-3">
          <Link
            href={`/admin/courses/${courseId}/edit`}
            className="rounded p-1 hover:bg-muted"
          >
            <IconArrowLeft className="size-4" />
          </Link>
          <h2 className="flex-1 truncate text-sm font-semibold">
            {course?.title || "Course"}
          </h2>
        </div>

        <Separator />

        {/* Chapter list */}
        <div className="flex-1 overflow-y-auto p-3">
          <ChapterList
            courseId={courseId}
            chapters={chapters}
            onChaptersChange={setChapters}
            onSelectChapter={(chapter) =>
              setSelection({ type: "chapter", chapter })
            }
            onSelectLecture={(lecture, chapter) =>
              setSelection({ type: "lecture", lecture, chapter })
            }
            selectedId={selectedId}
          />
        </div>

        <Separator />

        {/* Study Materials */}
        <div className="p-3">
          <StudyMaterialsSection courseId={courseId} />
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 overflow-y-auto p-6">
        {selection === null ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <IconClick className="size-12 text-muted-foreground" />
            <div>
              <p className="text-lg font-medium">Select a chapter or lecture</p>
              <p className="text-sm text-muted-foreground">
                Click on a chapter or lecture from the left panel to edit it
              </p>
            </div>
          </div>
        ) : selection.type === "chapter" ? (
          <ChapterEditor
            chapter={selection.chapter}
            onUpdate={handleRefresh}
            onDelete={() => {
              setSelection(null);
              handleRefresh();
            }}
          />
        ) : (
          <LectureEditor
            lecture={selection.lecture}
            chapterTitle={selection.chapter.title}
            onUpdate={handleRefresh}
          />
        )}
      </div>
    </div>
  );
}
