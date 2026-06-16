"use client";

import * as React from "react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  IconArrowLeft,
  IconClick,
  IconBrandYoutube,
  IconRefresh,
} from "@tabler/icons-react";
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
import { useMediaQuery } from "@/hooks/use-media-query";

interface ContentBuilderProps {
  courseId: string;
}

type Selection =
  | { type: "chapter"; chapter: Chapter }
  | { type: "lecture"; lecture: Lecture; chapter: Chapter }
  | null;

export function ContentBuilder({ courseId }: ContentBuilderProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [course, setCourse] = React.useState<CourseDetail | null>(null);
  const [chapters, setChapters] = React.useState<Chapter[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selection, setSelection] = React.useState<Selection>(null);
  const [syncingAll, setSyncingAll] = React.useState(false);

  const showList = !isMobile || selection === null;
  const showEditor = !isMobile || selection !== null;

  const loadData = React.useCallback(async () => {
    try {
      const [courseData, chaptersData] = await Promise.all([
        fetchCourseById(courseId),
        fetchChapters(courseId),
      ]);
      setCourse(courseData);
      setChapters(chaptersData);

      // Refresh selection with latest data
      setSelection((prev) => {
        if (!prev) return null;
        if (prev.type === "chapter") {
          const updated = chaptersData.find((c) => c.id === prev.chapter.id);
          return updated ? { type: "chapter", chapter: updated } : null;
        }
        const chapter = chaptersData.find((c) => c.id === prev.chapter.id);
        const lecture = chapter?.lectures?.find((l) => l.id === prev.lecture.id);
        if (chapter && lecture) {
          return { type: "lecture", lecture, chapter };
        }
        return null;
      });
    } catch {
      toast.error("Failed to load course content");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

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
        () => loadData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lectures" },
        () => loadData()
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

  const linkedSections = chapters.filter((c) => c.youtube_playlist_id).length;
  const totalLectures = chapters.reduce(
    (sum, c) => sum + (c.lectures?.length ?? 0),
    0
  );

  const handleSyncAll = async () => {
    if (linkedSections === 0) {
      toast.error("No sections have YouTube playlists linked");
      return;
    }

    setSyncingAll(true);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/sync-youtube`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");

      const created = data.results?.reduce(
        (s: number, r: { lecturesCreated: number }) => s + r.lecturesCreated,
        0
      );
      const updated = data.results?.reduce(
        (s: number, r: { lecturesUpdated: number }) => s + r.lecturesUpdated,
        0
      );

      toast.success(
        `Synced ${data.chaptersSynced} section(s) — ${created} new, ${updated} updated`
      );
      if (data.errors?.length > 0) {
        toast.warning(`${data.errors.length} section(s) had errors`);
      }
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncingAll(false);
    }
  };

  const handleBack = () => {
    if (isMobile && selection !== null) {
      setSelection(null);
      return;
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100dvh-7rem)] flex-col overflow-hidden rounded-lg border bg-card md:h-[calc(100vh-8rem)] md:flex-row">
        <div className="flex w-full flex-col gap-3 border-b p-3 md:w-72 md:shrink-0 md:border-b-0 md:border-r md:p-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-px w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="hidden flex-1 p-4 md:block md:p-6">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="mt-4 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-3/4" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-7rem)] flex-col overflow-hidden rounded-lg border bg-card md:h-[calc(100vh-8rem)]">
      {/* Top bar */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
        {isMobile && selection !== null ? (
          <button
            type="button"
            onClick={handleBack}
            className="rounded p-1 hover:bg-muted"
            aria-label="Back to sections"
          >
            <IconArrowLeft className="size-4" />
          </button>
        ) : (
          <Link
            href={`/admin/courses/${courseId}/edit`}
            className="rounded p-1 hover:bg-muted"
            aria-label="Back to course edit"
          >
            <IconArrowLeft className="size-4" />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold sm:text-base">
            {course?.title || "Course"}
          </h2>
          <p className="hidden text-xs text-muted-foreground sm:block">
            YouTube playlist auto-sync
          </p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Badge variant="outline" className="gap-1 text-[10px] sm:text-xs">
            <IconBrandYoutube className="size-3 text-red-500" />
            <span className="hidden sm:inline">
              {linkedSections} playlist{linkedSections !== 1 ? "s" : ""}
            </span>
            <span className="sm:hidden">{linkedSections}</span>
          </Badge>
          <Badge variant="secondary" className="text-[10px] sm:text-xs">
            {totalLectures}
            <span className="hidden sm:inline">
              {" "}
              lecture{totalLectures !== 1 ? "s" : ""}
            </span>
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSyncAll}
            disabled={syncingAll || linkedSections === 0}
            className="shrink-0"
          >
            {syncingAll ? (
              <Spinner />
            ) : (
              <IconRefresh className="size-4" />
            )}
            <span className="ml-2 hidden sm:inline">Sync All</span>
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
        {/* Left Panel — sections list */}
        {showList && (
          <div className="flex min-h-0 w-full flex-col md:w-72 md:shrink-0 md:border-r">
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
                onSyncComplete={loadData}
              />
            </div>

            <Separator />

            <div className="shrink-0 p-3">
              <StudyMaterialsSection courseId={courseId} />
            </div>
          </div>
        )}

        {/* Right Panel — editor */}
        {showEditor && (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {selection === null ? (
                <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-4 px-4 text-center">
                  <div className="flex size-14 items-center justify-center rounded-full bg-red-500/10 sm:size-16">
                    <IconBrandYoutube className="size-7 text-red-500 sm:size-8" />
                  </div>
                  <div>
                    <p className="text-base font-medium sm:text-lg">
                      YouTube → LMS Auto-Sync
                    </p>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                      Add a section, link its YouTube playlist ID, and lectures
                      import automatically when you add videos to the playlist.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <IconClick className="size-4" />
                    Select a section or lecture to edit
                  </div>
                </div>
              ) : selection.type === "chapter" ? (
                <ChapterEditor
                  chapter={selection.chapter}
                  onUpdate={loadData}
                  onDelete={() => {
                    setSelection(null);
                    loadData();
                  }}
                />
              ) : (
                <LectureEditor
                  lecture={selection.lecture}
                  chapterTitle={selection.chapter.title}
                  onUpdate={loadData}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
