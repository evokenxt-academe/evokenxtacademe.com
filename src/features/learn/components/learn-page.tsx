"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  IconChevronLeft,
  IconChevronRight,
  IconCircleCheckFilled,
  IconPlayerPlayFilled,
  IconClock,
  IconDownload,
  IconCheck,
  IconLoader2,
  IconArrowLeft,
  IconPaperclip,
} from "@tabler/icons-react";

import { VideoPlayer } from "./video-player";
import type {
  StudentCoursePlayerData,
  StudentLecture,
  StudentSection,
  StudentLectureProgress,
  StudentCourseProgress,
} from "@/features/student/lib/lms-data";
import { formatDurationCompact } from "@/features/student/lib/lms-data";

// ─── Types ────────────────────────────────────────────────────────

interface LearnPageProps {
  initialData: SerializablePlayerData;
  slug: string;
}

/** Serializable version of the player data (Map → Record) */
export interface SerializablePlayerData {
  course: StudentCoursePlayerData["course"];
  enrollment: StudentCoursePlayerData["enrollment"];
  sections: StudentSection[];
  orderedLectures: StudentLecture[];
  lectureProgressMap: Record<string, StudentLectureProgress>;
  currentLecture: StudentLecture | null;
  resources: StudentCoursePlayerData["resources"];
  courseProgress: StudentCourseProgress;
  previousLectureId: string | null;
  nextLectureId: string | null;
}

// ─── Helper: Duration formatting ──────────────────────────────────

function fmtDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function fmtSectionDuration(lectures: StudentLecture[]): string {
  const total = lectures.reduce((sum, l) => sum + l.durationSec, 0);
  return formatDurationCompact(total);
}

// ─── Flat lecture type for navigation ─────────────────────────────

interface FlatLectureNav {
  id: string;
  title: string;
  videoUrl: string | null;
  durationSec: number;
  sectionId: string;
  sectionTitle: string;
  globalIndex: number;
}

type LectureResource = SerializablePlayerData["resources"][number];

function isPdfResource(url: string) {
  return /\.pdf($|\?)/i.test(url);
}

function getResourceKind(url: string) {
  if (isPdfResource(url)) return "PDF";
  if (/\.(doc|docx)($|\?)/i.test(url)) return "DOC";
  if (/\.(ppt|pptx)($|\?)/i.test(url)) return "SLIDES";
  return "FILE";
}

function buildFlatLectures(sections: StudentSection[]): FlatLectureNav[] {
  let globalIndex = 0;
  const result: FlatLectureNav[] = [];
  for (const section of sections) {
    for (const lecture of section.lectures) {
      result.push({
        id: lecture.id,
        title: lecture.title,
        videoUrl: lecture.videoUrl,
        durationSec: lecture.durationSec,
        sectionId: section.id,
        sectionTitle: section.title,
        globalIndex: globalIndex++,
      });
    }
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════════
//  LEARN PAGE — Main orchestrator
// ═══════════════════════════════════════════════════════════════════

export function LearnPage({ initialData, slug }: LearnPageProps) {
  const router = useRouter();
  const videoSectionRef = useRef<HTMLDivElement>(null);

  // ── State ──
  const [currentLectureId, setCurrentLectureId] = useState(
    initialData.currentLecture?.id ?? "",
  );
  const [progressMap, setProgressMap] = useState<
    Record<string, StudentLectureProgress>
  >(initialData.lectureProgressMap);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [selectedResource, setSelectedResource] =
    useState<LectureResource | null>(null);
  const [resourcesDialogOpen, setResourcesDialogOpen] = useState(false);
  const lastSyncedRef = useRef<Record<string, number>>({});
  const syncTimeoutRef = useRef<number | null>(null);

  // ── Derived data ──
  const flatLectures = useMemo(
    () => buildFlatLectures(initialData.sections),
    [initialData.sections],
  );

  const currentIndex = useMemo(
    () => flatLectures.findIndex((l) => l.id === currentLectureId),
    [flatLectures, currentLectureId],
  );

  const currentFlatLecture = flatLectures[currentIndex] ?? null;
  const prevLecture = currentIndex > 0 ? flatLectures[currentIndex - 1] : null;
  const nextLecture =
    currentIndex < flatLectures.length - 1
      ? flatLectures[currentIndex + 1]
      : null;

  const currentLectureData = useMemo(
    () =>
      initialData.orderedLectures.find((l) => l.id === currentLectureId) ??
      null,
    [initialData.orderedLectures, currentLectureId],
  );

  const currentProgress = progressMap[currentLectureId];
  const isCurrentCompleted = currentProgress?.isCompleted === true;

  // Compute overall progress
  const completedCount = useMemo(
    () => flatLectures.filter((l) => progressMap[l.id]?.isCompleted).length,
    [flatLectures, progressMap],
  );
  const totalCount = flatLectures.length;
  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // ── Navigation ──
  const navigateToLecture = useCallback(
    (lectureId: string) => {
      setCurrentLectureId(lectureId);
      // Update URL without full page reload
      window.history.replaceState(null, "", `/learn/${slug}/${lectureId}`);
      videoSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    },
    [slug],
  );

  const handlePrev = useCallback(() => {
    if (prevLecture) navigateToLecture(prevLecture.id);
  }, [prevLecture, navigateToLecture]);

  const handleNext = useCallback(() => {
    if (nextLecture) navigateToLecture(nextLecture.id);
  }, [nextLecture, navigateToLecture]);

  // ── Video end → auto next ──
  const handleVideoEnd = useCallback(() => {
    if (nextLecture) {
      // Small delay for UX
      setTimeout(() => navigateToLecture(nextLecture.id), 800);
    }
  }, [nextLecture, navigateToLecture]);

  // ── Progress tracking ──
  const handleTimeUpdate = useCallback(
    (currentTime: number) => {
      if (!currentLectureId) return;
      const watchedSeconds = Math.floor(currentTime);
      // Throttled update — only update if significant progress
      setProgressMap((prev) => {
        const existing = prev[currentLectureId];
        if (existing && existing.watchedSeconds >= watchedSeconds) return prev;
        return {
          ...prev,
          [currentLectureId]: {
            lectureId: currentLectureId,
            isCompleted: existing?.isCompleted ?? false,
            watchedSeconds,
            lastWatchedAt: new Date().toISOString(),
          },
        };
      });
    },
    [currentLectureId],
  );

  const syncProgress = useCallback(
    async (lectureId: string, watchedSeconds: number, isCompleted: boolean) => {
      if (!lectureId) return;
      try {
        const response = await fetch(`/api/student/lectures/${lectureId}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ watchedSeconds, isCompleted }),
        });
        if (response.ok) {
          lastSyncedRef.current[lectureId] = watchedSeconds;
        }
      } catch {
        // Keep UI optimistic and retry on next sync cycle.
      }
    },
    [],
  );

  // ── Mark complete ──
  const handleMarkComplete = useCallback(async () => {
    if (isCurrentCompleted || isMarkingComplete) return;
    setIsMarkingComplete(true);

    try {
      const response = await fetch(
        `/api/student/lectures/${currentLectureId}/progress`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isCompleted: true,
            watchedSeconds: Math.max(
              1,
              Math.round(progressMap[currentLectureId]?.watchedSeconds ?? 0),
            ),
          }),
        },
      );

      if (!response.ok) {
        toast.error("Could not update progress");
        return;
      }

      setProgressMap((prev) => ({
        ...prev,
        [currentLectureId]: {
          lectureId: currentLectureId,
          isCompleted: true,
          watchedSeconds: prev[currentLectureId]?.watchedSeconds ?? 0,
          lastWatchedAt: new Date().toISOString(),
        },
      }));
      lastSyncedRef.current[currentLectureId] = Math.max(
        1,
        Math.round(progressMap[currentLectureId]?.watchedSeconds ?? 0),
      );
      toast.success("Lecture marked as complete");
    } catch {
      toast.error("Could not update progress");
    } finally {
      setIsMarkingComplete(false);
    }
  }, [currentLectureId, isCurrentCompleted, isMarkingComplete, progressMap]);

  useEffect(() => {
    if (!currentLectureId) return;
    const current = progressMap[currentLectureId];
    if (!current) return;

    const lastSynced = lastSyncedRef.current[currentLectureId] ?? 0;
    const delta = current.watchedSeconds - lastSynced;
    if (delta < 10 && !current.isCompleted) return;

    if (syncTimeoutRef.current) {
      window.clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = window.setTimeout(() => {
      void syncProgress(
        currentLectureId,
        current.watchedSeconds,
        current.isCompleted ?? false,
      );
      syncTimeoutRef.current = null;
    }, 1200);

    return () => {
      if (syncTimeoutRef.current) {
        window.clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
    };
  }, [currentLectureId, progressMap, syncProgress]);

  // ── Build FlatLecture for VideoPlayer ──
  const videoLecture = useMemo(() => {
    if (!currentFlatLecture) return null;
    return {
      id: currentFlatLecture.id,
      title: currentFlatLecture.title,
      video_url: currentFlatLecture.videoUrl,
      duration_sec: currentFlatLecture.durationSec,
      sectionId: currentFlatLecture.sectionId,
      sectionTitle: currentFlatLecture.sectionTitle,
      index: currentFlatLecture.globalIndex,
    };
  }, [currentFlatLecture]);

  // ── Get resources for current lecture ──
  const [currentResources, setCurrentResources] = useState<LectureResource[]>(
    initialData.resources ?? [],
  );
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [resourcesError, setResourcesError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    async function fetchResources() {
      if (!currentLectureId) {
        setCurrentResources([]);
        setResourcesError(null);
        return;
      }

      setResourcesLoading(true);
      setResourcesError(null);

      try {
        const res = await fetch(
          `/api/student/lecture-resources?slug=${encodeURIComponent(slug)}&lectureId=${encodeURIComponent(currentLectureId)}`,
          { signal: controller.signal },
        );

        if (!res.ok)
          throw new Error(`Failed to fetch resources (${res.status})`);

        const data = await res.json();
        const list: LectureResource[] = Array.isArray(data)
          ? data
          : (data?.resources ?? []);

        if (mounted) setCurrentResources(list);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error(err);
        if (mounted) {
          setResourcesError(
            err instanceof Error ? err.message : "Failed to load resources",
          );
        }
      } finally {
        if (mounted) setResourcesLoading(false);
      }
    }

    fetchResources();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [currentLectureId, slug]);

  // ─── Course content section ──
  const courseContentSection = (
    <CurriculumSidebarContent
      sections={initialData.sections}
      flatLectures={flatLectures}
      currentLectureId={currentLectureId}
      progressMap={progressMap}
      courseName={initialData.course.name}
      completedCount={completedCount}
      totalCount={totalCount}
      progressPercent={progressPercent}
      onSelectLecture={navigateToLecture}
    />
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col pb-8">
        {/* Top bar */}
        <div className="sticky top-0 z-20 flex h-12 shrink-0 items-center justify-between border-b border-border bg-background/95 px-3 backdrop-blur lg:px-5">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => router.push("/my-courses")}
                    className="text-muted-foreground"
                  >
                    <IconArrowLeft className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Back to My Courses</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="hidden items-center gap-1.5 sm:flex">
              <span className="max-w-50 truncate text-xs font-medium text-muted-foreground">
                {initialData.course.name}
              </span>
              <IconChevronRight className="size-3 text-muted-foreground/50" />
              <span className="max-w-60 truncate text-xs font-medium text-foreground">
                {currentFlatLecture?.title ?? "Select a lecture"}
              </span>
            </div>
            <span className="text-xs font-medium text-foreground sm:hidden">
              {currentFlatLecture?.title ?? "Select a lecture"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {completedCount}/{totalCount} completed
            </span>
            <Progress
              value={progressPercent}
              className="hidden h-1.5 w-24 sm:block"
            />
          </div>
        </div>

        <div ref={videoSectionRef} className="px-3 py-4 lg:px-5 lg:py-5">
          {/* Video Player */}
          <VideoPlayer
            lecture={videoLecture}
            onVideoEnd={handleVideoEnd}
            onTimeUpdate={handleTimeUpdate}
          />

          {/* Below-video controls */}
          <div className="rounded-b-xl border border-t-0 border-border bg-card px-4 py-4 lg:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  {isCurrentCompleted ? (
                    <Badge
                      variant="secondary"
                      className="gap-1 text-[10px] uppercase tracking-wider"
                    >
                      <IconCircleCheckFilled className="size-3 text-emerald-500" />
                      Completed
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-[10px] uppercase tracking-wider"
                    >
                      In Progress
                    </Badge>
                  )}
                  {currentFlatLecture && (
                    <span className="text-[10px] text-muted-foreground">
                      Lecture {currentFlatLecture.globalIndex + 1} of {totalCount}
                    </span>
                  )}
                </div>
                <h1 className="text-lg font-semibold leading-tight text-foreground lg:text-xl">
                  {currentFlatLecture?.title ?? "Select a lecture"}
                </h1>
                {currentLectureData?.description && (
                  <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {currentLectureData.description}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setResourcesDialogOpen(true)}
                >
                  <IconPaperclip className="size-3.5" />
                  Attachments
                  <Badge variant="secondary" className="rounded-full px-1.5">
                    {resourcesLoading ? "…" : currentResources.length}
                  </Badge>
                </Button>

                {/* Mark Complete */}
                <Button
                  onClick={handleMarkComplete}
                  disabled={isCurrentCompleted || isMarkingComplete}
                  size="sm"
                  variant={isCurrentCompleted ? "secondary" : "default"}
                  className="gap-1.5"
                >
                  {isMarkingComplete ? (
                    <IconLoader2 className="size-3.5 animate-spin" />
                  ) : (
                    <IconCheck className="size-3.5" />
                  )}
                  {isCurrentCompleted ? "Completed" : "Mark Complete"}
                </Button>

                {/* Prev / Next */}
                <div className="flex items-center gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={handlePrev}
                          disabled={!prevLecture}
                        >
                          <IconChevronLeft className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {prevLecture
                          ? `Previous: ${prevLecture.title}`
                          : "No previous lecture"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={handleNext}
                          disabled={!nextLecture}
                        >
                          <IconChevronRight className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {nextLecture
                          ? `Next: ${nextLecture.title}`
                          : "No next lecture"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          </div>

          <section id="course-content" className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
            {courseContentSection}
          </section>
        </div>
      </div>

      <Dialog
        open={resourcesDialogOpen}
        onOpenChange={setResourcesDialogOpen}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Lecture Attachments</DialogTitle>
            <DialogDescription>
              Files attached to this lecture from Supabase resources.
            </DialogDescription>
          </DialogHeader>
          {resourcesLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-lg border border-border p-3">
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          ) : resourcesError ? (
            <div className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
              Failed to load resources. {resourcesError}
            </div>
          ) : currentResources.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
              No attachments for this lecture.
            </div>
          ) : (
            <div className="space-y-2">
              {currentResources.map((resource) => {
                const kind = getResourceKind(resource.fileUrl);
                return (
                  <button
                    key={resource.id}
                    type="button"
                    onClick={() => {
                      setResourcesDialogOpen(false);
                      setSelectedResource(resource);
                    }}
                    className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2.5 text-left transition-colors hover:bg-accent/60"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {resource.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Tap to open preview and download.
                      </p>
                    </div>
                    <Badge variant="outline" className="rounded-full text-[10px]">
                      {kind}
                    </Badge>
                  </button>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(selectedResource)}
        onOpenChange={(open) => {
          if (!open) setSelectedResource(null);
        }}
      >
        <DialogContent className="max-w-5xl overflow-hidden p-0 sm:max-w-5xl">
          {selectedResource && (
            <div className="grid max-h-[85vh] grid-cols-1 lg:grid-cols-[360px_1fr]">
              <div className="border-b border-border bg-muted/30 p-5 lg:border-b-0 lg:border-r">
                <DialogHeader>
                  <DialogTitle className="text-xl">
                    {selectedResource.title}
                  </DialogTitle>
                  <DialogDescription>
                    {getResourceKind(selectedResource.fileUrl)} resource for
                    this lecture.
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-5 space-y-3">
                  <div className="rounded-xl border border-border bg-background p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Source
                    </p>
                    <p className="mt-1 break-all text-sm text-foreground/90">
                      {selectedResource.fileUrl}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-background p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Actions
                    </p>
                    <div className="mt-3 flex flex-col gap-2">
                      <Button asChild className="w-full justify-between">
                        <a
                          href={selectedResource.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          download
                        >
                          <span className="inline-flex items-center gap-2">
                            <IconDownload className="size-4" />
                            Download file
                          </span>
                          <span className="text-xs opacity-70">
                            opens in browser
                          </span>
                        </a>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        className="w-full justify-between"
                      >
                        <a
                          href={selectedResource.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <span>Open in new tab</span>
                          <span className="text-xs opacity-70">preview</span>
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex min-h-80 flex-col bg-background">
                <div className="border-b border-border px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Preview
                      </p>
                      <p className="text-xs text-muted-foreground">
                        If the file supports embedding, it will render below.
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className="rounded-full text-[10px] uppercase tracking-wider"
                    >
                      {getResourceKind(selectedResource.fileUrl)}
                    </Badge>
                  </div>
                </div>
                <div className="relative flex-1 bg-muted/20">
                  <iframe
                    title={selectedResource.title}
                    src={selectedResource.fileUrl}
                    className="absolute inset-0 h-full w-full border-0"
                  />
                </div>
                <DialogFooter className="m-0 border-t border-border bg-muted/40 px-4 py-3">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedResource(null)}
                  >
                    Close
                  </Button>
                  <Button asChild>
                    <a
                      href={selectedResource.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      download
                    >
                      Download
                    </a>
                  </Button>
                </DialogFooter>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  CURRICULUM SIDEBAR CONTENT
// ═══════════════════════════════════════════════════════════════════

interface CurriculumSidebarContentProps {
  sections: StudentSection[];
  flatLectures: FlatLectureNav[];
  currentLectureId: string;
  progressMap: Record<string, StudentLectureProgress>;
  courseName: string;
  completedCount: number;
  totalCount: number;
  progressPercent: number;
  onSelectLecture: (lectureId: string) => void;
}

function CurriculumSidebarContent({
  sections,
  flatLectures,
  currentLectureId,
  progressMap,
  courseName,
  completedCount,
  totalCount,
  progressPercent,
  onSelectLecture,
}: CurriculumSidebarContentProps) {
  // Find active section for auto-expand
  const activeSectionId = useMemo(() => {
    const flat = flatLectures.find((l) => l.id === currentLectureId);
    return flat?.sectionId ?? sections[0]?.id ?? "";
  }, [flatLectures, currentLectureId, sections]);

  // Track globalIndex offset per section
  const sectionGlobalIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    let offset = 0;
    for (const section of sections) {
      map.set(section.id, offset);
      offset += section.lectures.length;
    }
    return map;
  }, [sections]);

  return (
    <div className="flex flex-col">
      {/* Sidebar header */}
      <div className="shrink-0 border-b border-border bg-muted/20 px-4 py-4 lg:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Course Content
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{courseName}</p>
          </div>
          <Badge variant="outline" className="rounded-full">
            {totalCount} Lectures
          </Badge>
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <span>Progress</span>
            <span>
              {completedCount}/{totalCount} lectures
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      </div>

      {/* Sections accordion */}
      <div className="p-2 lg:p-3">
        <Accordion
          type="multiple"
          defaultValue={[activeSectionId]}
          className="space-y-2"
        >
          {sections.map((section, sIdx) => {
            const sectionCompleted = section.lectures.filter(
              (l) => progressMap[l.id]?.isCompleted,
            ).length;
            const sectionTotal = section.lectures.length;
            const globalOffset = sectionGlobalIndexMap.get(section.id) ?? 0;

            return (
              <AccordionItem
                key={section.id}
                value={section.id}
                className="overflow-hidden rounded-xl border border-border bg-card"
              >
                <AccordionTrigger className="px-3 py-3 text-sm hover:bg-accent/60 hover:no-underline data-[state=open]:bg-accent/30">
                  <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left">
                    <span className="truncate text-[13px] font-medium">
                      Section {sIdx + 1}: {section.title}
                    </span>
                    <span className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span>
                        {sectionCompleted}/{sectionTotal} lectures
                      </span>
                      <span className="text-muted-foreground/40">·</span>
                      <span className="flex items-center gap-0.5">
                        <IconClock className="size-3" />
                        {fmtSectionDuration(section.lectures)}
                      </span>
                    </span>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="border-t border-border bg-background/60 pb-2 pt-2">
                  <div className="flex flex-col gap-1 px-2">
                    {section.lectures.map((lecture, lIdx) => {
                      const isActive = lecture.id === currentLectureId;
                      const isCompleted =
                        progressMap[lecture.id]?.isCompleted ?? false;
                      const lectureGlobalIndex = globalOffset + lIdx;

                      return (
                        <button
                          key={lecture.id}
                          onClick={() => onSelectLecture(lecture.id)}
                          className={cn(
                            "group/lecture flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors",
                            isActive
                              ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                              : "text-foreground hover:bg-accent/70",
                          )}
                        >
                          {/* Status indicator */}
                          <div className="shrink-0">
                            {isCompleted ? (
                              <IconCircleCheckFilled className="size-4 text-emerald-500" />
                            ) : isActive ? (
                              <IconPlayerPlayFilled className="size-4 text-primary" />
                            ) : (
                              <div className="flex size-4 items-center justify-center rounded-full border-[1.5px] border-muted-foreground/30 text-[9px] font-medium text-muted-foreground">
                                {lectureGlobalIndex + 1}
                              </div>
                            )}
                          </div>

                          {/* Lecture info */}
                          <div className="flex min-w-0 flex-1 flex-col">
                            <span
                              className={cn(
                                "truncate text-[13px] leading-snug",
                                isActive ? "font-medium" : "font-normal",
                              )}
                            >
                              {lecture.title}
                            </span>
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <IconClock className="size-2.5" />
                              {fmtDuration(lecture.durationSec)}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  LOADING SKELETON
// ═══════════════════════════════════════════════════════════════════

export function LearnPageSkeleton() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background lg:flex-row">
      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar skeleton */}
        <div className="flex h-12 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2">
            <Skeleton className="size-7 rounded-md" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
        {/* Video skeleton */}
        <div className="mx-auto w-full max-w-6xl">
          <Skeleton className="aspect-video w-full" />
          <div className="px-4 py-4 lg:px-6">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="mt-2 h-6 w-3/4" />
            <Skeleton className="mt-1.5 h-4 w-1/2" />
          </div>
        </div>
      </div>

      {/* Sidebar skeleton */}
      <aside className="hidden w-90 border-l border-border lg:flex lg:flex-col">
        <div className="border-b border-border p-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-1 h-3 w-48" />
          <div className="mt-3 space-y-1.5">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-1.5 w-full" />
          </div>
        </div>
        <div className="p-2 space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1.5 p-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-3 w-24" />
              <div className="space-y-1 pt-1">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-10 w-full rounded-md" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
