"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import {
  IconPlus,
  IconTrash,
  IconGripVertical,
  IconChevronDown,
  IconChevronUp,
  IconVideo,
  IconFile,
  IconEye,
  IconEyeOff,
  IconPlaylistAdd,
  IconClock,
  IconLayersIntersect,
  IconBrandYoutube,
  IconUpload,
  IconCloudUpload,
  IconCheck,
  IconX,
  IconPhoto,
  IconFileTypePdf,
  IconLink,
  IconLoader2,
} from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import type {
  CourseFormData,
  Section,
  Lecture,
  Resource,
} from "../../types/course";
import {
  uploadVideoToYouTube,
  uploadResourceFile,
  fetchYouTubeVideoDuration,
  type UploadProgress,
} from "../../services/course-api";

const YoutubeVideoPlayer = dynamic(
  () =>
    import("../youtube-video-player").then(
      (module) => module.YoutubeVideoPlayer,
    ),
  { ssr: false },
);

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

function formatFullDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatEta(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

// ─────────────────────────────────────────────────────────────
// Main Curriculum Step
// ─────────────────────────────────────────────────────────────

interface CurriculumStepProps {
  formData: CourseFormData;
  errors: Record<string, string>;
  addSection: () => void;
  updateSection: (sectionId: string, data: Partial<Section>) => void;
  deleteSection: (sectionId: string) => void;
  toggleSectionCollapse: (sectionId: string) => void;
  reorderSections: (fromIndex: number, toIndex: number) => void;
  addLecture: (sectionId: string) => void;
  updateLecture: (
    sectionId: string,
    lectureId: string,
    data: Partial<Lecture>,
  ) => void;
  deleteLecture: (sectionId: string, lectureId: string) => void;
  reorderLectures: (
    sectionId: string,
    fromIndex: number,
    toIndex: number,
  ) => void;
  addResource: (sectionId: string, lectureId: string) => void;
  updateResource: (
    sectionId: string,
    lectureId: string,
    resourceId: string,
    data: Partial<Resource>,
  ) => void;
  deleteResource: (
    sectionId: string,
    lectureId: string,
    resourceId: string,
  ) => void;
  stats: {
    totalSections: number;
    totalLectures: number;
    totalDuration: number;
    totalResources: number;
  };
}

export function CurriculumStep({
  formData,
  errors,
  addSection,
  updateSection,
  deleteSection,
  toggleSectionCollapse,
  reorderSections,
  addLecture,
  updateLecture,
  deleteLecture,
  reorderLectures,
  addResource,
  updateResource,
  deleteResource,
  stats,
}: CurriculumStepProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <IconLayersIntersect className="size-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Curriculum Builder</h2>
            <p className="text-sm text-muted-foreground">
              Organize your content into sections and lectures
            </p>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Sections
          </span>
          <Badge variant="secondary">{stats.totalSections}</Badge>
        </div>
        <Separator orientation="vertical" className="h-4" />
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Lectures
          </span>
          <Badge variant="secondary">{stats.totalLectures}</Badge>
        </div>
        <Separator orientation="vertical" className="h-4" />
        <div className="flex items-center gap-1.5">
          <IconClock className="size-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            {formatDuration(stats.totalDuration)}
          </span>
          {stats.totalDuration > 0 && (
            <Badge variant="outline" className="gap-1 text-[10px] font-mono">
              {formatFullDuration(stats.totalDuration)}
            </Badge>
          )}
        </div>
        <Separator orientation="vertical" className="h-4" />
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Resources
          </span>
          <Badge variant="secondary">{stats.totalResources}</Badge>
        </div>
        {stats.totalDuration > 0 && (
          <>
            <Separator orientation="vertical" className="h-4" />
            <Badge variant="default" className="gap-1 text-[10px]">
              <IconCheck className="size-2.5" />
              Duration auto-calculated
            </Badge>
          </>
        )}
      </div>

      {errors.sections && (
        <p className="text-sm text-destructive">{errors.sections}</p>
      )}

      {/* Sections */}
      <div className="flex flex-col gap-4">
        {formData.sections.map((section, sectionIndex) => (
          <SectionCard
            key={section.id}
            section={section}
            sectionIndex={sectionIndex}
            totalSections={formData.sections.length}
            errors={errors}
            updateSection={updateSection}
            deleteSection={deleteSection}
            toggleSectionCollapse={toggleSectionCollapse}
            reorderSections={reorderSections}
            addLecture={addLecture}
            updateLecture={updateLecture}
            deleteLecture={deleteLecture}
            reorderLectures={reorderLectures}
            addResource={addResource}
            updateResource={updateResource}
            deleteResource={deleteResource}
          />
        ))}
      </div>

      {/* Add Section */}
      <Button
        type="button"
        variant="outline"
        onClick={addSection}
        className="w-full border-dashed"
      >
        <IconPlus data-icon="inline-start" />
        Add Section
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Section Card
// ─────────────────────────────────────────────────────────────

function SectionCard({
  section,
  sectionIndex,
  totalSections,
  errors,
  updateSection,
  deleteSection,
  toggleSectionCollapse,
  reorderSections,
  addLecture,
  updateLecture,
  deleteLecture,
  reorderLectures,
  addResource,
  updateResource,
  deleteResource,
}: {
  section: Section;
  sectionIndex: number;
  totalSections: number;
  errors: Record<string, string>;
  updateSection: (sectionId: string, data: Partial<Section>) => void;
  deleteSection: (sectionId: string) => void;
  toggleSectionCollapse: (sectionId: string) => void;
  reorderSections: (fromIndex: number, toIndex: number) => void;
  addLecture: (sectionId: string) => void;
  updateLecture: (
    sectionId: string,
    lectureId: string,
    data: Partial<Lecture>,
  ) => void;
  deleteLecture: (sectionId: string, lectureId: string) => void;
  reorderLectures: (
    sectionId: string,
    fromIndex: number,
    toIndex: number,
  ) => void;
  addResource: (sectionId: string, lectureId: string) => void;
  updateResource: (
    sectionId: string,
    lectureId: string,
    resourceId: string,
    data: Partial<Resource>,
  ) => void;
  deleteResource: (
    sectionId: string,
    lectureId: string,
    resourceId: string,
  ) => void;
}) {
  const sectionError = errors[`section-${sectionIndex}-title`];

  return (
    <Collapsible
      open={!section.isCollapsed}
      onOpenChange={() => toggleSectionCollapse(section.id)}
    >
      <div
        className="rounded-xl border bg-card ring-1 ring-foreground/5 transition-all"
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData(
            "application/x-section-index",
            sectionIndex.toString(),
          );
        }}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("application/x-section-index")) {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
          }
        }}
        onDrop={(e) => {
          const fromIndex = parseInt(
            e.dataTransfer.getData("application/x-section-index"),
          );
          if (!isNaN(fromIndex) && fromIndex !== sectionIndex) {
            e.preventDefault();
            reorderSections(fromIndex, sectionIndex);
          }
        }}
      >
        {/* Section Header */}
        <div className="flex items-center gap-2 px-4 py-3">
          <button
            type="button"
            className="cursor-grab text-muted-foreground hover:text-foreground"
            title="Drag to reorder"
          >
            <IconGripVertical className="size-4" />
          </button>
          <Badge variant="outline" className="shrink-0 font-mono text-xs">
            {sectionIndex + 1}
          </Badge>
          <Input
            value={section.title}
            onChange={(e) =>
              updateSection(section.id, { title: e.target.value })
            }
            placeholder={`Section ${sectionIndex + 1}: e.g. Introduction to the Course`}
            className="h-8 flex-1 border-none bg-transparent px-2 text-sm font-medium shadow-none focus-visible:ring-0"
            aria-invalid={!!sectionError}
          />
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="text-[10px]">
              {section.lectures.length} lectures
            </Badge>
            {(() => {
              const sectionDuration = section.lectures.reduce(
                (sum, l) => sum + l.durationSec,
                0,
              );
              return sectionDuration > 0 ? (
                <Badge variant="outline" className="gap-1 text-[10px] font-mono tabular-nums">
                  <IconClock className="size-2.5" />
                  {formatFullDuration(sectionDuration)}
                </Badge>
              ) : null;
            })()}
            {sectionIndex > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => reorderSections(sectionIndex, sectionIndex - 1)}
              >
                <IconChevronUp className="size-3.5" />
              </Button>
            )}
            {sectionIndex < totalSections - 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => reorderSections(sectionIndex, sectionIndex + 1)}
              >
                <IconChevronDown className="size-3.5" />
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 text-destructive hover:bg-destructive/10"
                >
                  <IconTrash className="size-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Section?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove &ldquo;
                    {section.title || `Section ${sectionIndex + 1}`}&rdquo; and
                    all {section.lectures.length} lecture(s) within it.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteSection(section.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
              >
                {section.isCollapsed ? (
                  <IconChevronDown className="size-3.5" />
                ) : (
                  <IconChevronUp className="size-3.5" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>
        {sectionError && (
          <p className="px-4 pb-2 text-xs text-destructive">{sectionError}</p>
        )}
        <CollapsibleContent>
          <Separator />
          <div className="flex flex-col gap-3 p-4">
            {section.lectures.map((lecture, lectureIndex) => (
              <LectureCard
                key={lecture.id}
                lecture={lecture}
                lectureIndex={lectureIndex}
                totalLectures={section.lectures.length}
                sectionId={section.id}
                updateLecture={updateLecture}
                deleteLecture={deleteLecture}
                reorderLectures={reorderLectures}
                addResource={addResource}
                updateResource={updateResource}
                deleteResource={deleteResource}
              />
            ))}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => addLecture(section.id)}
              className="w-full border border-dashed"
            >
              <IconPlaylistAdd data-icon="inline-start" />
              Add Lecture
            </Button>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ─────────────────────────────────────────────────────────────
// Lecture Card
// ─────────────────────────────────────────────────────────────

function LectureCard({
  lecture,
  lectureIndex,
  totalLectures,
  sectionId,
  updateLecture,
  deleteLecture,
  reorderLectures,
  addResource,
  updateResource,
  deleteResource,
}: {
  lecture: Lecture;
  lectureIndex: number;
  totalLectures: number;
  sectionId: string;
  updateLecture: (
    sectionId: string,
    lectureId: string,
    data: Partial<Lecture>,
  ) => void;
  deleteLecture: (sectionId: string, lectureId: string) => void;
  reorderLectures: (
    sectionId: string,
    fromIndex: number,
    toIndex: number,
  ) => void;
  addResource: (sectionId: string, lectureId: string) => void;
  updateResource: (
    sectionId: string,
    lectureId: string,
    resourceId: string,
    data: Partial<Resource>,
  ) => void;
  deleteResource: (
    sectionId: string,
    lectureId: string,
    resourceId: string,
  ) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null,
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [urlMode, setUrlMode] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isFetchingDuration, setIsFetchingDuration] = useState(false);
  const [youtubeToken, setYoutubeToken] = useState("");
  const [isSavingToken, setIsSavingToken] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isUploaded = !!lecture.videoUrl;

  const handleFileSelect = useCallback((file: File) => {
    // Accept any video type
    if (!file.type.startsWith("video/")) {
      setUploadError("Please select a valid video file");
      return;
    }
    if (file.size > 100 * 1024 * 1024 * 1024) {
      setUploadError("File size must be under 100GB");
      return;
    }
    setSelectedFile(file);
    setUploadError("");
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleUploadToYouTube = useCallback(async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(null);
    setUploadError("");

    const getFileDuration = (file: File): Promise<number> => {
      return new Promise((resolve) => {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () => {
          URL.revokeObjectURL(video.src);
          resolve(Math.round(video.duration));
        };
        video.onerror = () => {
          URL.revokeObjectURL(video.src);
          resolve(0);
        };
        video.src = URL.createObjectURL(file);
      });
    };

    try {
      const localDuration = await getFileDuration(selectedFile);
      const result = await uploadVideoToYouTube(
        selectedFile,
        lecture.title || "Untitled Lecture",
        lecture.description || "",
        (progress) => setUploadProgress(progress),
      );

      if (result.success) {
        updateLecture(sectionId, lecture.id, {
          videoUrl: result.videoUrl,
          durationSec: localDuration > 0 ? localDuration : result.durationSec,
        });
        setSelectedFile(null);
      } else {
        setUploadError(result.error || "Upload failed");
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  }, [
    selectedFile,
    lecture.title,
    lecture.description,
    sectionId,
    lecture.id,
    updateLecture,
  ]);

  const handleRemoveVideo = useCallback(() => {
    updateLecture(sectionId, lecture.id, { videoUrl: "", durationSec: 0 });
    setSelectedFile(null);
    setUploadProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [sectionId, lecture.id, updateLecture]);

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setUploadError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handlePasteYouTubeUrl = useCallback(async () => {
    if (!youtubeUrl.trim()) return;

    setIsFetchingDuration(true);
    setUploadError("");

    try {
      const result = await fetchYouTubeVideoDuration(youtubeUrl.trim());

      if (result.success) {
        updateLecture(sectionId, lecture.id, {
          videoUrl: result.videoUrl,
          durationSec: result.durationSec,
        });
        setYoutubeUrl("");
        setUrlMode(false);
      } else {
        setUploadError(result.error || "Failed to fetch video details");
      }
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Failed to fetch video details",
      );
    } finally {
      setIsFetchingDuration(false);
    }
  }, [youtubeUrl, sectionId, lecture.id, updateLecture]);

  const handleSaveToken = useCallback(async () => {
    if (!youtubeToken.trim()) return;
    setIsSavingToken(true);
    try {
      const res = await fetch("/api/admin/settings/youtube-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: youtubeToken.trim() }),
      });
      if (res.ok) {
        toast.success("YouTube token securely saved to database!");
        setUploadError("");
        setYoutubeToken("");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to save token");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setIsSavingToken(false);
    }
  }, [youtubeToken]);

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div
        className="rounded-lg border bg-background transition-all"
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData(
            `application/x-lecture-index-${sectionId}`,
            lectureIndex.toString(),
          );
          // Prevent section drag from triggering when dragging a lecture
          e.stopPropagation();
        }}
        onDragOver={(e) => {
          if (
            e.dataTransfer.types.includes(
              `application/x-lecture-index-${sectionId}`,
            )
          ) {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
          }
        }}
        onDrop={(e) => {
          const fromIndex = parseInt(
            e.dataTransfer.getData(`application/x-lecture-index-${sectionId}`),
          );
          if (!isNaN(fromIndex) && fromIndex !== lectureIndex) {
            e.preventDefault();
            e.stopPropagation();
            reorderLectures(sectionId, fromIndex, lectureIndex);
          }
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2.5">
          <button
            type="button"
            className="cursor-grab text-muted-foreground hover:text-foreground"
          >
            <IconGripVertical className="size-3.5" />
          </button>
          {isUploaded ? (
            <IconBrandYoutube className="size-3.5 shrink-0 text-red-500" />
          ) : (
            <IconVideo className="size-3.5 shrink-0 text-primary" />
          )}
          <Input
            value={lecture.title}
            onChange={(e) =>
              updateLecture(sectionId, lecture.id, { title: e.target.value })
            }
            placeholder={`Lecture ${lectureIndex + 1}: e.g. Setting Up Your Environment`}
            className="h-7 flex-1 border-none bg-transparent px-1.5 text-sm shadow-none focus-visible:ring-0"
          />
          <div className="flex items-center gap-1">
            {lecture.isPreview && (
              <Badge variant="secondary" className="text-[10px]">
                Preview
              </Badge>
            )}
            {isUploaded && (
              <Badge variant="outline" className="gap-1 text-[10px]">
                <IconBrandYoutube className="size-2.5" />
                YouTube
              </Badge>
            )}
            {lecture.resources.length > 0 && (
              <Badge variant="outline" className="text-[10px]">
                {lecture.resources.length} files
              </Badge>
            )}
            {lecture.durationSec > 0 && (
              <Badge variant="outline" className="gap-1 text-[10px] font-mono tabular-nums">
                <IconClock className="size-2.5" />
                {formatFullDuration(lecture.durationSec)}
              </Badge>
            )}
            {lectureIndex > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={() =>
                  reorderLectures(sectionId, lectureIndex, lectureIndex - 1)
                }
              >
                <IconChevronUp className="size-3" />
              </Button>
            )}
            {lectureIndex < totalLectures - 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={() =>
                  reorderLectures(sectionId, lectureIndex, lectureIndex + 1)
                }
              >
                <IconChevronDown className="size-3" />
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-6 text-destructive hover:bg-destructive/10"
              onClick={() => deleteLecture(sectionId, lecture.id)}
            >
              <IconTrash className="size-3" />
            </Button>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6"
              >
                {isExpanded ? (
                  <IconChevronUp className="size-3" />
                ) : (
                  <IconChevronDown className="size-3" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        {/* Expanded Content */}
        <CollapsibleContent>
          <Separator />
          <div className="p-4">
            <FieldGroup className="gap-4">
              {/* ── Upload Video to YouTube ─────────── */}
              <Field>
                <FieldLabel>
                  <IconBrandYoutube className="size-4" />
                  Upload Video to YouTube
                </FieldLabel>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleInputChange}
                />

                {/* State: Uploaded successfully */}
                {isUploaded && !isUploading && (
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20">
                    <div className="flex items-center gap-3 p-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                        <IconBrandYoutube className="size-5 text-red-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">
                            Video uploaded to YouTube
                          </p>
                          {lecture.durationSec > 0 && (
                            <Badge variant="outline" className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-[10px] font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                              <IconClock className="size-2.5" />
                              {formatFullDuration(lecture.durationSec)}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {lecture.videoUrl}
                        </p>
                      </div>
                      <Badge
                        variant="default"
                        className="shrink-0 gap-1 text-[10px]"
                      >
                        <IconCheck className="size-2.5" />
                        Uploaded
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 shrink-0 text-destructive hover:bg-destructive/10"
                        onClick={handleRemoveVideo}
                      >
                        <IconTrash className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* State: File selected */}
                {selectedFile && !isUploading && !isUploaded && (
                  <div className="rounded-lg border">
                    <div className="flex items-center gap-3 p-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <IconVideo className="size-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(selectedFile.size)} •{" "}
                          {selectedFile.type.split("/")[1]?.toUpperCase() ||
                            "VIDEO"}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 shrink-0"
                        onClick={handleRemoveFile}
                      >
                        <IconX className="size-3.5" />
                      </Button>
                    </div>
                    <div className="border-t px-4 py-3">
                      <Button
                        type="button"
                        onClick={handleUploadToYouTube}
                        className="w-full"
                      >
                        <IconCloudUpload data-icon="inline-start" />
                        Upload to YouTube
                      </Button>
                    </div>
                  </div>
                )}

                {/* State: Uploading with speed */}
                {isUploading && (
                  <div className="rounded-lg border">
                    <div className="flex items-center gap-3 p-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                        <IconBrandYoutube className="size-5 animate-pulse text-red-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-sm font-medium">
                            Uploading to YouTube...
                          </p>
                          <span className="text-xs font-semibold text-primary">
                            {uploadProgress?.percent || 0}%
                          </span>
                        </div>
                        <Progress
                          value={uploadProgress?.percent || 0}
                          className="h-2"
                        />
                        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>
                            {uploadProgress
                              ? `${formatFileSize(uploadProgress.loaded)} / ${formatFileSize(uploadProgress.total)}`
                              : "Preparing..."}
                          </span>
                          <div className="flex items-center gap-3">
                            {uploadProgress && uploadProgress.speed > 0 && (
                              <span className="font-medium text-foreground">
                                ⚡ {uploadProgress.speedLabel}
                              </span>
                            )}
                            {uploadProgress && uploadProgress.eta > 0 && (
                              <span>ETA: {formatEta(uploadProgress.eta)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* State: Empty — drag & drop OR URL paste */}
                {!selectedFile && !isUploaded && !isUploading && (
                  <div className="space-y-3">
                    {/* Mode toggle */}
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant={urlMode ? "ghost" : "default"}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setUrlMode(false)}
                      >
                        <IconUpload className="size-3" />
                        Upload File
                      </Button>
                      <Button
                        type="button"
                        variant={urlMode ? "default" : "ghost"}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setUrlMode(true)}
                      >
                        <IconLink className="size-3" />
                        Paste YouTube URL
                      </Button>
                    </div>

                    {urlMode ? (
                      /* URL paste mode */
                      <div className="rounded-lg border bg-muted/20 p-4">
                        <div className="flex items-center gap-2">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                            <IconBrandYoutube className="size-5 text-red-500" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <Input
                              value={youtubeUrl}
                              onChange={(e) => setYoutubeUrl(e.target.value)}
                              placeholder="https://www.youtube.com/watch?v=..."
                              className="h-8 text-sm"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handlePasteYouTubeUrl();
                                }
                              }}
                            />
                          </div>
                          <Button
                            type="button"
                            onClick={handlePasteYouTubeUrl}
                            disabled={
                              !youtubeUrl.trim() || isFetchingDuration
                            }
                            size="sm"
                            className="h-8 shrink-0"
                          >
                            {isFetchingDuration ? (
                              <IconLoader2 className="size-3.5 animate-spin" />
                            ) : (
                              <IconCheck className="size-3.5" />
                            )}
                            {isFetchingDuration
                              ? "Detecting..."
                              : "Add Video"}
                          </Button>
                        </div>
                        <p className="mt-2 text-[11px] text-muted-foreground">
                          Paste any YouTube URL — duration will be
                          auto-detected and stored in the database.
                        </p>
                      </div>
                    ) : (
                      /* File upload mode */
                      <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onClick={() => fileInputRef.current?.click()}
                        className={`flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed px-4 py-8 transition-colors ${
                          isDragOver
                            ? "border-primary bg-primary/5"
                            : "border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/30"
                        }`}
                      >
                        <div className="flex size-14 items-center justify-center rounded-full bg-red-500/10">
                          <IconBrandYoutube className="size-7 text-red-500" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium">
                            {isDragOver
                              ? "Drop video file here"
                              : "Drag & drop video or click to browse"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Any video format • Max 100GB
                          </p>
                          <p className="mt-0.5 text-[10px] text-muted-foreground">
                            Video will be uploaded directly to YouTube •
                            Duration auto-detected
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                        >
                          <IconUpload data-icon="inline-start" />
                          Choose Video File
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {uploadError && (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-destructive">{uploadError}</p>
                    {uploadError.includes("GOOGLE_REFRESH_TOKEN") && (
                      <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 flex flex-col gap-2 mt-1">
                        <p className="text-xs text-destructive font-medium">Please provide your YouTube refresh token to continue uploads.</p>
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="1//04XXX..."
                            value={youtubeToken}
                            onChange={(e) => setYoutubeToken(e.target.value)}
                            className="h-8 text-xs border-destructive/30"
                          />
                          <Button
                            type="button"
                            size="sm"
                            className="h-8 shadow-sm shrink-0"
                            onClick={handleSaveToken}
                            disabled={isSavingToken || !youtubeToken.trim()}
                          >
                            {isSavingToken ? <IconLoader2 className="size-3.5 animate-spin mr-1.5" /> : null}
                            Save to DB
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <FieldDescription>
                  Video will be uploaded to YouTube (unlisted). Duration is
                  auto-detected after upload.
                </FieldDescription>
              </Field>

              {/* Free Preview Switch */}
              <Field
                orientation="horizontal"
                className="rounded-lg border bg-muted/20 p-4"
              >
                <div className="flex flex-col gap-1">
                  <FieldLabel
                    htmlFor={`lecture-preview-${lecture.id}`}
                    className="cursor-pointer gap-1.5 text-sm font-medium"
                  >
                    {lecture.isPreview ? (
                      <IconEye className="size-4 text-primary" />
                    ) : (
                      <IconEyeOff className="size-4 text-muted-foreground" />
                    )}
                    Free Preview
                  </FieldLabel>
                  <FieldDescription className="pl-[22px]">
                    Allow students to watch this lecture before purchasing the
                    course.
                  </FieldDescription>
                </div>
                <div className="ml-auto">
                  <Switch
                    id={`lecture-preview-${lecture.id}`}
                    checked={lecture.isPreview}
                    onCheckedChange={(checked) =>
                      updateLecture(sectionId, lecture.id, {
                        isPreview: !!checked,
                      })
                    }
                  />
                </div>
              </Field>

              {/* Description */}
              <Field>
                <FieldLabel htmlFor={`lecture-desc-${lecture.id}`}>
                  Lecture Description
                </FieldLabel>
                <Textarea
                  id={`lecture-desc-${lecture.id}`}
                  placeholder="Brief description of what students will learn..."
                  value={lecture.description}
                  onChange={(e) =>
                    updateLecture(sectionId, lecture.id, {
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  className="resize-y"
                />
              </Field>

              {/* ── Resources: Images & PDFs ─────────── */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">
                      Downloadable Resources
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      Images & PDFs only • Max 50MB per PDF
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => addResource(sectionId, lecture.id)}
                    className="h-7 text-xs"
                  >
                    <IconPlus data-icon="inline-start" />
                    Add Resource
                  </Button>
                </div>
                {lecture.resources.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {lecture.resources.map((resource) => (
                      <ResourceRow
                        key={resource.id}
                        resource={resource}
                        sectionId={sectionId}
                        lectureId={lecture.id}
                        updateResource={updateResource}
                        deleteResource={deleteResource}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
                    No resources yet. Attach PDFs, slides, or images.
                  </p>
                )}
              </div>
            </FieldGroup>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ─────────────────────────────────────────────────────────────
// Resource Row (Image & PDF upload)
// ─────────────────────────────────────────────────────────────

function ResourceRow({
  resource,
  sectionId,
  lectureId,
  updateResource,
  deleteResource,
}: {
  resource: Resource;
  sectionId: string;
  lectureId: string;
  updateResource: (
    sectionId: string,
    lectureId: string,
    resourceId: string,
    data: Partial<Resource>,
  ) => void;
  deleteResource: (
    sectionId: string,
    lectureId: string,
    resourceId: string,
  ) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState("");

  const isUploaded = !!resource.fileUrl;
  const isPdf =
    resource.fileUrl?.toLowerCase().endsWith(".pdf") ||
    resource.file?.type === "application/pdf";

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate type
      const isImage = file.type.startsWith("image/");
      const isPdfFile = file.type === "application/pdf";

      if (!isImage && !isPdfFile) {
        setError("Only images and PDFs are allowed");
        return;
      }

      if (isPdfFile && file.size > 50 * 1024 * 1024) {
        setError("PDF must be under 50MB");
        return;
      }

      if (isImage && file.size > 10 * 1024 * 1024) {
        setError("Image must be under 10MB");
        return;
      }

      setError("");
      setIsUploading(true);

      try {
        const result = await uploadResourceFile(
          file,
          resource.title || file.name,
          (p) => setProgress(p),
        );

        if (result.success) {
          updateResource(sectionId, lectureId, resource.id, {
            fileUrl: result.fileUrl,
            title: resource.title || file.name.replace(/\.[^.]+$/, ""),
          });
        } else {
          setError(result.error || "Upload failed");
        }
      } catch (err) {
        setError("Upload failed");
      } finally {
        setIsUploading(false);
        setProgress(null);
      }
    },
    [resource.title, resource.id, sectionId, lectureId, updateResource],
  );

  return (
    <div className="rounded-lg border bg-muted/10">
      <div className="flex items-center gap-2 p-3">
        {/* Icon */}
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted/50">
          {isPdf ? (
            <IconFileTypePdf className="size-4 text-red-500" />
          ) : isUploaded ? (
            <IconPhoto className="size-4 text-blue-500" />
          ) : (
            <IconFile className="size-4 text-muted-foreground" />
          )}
        </div>

        {/* Title */}
        <Input
          value={resource.title}
          onChange={(e) =>
            updateResource(sectionId, lectureId, resource.id, {
              title: e.target.value,
            })
          }
          placeholder="Resource title"
          className="h-7 flex-1 border-none bg-transparent text-sm shadow-none focus-visible:ring-0"
        />

        {/* Upload / Status */}
        {isUploaded ? (
          <Badge variant="secondary" className="gap-1 text-[10px]">
            <IconCheck className="size-2.5" />
            Uploaded
          </Badge>
        ) : isUploading ? (
          <div className="flex items-center gap-2">
            <Progress value={progress?.percent || 0} className="h-1.5 w-16" />
            <span className="text-[10px] text-muted-foreground">
              {progress?.percent || 0}%
            </span>
            {progress && progress.speed > 0 && (
              <span className="text-[10px] font-medium">
                {progress.speedLabel}
              </span>
            )}
          </div>
        ) : (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-6 text-[11px]"
              onClick={() => fileInputRef.current?.click()}
            >
              <IconUpload className="size-3" />
              Upload
            </Button>
          </>
        )}

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-6 text-destructive"
          onClick={() => deleteResource(sectionId, lectureId, resource.id)}
        >
          <IconTrash className="size-3" />
        </Button>
      </div>

      {error && (
        <p className="px-3 pb-2 text-[11px] text-destructive">{error}</p>
      )}
    </div>
  );
}
