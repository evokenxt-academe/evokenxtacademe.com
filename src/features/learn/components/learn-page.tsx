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
            <SidebarTrigger className="hidden sm:flex" />
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
          <div className="mt-4 rounded-xl border border-border/60 bg-card px-5 py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  {isCurrentCompleted ? (
                    <Badge
                      variant="secondary"
                      className="gap-1.5 text-[10px] uppercase tracking-wider"
                    >
                      <IconCircleCheckFilled className="size-3 text-emerald-500" />
                      Completed
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-[10px] uppercase tracking-wider text-muted-foreground"
                    >
                      In Progress
                    </Badge>
                  )}
                  {currentFlatLecture && (
                    <span className="text-xs font-medium text-muted-foreground">
                      Lecture {currentFlatLecture.globalIndex + 1} of {totalCount}
                    </span>
                  )}
                </div>
                <h1 className="text-xl font-bold leading-tight text-foreground lg:text-2xl">
                  {currentFlatLecture?.title ?? "Select a lecture"}
                </h1>
                {currentLectureData?.description && (
                  <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {currentLectureData.description}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setResourcesDialogOpen(true)}
                >
                  <IconPaperclip className="size-4 text-muted-foreground" />
                  Attachments
                  <Badge variant="secondary" className="rounded-full px-1.5 text-[10px]">
                    {resourcesLoading ? "…" : currentResources.length}
                  </Badge>
                </Button>

                {/* Mark Complete */}
                <Button
                  onClick={handleMarkComplete}
                  disabled={isCurrentCompleted || isMarkingComplete}
                  size="sm"
                  variant={isCurrentCompleted ? "secondary" : "default"}
                  className="gap-1.5 min-w-[140px]"
                >
                  {isMarkingComplete ? (
                    <IconLoader2 className="size-4 animate-spin" />
                  ) : (
                    <IconCheck className="size-4" />
                  )}
                  {isCurrentCompleted ? "Completed" : "Mark Complete"}
                </Button>

                <div className="h-6 w-px bg-border/60 mx-1 hidden sm:block" />

                {/* Prev / Next */}
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handlePrev}
                          disabled={!prevLecture}
                          className="size-9"
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
                          size="icon"
                          onClick={handleNext}
                          disabled={!nextLecture}
                          className="size-9"
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
        <DialogContent className="flex h-[95vh] w-[95vw] max-w-[95vw] sm:max-w-[1600px] flex-col overflow-hidden p-0">
          {selectedResource && (
            <div className="grid h-full grid-cols-1 lg:grid-cols-[320px_1fr]">
              {/* Sidebar */}
              <div className="flex flex-col border-b border-border bg-muted/10 p-6 lg:border-b-0 lg:border-r">
                <DialogHeader className="text-left">
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                      <IconPaperclip className="size-6" />
                    </div>
                    <div className="min-w-0">
                      <DialogTitle className="truncate text-lg font-semibold leading-tight text-foreground">
                        {selectedResource.title}
                      </DialogTitle>
                      <DialogDescription className="mt-1 text-xs">
                        {getResourceKind(selectedResource.fileUrl)} Resource
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <div className="mt-8 flex flex-col gap-6">
                  <div className="space-y-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Source
                    </p>
                    <div className="rounded-xl border border-border/60 bg-background/50 p-3">
                      <p className="break-all text-xs text-foreground/80 leading-relaxed">
                        {selectedResource.fileUrl}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Quick Actions
                    </p>
                    <div className="flex flex-col gap-2.5">
                      <Button asChild size="lg" className="w-full justify-between shadow-sm">
                        <a
                          href={selectedResource.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          download
                        >
                          <span className="inline-flex items-center gap-2 font-medium">
                            <IconDownload className="size-4.5" />
                            Download File
                          </span>
                        </a>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        size="lg"
                        className="w-full justify-between bg-background"
                      >
                        <a
                          href={selectedResource.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <span className="font-medium">Open in new tab</span>
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Area */}
              <div className="flex flex-col bg-accent/30">
                <div className="flex items-center justify-between border-b border-border/50 bg-background/50 px-5 py-3 backdrop-blur-md">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Document Preview
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Rendered natively within your browser
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-foreground shadow-sm ring-1 ring-border"
                  >
                    {getResourceKind(selectedResource.fileUrl)}
                  </Badge>
                </div>
                <div className="relative flex-1 bg-black/5">
                  {/* For PDFs, we add #toolbar=0&navpanes=0 for a cleaner look natively if supported */}
                  <iframe
                    title={selectedResource.title}
                    src={selectedResource.fileUrl + (isPdfResource(selectedResource.fileUrl) ? "#toolbar=0&navpanes=0" : "")}
                    className="absolute inset-0 h-full w-full border-0 rounded-br-lg shadow-inner"
                  />
                </div>
                <DialogFooter className="m-0 flex items-center justify-between border-t border-border/50 bg-background/50 px-5 py-3 backdrop-blur-md sm:justify-between">
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedResource(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Dismiss
                  </Button>
                  <Button asChild>
                    <a
                      href={selectedResource.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      download
                    >
                      <IconDownload className="mr-2 size-4" />
                      Save Copy
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
    <div className="flex flex-col h-full bg-muted/10">
      {/* Sidebar header */}
      <div className="shrink-0 border-b border-border/60 bg-background px-5 py-5">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Curriculum
          </h2>
          <p className="text-base font-semibold leading-tight text-foreground line-clamp-2">
            {courseName}
          </p>
        </div>
        <div className="mt-5 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Course Progress</span>
            <span className="text-foreground">
              {progressPercent}%
            </span>
          </div>
          <Progress value={progressPercent} className="h-1.5" />
          <p className="text-[10px] text-muted-foreground text-right">
            {completedCount} of {totalCount} completed
          </p>
        </div>
      </div>

      {/* Sections accordion */}
      <div className="flex-1 overflow-y-auto p-4">
        <Accordion
          type="multiple"
          defaultValue={[activeSectionId]}
          className="space-y-3"
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
                className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm"
              >
                <AccordionTrigger className="px-4 py-3.5 hover:bg-muted/40 hover:no-underline data-[state=open]:bg-muted/20 data-[state=open]:border-b border-border/60 transition-colors">
                  <div className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Section {sIdx + 1}
                    </span>
                    <span className="truncate text-sm font-semibold text-foreground leading-snug">
                      {section.title}
                    </span>
                    <span className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      <span>
                        {sectionCompleted}/{sectionTotal}
                      </span>
                      <span className="text-border">·</span>
                      <span className="flex items-center gap-1">
                        <IconClock className="size-3" />
                        {fmtSectionDuration(section.lectures)}
                      </span>
                    </span>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="bg-background pt-2 pb-2">
                  <div className="flex flex-col gap-0.5 px-1.5">
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
                            "group/lecture flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-all",
                            isActive
                              ? "bg-primary/5 text-primary ring-1 ring-primary/20 shadow-sm"
                              : "text-foreground hover:bg-muted/60",
                          )}
                        >
                          {/* Status indicator */}
                          <div className="shrink-0 mt-0.5">
                            {isCompleted ? (
                              <IconCircleCheckFilled className="size-4 text-emerald-500" />
                            ) : isActive ? (
                              <IconPlayerPlayFilled className="size-4 text-primary" />
                            ) : (
                              <div className="flex size-4 items-center justify-center rounded-full border border-muted-foreground/40 text-[9px] font-medium text-muted-foreground">
                                {lectureGlobalIndex + 1}
                              </div>
                            )}
                          </div>

                          {/* Lecture info */}
                          <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <span
                              className={cn(
                                "text-sm leading-tight",
                                isActive ? "font-semibold" : "font-medium",
                              )}
                            >
                              {lecture.title}
                            </span>
                            <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                              <IconClock className="size-3" />
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
