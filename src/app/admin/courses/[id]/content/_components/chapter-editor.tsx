"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  IconBrandYoutube,
  IconRefresh,
  IconAlertCircle,
  IconCheck,
  IconExternalLink,
} from "@tabler/icons-react";
import { chapterSchema, type ChapterFormValues } from "@/lib/validators/course";
import { updateChapter, deleteChapter, type Chapter } from "@/lib/supabase/queries/courses-admin";
import { extractPlaylistId } from "@/lib/youtube/parse-playlist-id";
import { AutoSaveIndicator } from "./auto-save-indicator";

interface ChapterEditorProps {
  chapter: Chapter;
  onUpdate: () => void;
  onDelete: () => void;
}

function formatSyncTime(iso: string | null): string {
  if (!iso) return "Never synced";
  return new Date(iso).toLocaleString();
}

export function ChapterEditor({ chapter, onUpdate, onDelete }: ChapterEditorProps) {
  const [saveStatus, setSaveStatus] = React.useState<"idle" | "saving" | "saved" | "error">("idle");
  const [deleting, setDeleting] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null);

  const form = useForm<ChapterFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(chapterSchema) as any,
    defaultValues: {
      title: chapter.title,
      description: chapter.description || "",
      is_published: chapter.is_published,
      youtube_playlist_id: chapter.youtube_playlist_id || "",
      yt_sync_enabled: chapter.yt_sync_enabled ?? true,
      yt_sync_title_desc: chapter.yt_sync_title_desc ?? true,
    },
  });

  React.useEffect(() => {
    form.reset({
      title: chapter.title,
      description: chapter.description || "",
      is_published: chapter.is_published,
      youtube_playlist_id: chapter.youtube_playlist_id || "",
      yt_sync_enabled: chapter.yt_sync_enabled ?? true,
      yt_sync_title_desc: chapter.yt_sync_title_desc ?? true,
    });
  }, [
    chapter.id,
    chapter.title,
    chapter.description,
    chapter.is_published,
    chapter.youtube_playlist_id,
    chapter.yt_sync_enabled,
    chapter.yt_sync_title_desc,
    form,
  ]);

  const watchedValues = form.watch();
  React.useEffect(() => {
    if (!form.formState.isDirty) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        const vals = form.getValues();
        const playlistRaw = vals.youtube_playlist_id?.trim() || "";
        const playlistId = playlistRaw ? extractPlaylistId(playlistRaw) : null;

        await updateChapter(chapter.id, {
          title: vals.title,
          description: vals.description || null,
          is_published: vals.is_published,
          youtube_playlist_id: playlistId,
          yt_sync_enabled: vals.yt_sync_enabled,
          yt_sync_title_desc: vals.yt_sync_title_desc,
        } as Partial<Chapter>);
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
    watchedValues.is_published,
    watchedValues.youtube_playlist_id,
    watchedValues.yt_sync_enabled,
    watchedValues.yt_sync_title_desc,
  ]);

  const handleSyncNow = async () => {
    const playlistId = chapter.youtube_playlist_id;
    if (!playlistId) {
      toast.error("Link a YouTube playlist first");
      return;
    }

    setSyncing(true);
    try {
      const res = await fetch(`/api/admin/chapters/${chapter.id}/sync-youtube`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Sync failed");
      }

      const { result } = data;
      toast.success(
        `Synced ${result.videosFound} videos — ${result.lecturesCreated} new, ${result.lecturesUpdated} updated`
      );
      onUpdate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteChapter(chapter.id);
      toast.success("Section deleted");
      onDelete();
    } catch {
      toast.error("Failed to delete section");
    } finally {
      setDeleting(false);
    }
  };

  const playlistId = chapter.youtube_playlist_id;
  const lectureCount = chapter.lectures?.length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground sm:text-sm">
            Section
          </p>
          <h2 className="truncate text-lg font-semibold sm:text-xl">{chapter.title}</h2>
        </div>
        <AutoSaveIndicator status={saveStatus} onRetry={() => form.trigger()} />
      </div>

      <Separator />

      {/* YouTube Playlist Sync */}
      <div className="rounded-lg border bg-muted/20 p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <IconBrandYoutube className="size-5 text-red-500" />
          <h3 className="font-semibold">YouTube Playlist Sync</h3>
          {playlistId && chapter.yt_sync_enabled && (
            <Badge variant="outline" className="gap-1 text-[10px]">
              <IconCheck className="size-2.5" />
              Auto-sync on
            </Badge>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Link a YouTube playlist — new videos are imported automatically as lectures.
          No manual URL pasting needed.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label>YouTube Playlist ID or URL</Label>
            <Input
              {...form.register("youtube_playlist_id")}
              placeholder="PLxxxxxxxx or https://youtube.com/playlist?list=PLxxx"
            />
            {playlistId && (
              <a
                href={`https://www.youtube.com/playlist?list=${playlistId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Open playlist on YouTube
                <IconExternalLink className="size-3" />
              </a>
            )}
          </div>

          <div className="flex flex-col gap-3 rounded-md border bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Label>Enable auto-sync</Label>
              <p className="text-xs text-muted-foreground">
                Cron syncs every 15 minutes when enabled
              </p>
            </div>
            <Switch
              checked={form.watch("yt_sync_enabled")}
              onCheckedChange={(val) =>
                form.setValue("yt_sync_enabled", val, { shouldDirty: true })
              }
            />
          </div>

          <div className="flex flex-col gap-3 rounded-md border bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Label>Auto-sync title & description</Label>
              <p className="text-xs text-muted-foreground">
                Sync section title & description from YouTube playlist details
              </p>
            </div>
            <Switch
              checked={form.watch("yt_sync_title_desc")}
              onCheckedChange={(val) =>
                form.setValue("yt_sync_title_desc", val, { shouldDirty: true })
              }
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={handleSyncNow}
              disabled={syncing || !playlistId}
            >
              {syncing ? (
                <Spinner className="mr-2" />
              ) : (
                <IconRefresh className="mr-2 size-4" />
              )}
              Sync Now
            </Button>
            <div className="text-xs text-muted-foreground">
              <span>Last sync: {formatSyncTime(chapter.yt_last_synced_at)}</span>
              {lectureCount > 0 && (
                <span className="ml-2">· {lectureCount} lecture{lectureCount !== 1 ? "s" : ""}</span>
              )}
            </div>
          </div>

          {chapter.yt_sync_error && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <IconAlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{chapter.yt_sync_error}</span>
            </div>
          )}
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label>Section Title</Label>
          <Input {...form.register("title")} />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Description</Label>
          <Textarea
            {...form.register("description")}
            rows={3}
            placeholder="Optional section description"
          />
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
      </div>

      <Separator />

      <Button
        variant="ghost"
        size="sm"
        onClick={handleDelete}
        disabled={deleting}
        className="self-start text-destructive hover:text-destructive"
      >
        {deleting && <Spinner className="mr-2" />}
        Delete Section
      </Button>
    </div>
  );
}
