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
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { lectureSchema, type LectureFormValues } from "@/lib/validators/course";
import { updateLecture, type Lecture } from "@/lib/supabase/queries/courses-admin";
import { formatDuration } from "@/lib/utils/video";
import { YtcnPlayer } from "@/components/ytcn/components/ytcn/ytcn-player";
import { AutoSaveIndicator } from "./auto-save-indicator";
import { ResourcesTab } from "./resources-tab";
import {
  IconBrandYoutube,
  IconExternalLink,
  IconInfoCircle,
} from "@tabler/icons-react";

interface LectureEditorProps {
  lecture: Lecture;
  chapterTitle: string;
  onUpdate: () => void;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function LectureEditor({ lecture, chapterTitle, onUpdate }: LectureEditorProps) {
  const [saveStatus, setSaveStatus] = React.useState<"idle" | "saving" | "saved" | "error">("idle");
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null);

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
  const ytId = lecture.yt_video_id;
  const isSynced = !!lecture.yt_synced_at;

  // Auto-save LMS-editable fields only (video metadata comes from YouTube sync)
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
    watchedValues.is_preview,
    watchedValues.is_published,
    watchedValues.transcript_url,
    watchedValues.notes_url,
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground sm:text-sm">
            {chapterTitle} → Lecture
          </p>
          <h2 className="truncate text-lg font-semibold sm:text-xl">{lecture.title}</h2>
        </div>
        <AutoSaveIndicator status={saveStatus} onRetry={() => form.trigger()} />
      </div>

      <Separator />

      <Tabs defaultValue="video">
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 sm:w-auto sm:flex-nowrap">
          <TabsTrigger value="video" className="flex-1 sm:flex-none">Video</TabsTrigger>
          <TabsTrigger value="details" className="flex-1 sm:flex-none">Details</TabsTrigger>
          <TabsTrigger value="resources" className="flex-1 sm:flex-none">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="video" className="flex flex-col gap-4 pt-4">
          {ytId ? (
            <div className="flex flex-col gap-3">
              <YtcnPlayer
                key={lecture.id}
                videoId={ytId}
                className="rounded-lg border border-border"
              />
              <div className="flex flex-wrap items-center gap-2 rounded-lg border p-3 sm:p-4">
                {isSynced && (
                  <Badge variant="secondary" className="gap-1 text-[10px]">
                    <IconBrandYoutube className="size-2.5" />
                    Synced from YouTube
                  </Badge>
                )}
                {lecture.duration_sec > 0 && (
                  <Badge variant="outline" className="font-mono text-[10px] tabular-nums">
                    {formatDuration(lecture.duration_sec)}
                  </Badge>
                )}
                {lecture.published_at && (
                  <Badge variant="outline" className="text-[10px]">
                    Published {formatDate(lecture.published_at)}
                  </Badge>
                )}
                <Badge variant="outline" className="text-[10px]">
                  Position {lecture.position + 1}
                </Badge>
                <a
                  href={lecture.video_url || `https://www.youtube.com/watch?v=${ytId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:ml-auto sm:w-auto"
                >
                  <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto">
                    <IconExternalLink className="mr-2 size-3.5" />
                    View on YouTube
                  </Button>
                </a>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <IconBrandYoutube className="mx-auto size-10 text-muted-foreground" />
              <p className="mt-2 font-medium">No video synced yet</p>
              <p className="text-sm text-muted-foreground">
                Sync the section&apos;s YouTube playlist to import this lecture.
              </p>
            </div>
          )}

          {isSynced && (
            <div className="flex items-start gap-2 rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
              <IconInfoCircle className="mt-0.5 size-4 shrink-0" />
              <span>
                Title, description, and thumbnail are synced from YouTube on each playlist sync.
                You can edit LMS settings below.
              </span>
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label>Free Preview</Label>
              <p className="text-xs text-muted-foreground">
                Students can watch without enrolling
              </p>
            </div>
            <Switch
              checked={form.watch("is_preview")}
              onCheckedChange={(val) =>
                form.setValue("is_preview", val, { shouldDirty: true })
              }
            />
          </div>
        </TabsContent>

        <TabsContent value="details" className="flex flex-col gap-4 pt-4">
          <div className="flex flex-col gap-2">
            <Label>Title</Label>
            <Input {...form.register("title")} />
            {isSynced && (
              <p className="text-[11px] text-muted-foreground">
                Overwritten on next YouTube sync
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Description</Label>
            <Textarea {...form.register("description")} rows={4} />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <Label>Published</Label>
            <Switch
              checked={form.watch("is_published")}
              onCheckedChange={(val) =>
                form.setValue("is_published", val, { shouldDirty: true })
              }
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

        <TabsContent value="resources" className="pt-4">
          <ResourcesTab lectureId={lecture.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
