"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { lectureSchema, type LectureFormValues } from "@/lib/validators/course";
import { updateLecture, type Lecture } from "@/lib/supabase/queries/courses-admin";
import { extractYouTubeId, formatDuration, getYouTubeThumbnail } from "@/lib/utils/video";
import { AutoSaveIndicator } from "./auto-save-indicator";
import { ResourcesTab } from "./resources-tab";
import { uploadVideoToYouTube, fetchYouTubeVideoDuration, type UploadProgress } from "@/features/admin/course/services/course-api";
import { IconBrandYoutube, IconUpload, IconLink, IconCloudUpload, IconCheck, IconLoader2, IconX, IconTrash } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { toast } from "sonner";

interface LectureEditorProps {
  lecture: Lecture;
  chapterTitle: string;
  onUpdate: () => void;
}

export function LectureEditor({ lecture, chapterTitle, onUpdate }: LectureEditorProps) {
  const [saveStatus, setSaveStatus] = React.useState<"idle" | "saving" | "saved" | "error">("idle");
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null);

  const [urlMode, setUrlMode] = React.useState(false);
  const [youtubeUrl, setYoutubeUrl] = React.useState("");
  const [isFetchingDuration, setIsFetchingDuration] = React.useState(false);
  
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = React.useState<UploadProgress | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [uploadError, setUploadError] = React.useState("");
  const [youtubeToken, setYoutubeToken] = React.useState("");
  const [isSavingToken, setIsSavingToken] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<LectureFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(lectureSchema) as any,
    defaultValues: {
      title: lecture.title,
      description: lecture.description || "",
      video_url: lecture.video_url || "",
      video_provider: (lecture.video_provider as LectureFormValues["video_provider"]) || "youtube",
      yt_video_id: lecture.yt_video_id || "",
      duration_sec: lecture.duration_sec || 0,
      is_preview: lecture.is_preview,
      is_published: lecture.is_published,
      transcript_url: lecture.transcript_url || "",
      notes_url: lecture.notes_url || "",
    },
  });

  // Reset when lecture changes
  React.useEffect(() => {
    form.reset({
      title: lecture.title,
      description: lecture.description || "",
      video_url: lecture.video_url || "",
      video_provider: (lecture.video_provider as LectureFormValues["video_provider"]) || "youtube",
      yt_video_id: lecture.yt_video_id || "",
      duration_sec: lecture.duration_sec || 0,
      is_preview: lecture.is_preview,
      is_published: lecture.is_published,
      transcript_url: lecture.transcript_url || "",
      notes_url: lecture.notes_url || "",
    });
  }, [lecture.id, form, lecture]);

  const watchedValues = form.watch();
  const videoUrl = watchedValues.video_url || "";
  const videoProvider = watchedValues.video_provider;
  const durationSec = watchedValues.duration_sec || 0;
  const ytId = videoProvider === "youtube" && videoUrl ? extractYouTubeId(videoUrl) : null;

  // Auto-extract YouTube ID
  React.useEffect(() => {
    if (videoProvider === "youtube" && videoUrl) {
      const id = extractYouTubeId(videoUrl);
      if (id && id !== form.getValues("yt_video_id")) {
        form.setValue("yt_video_id", id, { shouldDirty: true });
      }
    }
  }, [videoUrl, videoProvider, form]);

  // Auto-save
  React.useEffect(() => {
    if (!form.formState.isDirty) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        const vals = form.getValues();
        await updateLecture(lecture.id, {
          title: vals.title,
          description: vals.description || null,
          video_url: vals.video_url || null,
          video_provider: vals.video_provider,
          yt_video_id: vals.yt_video_id || null,
          duration_sec: vals.duration_sec || 0,
          is_preview: vals.is_preview,
          is_published: vals.is_published,
          transcript_url: vals.transcript_url || null,
          notes_url: vals.notes_url || null,
        } as Partial<Lecture>);
        setSaveStatus("saved");
        form.reset(vals);
        onUpdate();
      } catch {
        setSaveStatus("error");
      }
    }, 1500);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    watchedValues.title,
    watchedValues.description,
    watchedValues.video_url,
    watchedValues.video_provider,
    watchedValues.yt_video_id,
    watchedValues.duration_sec,
    watchedValues.is_preview,
    watchedValues.is_published,
    watchedValues.transcript_url,
    watchedValues.notes_url,
  ]);

  const isUploaded = !!watchedValues.video_url;

  const handlePasteYouTubeUrl = async () => {
    if (!youtubeUrl.trim()) return;
    setIsFetchingDuration(true);
    setUploadError("");
    try {
      const result = await fetchYouTubeVideoDuration(youtubeUrl.trim());
      if (result.success) {
        form.setValue("video_url", result.videoUrl, { shouldDirty: true });
        form.setValue("duration_sec", result.durationSec, { shouldDirty: true });
        form.setValue("video_provider", "youtube", { shouldDirty: true });
        if (result.title) form.setValue("title", result.title, { shouldDirty: true });
        if (result.description) form.setValue("description", result.description, { shouldDirty: true });
        setYoutubeUrl("");
        setUrlMode(false);
      } else {
        setUploadError(result.error || "Failed to fetch video details");
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to fetch video details");
    } finally {
      setIsFetchingDuration(false);
    }
  };

  const handleFileSelect = (file: File) => {
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
  };

  const handleUploadToYouTube = async () => {
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
        watchedValues.title || "Untitled Lecture",
        watchedValues.description || "",
        (progress) => setUploadProgress(progress)
      );

      if (result.success) {
        form.setValue("video_url", result.videoUrl, { shouldDirty: true });
        form.setValue("duration_sec", localDuration > 0 ? localDuration : result.durationSec, { shouldDirty: true });
        form.setValue("video_provider", "youtube", { shouldDirty: true });
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
  };

  const [isDeletingVideo, setIsDeletingVideo] = React.useState(false);

  const handleRemoveVideo = async () => {
    setIsDeletingVideo(true);
    try {
      await updateLecture(lecture.id, {
        video_url: null,
        duration_sec: 0,
        yt_video_id: null,
      } as Partial<Lecture>);

      form.setValue("video_url", "", { shouldDirty: true });
      form.setValue("duration_sec", 0, { shouldDirty: true });
      form.setValue("yt_video_id", "", { shouldDirty: true });
      setSelectedFile(null);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      toast.success("Video removed successfully");
      onUpdate();
    } catch (error) {
      toast.error("Failed to remove video");
    } finally {
      setIsDeletingVideo(false);
    }
  };

  const handleSaveToken = async () => {
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
  };

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  function formatEta(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {chapterTitle} → Lecture
          </p>
          <h2 className="text-xl font-semibold">{lecture.title}</h2>
        </div>
        <AutoSaveIndicator status={saveStatus} onRetry={() => form.trigger()} />
      </div>

      <Separator />

      <Tabs defaultValue="video">
        <TabsList>
          <TabsTrigger value="video">Video</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        {/* Video Tab */}
        <TabsContent value="video" className="flex flex-col gap-4 pt-4">
          <div className="flex flex-col gap-4">
            <Label>
              <IconBrandYoutube className="size-4 inline-block mr-2" />
              Upload Video to YouTube
            </Label>

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
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
                      <p className="text-sm font-medium">Video added to lecture</p>
                      {durationSec > 0 && (
                        <Badge variant="outline" className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-[10px] font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                          {formatDuration(durationSec)}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {videoUrl}
                    </p>
                  </div>
                  <Badge variant="default" className="shrink-0 gap-1 text-[10px]">
                    <IconCheck className="size-2.5" />
                    Ready
                  </Badge>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button type="button" variant="outline" size="sm" className="shrink-0 text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive">
                        <IconTrash className="size-3.5 mr-2" />
                        Delete Video
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Video?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove the associated video from this lecture.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeletingVideo}>Cancel</AlertDialogCancel>
                        <Button 
                          onClick={(e) => {
                            e.preventDefault();
                            handleRemoveVideo();
                          }} 
                          disabled={isDeletingVideo}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isDeletingVideo ? <IconLoader2 className="size-4 animate-spin mr-2" /> : null}
                          Remove
                        </Button>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )}

            {/* State: File selected */}
            {selectedFile && !isUploading && !isUploaded && (
              <div className="rounded-lg border">
                <div className="flex items-center gap-3 p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <IconBrandYoutube className="size-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(selectedFile.size)} • {selectedFile.type.split("/")[1]?.toUpperCase() || "VIDEO"}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0"
                    onClick={() => {
                      setSelectedFile(null);
                      setUploadError("");
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    <IconX className="size-3.5" />
                  </Button>
                </div>
                <div className="border-t px-4 py-3">
                  <Button type="button" onClick={handleUploadToYouTube} className="w-full">
                    <IconCloudUpload className="mr-2 size-4" />
                    Upload to YouTube
                  </Button>
                </div>
              </div>
            )}

            {/* State: Uploading */}
            {isUploading && (
              <div className="rounded-lg border">
                <div className="flex items-center gap-3 p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                    <IconBrandYoutube className="size-5 animate-pulse text-red-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-medium">Uploading to YouTube...</p>
                      <span className="text-xs font-semibold text-primary">
                        {uploadProgress?.percent || 0}%
                      </span>
                    </div>
                    <Progress value={uploadProgress?.percent || 0} className="h-2" />
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
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={urlMode ? "ghost" : "default"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setUrlMode(false)}
                  >
                    <IconUpload className="mr-2 size-3" />
                    Upload File
                  </Button>
                  <Button
                    type="button"
                    variant={urlMode ? "default" : "ghost"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setUrlMode(true)}
                  >
                    <IconLink className="mr-2 size-3" />
                    Paste YouTube URL
                  </Button>
                </div>

                {urlMode ? (
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
                        disabled={!youtubeUrl.trim() || isFetchingDuration}
                        size="sm"
                        className="h-8 shrink-0"
                      >
                        {isFetchingDuration ? <IconLoader2 className="mr-2 size-3.5 animate-spin" /> : <IconCheck className="mr-2 size-3.5" />}
                        {isFetchingDuration ? "Detecting..." : "Add Video"}
                      </Button>
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      Paste any YouTube URL — duration, title, and description will be auto-detected.
                    </p>
                  </div>
                ) : (
                  <div
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragOver(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsDragOver(false);
                    }}
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
                        {isDragOver ? "Drop video file here" : "Drag & drop video or click to browse"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">Any video format • Max 100GB</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        Video will be uploaded directly to YouTube • Duration auto-detected
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
                      <IconUpload className="mr-2 size-3" />
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
                        {isSavingToken && <IconLoader2 className="size-3.5 animate-spin mr-1.5" />}
                        Save to DB
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label>Free Preview</Label>
              <p className="text-xs text-muted-foreground">
                Students can watch this without enrolling
              </p>
            </div>
            <Switch
              checked={form.watch("is_preview")}
              onCheckedChange={(val) => form.setValue("is_preview", val, { shouldDirty: true })}
            />
          </div>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="flex flex-col gap-4 pt-4">
          <div className="flex flex-col gap-2">
            <Label>Title</Label>
            <Input {...form.register("title")} />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Description</Label>
            <Textarea {...form.register("description")} rows={4} />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <Label>Published</Label>
            <Switch
              checked={form.watch("is_published")}
              onCheckedChange={(val) => form.setValue("is_published", val, { shouldDirty: true })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Transcript URL</Label>
            <Input {...form.register("transcript_url")} placeholder="https://..." />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Notes URL (PDF)</Label>
            <Input {...form.register("notes_url")} placeholder="https://..." />
          </div>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="pt-4">
          <ResourcesTab lectureId={lecture.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
