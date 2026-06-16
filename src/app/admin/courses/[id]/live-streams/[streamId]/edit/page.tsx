"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Info, Save, X } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { toast } from "sonner";
import { streamControlPath } from "@/lib/live-stream/admin-paths";
import type { StreamStatus } from "@/types/live-stream";
import { getStatusBadgeClass } from "@/lib/live-stream/formatters";
import { cn } from "@/lib/utils";

interface LiveStream {
  id: string;
  title: string;
  description: string | null;
  status: StreamStatus;
  tags?: string[] | null;
  notes?: string | null;
  course_id: string;
  scheduled_at?: string | null;
  recording_url?: string | null;
}

function toLocalDateTimeValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export default function EditStreamPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const streamId = params.streamId as string;

  const [stream, setStream] = useState<LiveStream | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [notes, setNotes] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [recordingUrl, setRecordingUrl] = useState("");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  useEffect(() => {
    const fetchStream = async () => {
      try {
        const { data, error } = await supabase
          .from("live_streams")
          .select(
            "id, title, description, status, tags, notes, course_id, scheduled_at, recording_url",
          )
          .eq("id", streamId)
          .eq("course_id", courseId)
          .single();

        if (error) throw error;
        setStream(data);
        setTitle(data.title);
        setDescription(data.description || "");
        setTags(data.tags || []);
        setNotes(data.notes || "");
        setScheduledAt(toLocalDateTimeValue(data.scheduled_at));
        setRecordingUrl(data.recording_url || "");
      } catch (error) {
        console.error("Failed to fetch stream:", error);
        toast.error("Failed to load stream");
      } finally {
        setLoading(false);
      }
    };

    fetchStream();
  }, [streamId, courseId, supabase]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!stream) return;

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() || null,
        tags,
        notes: notes.trim() || null,
      };

      if (stream.status === "scheduled" && scheduledAt) {
        payload.scheduled_at = new Date(scheduledAt).toISOString();
      }

      if (stream.status === "replay" || stream.status === "ended") {
        payload.recording_url = recordingUrl.trim() || null;
      }

      const { error } = await supabase
        .from("live_streams")
        .update(payload)
        .eq("id", streamId)
        .eq("course_id", courseId);

      if (error) throw error;

      toast.success("Stream updated successfully");
      router.push(streamControlPath(courseId, streamId));
    } catch (error) {
      console.error("Failed to update stream:", error);
      toast.error("Failed to update stream");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center">Loading...</div>;
  }

  if (!stream) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Stream not found</p>
      </div>
    );
  }

  const showScheduleField = stream.status === "scheduled";
  const showRecordingField =
    stream.status === "replay" || stream.status === "ended";
  const isReadOnlySchedule = stream.status !== "scheduled";

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold sm:text-3xl">Edit Stream</h1>
            <Badge
              variant="outline"
              className={cn("capitalize", getStatusBadgeClass(stream.status))}
            >
              {stream.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground sm:text-base">
            {stream.title}
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="gap-2 self-start sm:self-auto"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      {isReadOnlySchedule && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Metadata editing</AlertTitle>
          <AlertDescription>
            This stream is <span className="font-medium">{stream.status}</span>.
            You can update title, description, tags, and notes
            {showRecordingField ? ", plus the replay recording URL" : ""}. Schedule
            and broadcast settings can only be changed while the stream is
            scheduled.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Stream Details</CardTitle>
          <CardDescription>Update the stream information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Stream title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Stream description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-2 h-32"
            />
          </div>

          {showScheduleField && (
            <div>
              <Label htmlFor="scheduledAt">Scheduled Date & Time</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="mt-2"
              />
            </div>
          )}

          {showRecordingField && (
            <div>
              <Label htmlFor="recordingUrl">Recording / Replay URL</Label>
              <Input
                id="recordingUrl"
                type="url"
                placeholder="https://..."
                value={recordingUrl}
                onChange={(e) => setRecordingUrl(e.target.value)}
                className="mt-2"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                YouTube or hosted replay link shown to students after the live
                session ends.
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="tags">Tags</Label>
            <div className="mb-3 mt-2 flex flex-col gap-2 sm:flex-row">
              <Input
                id="tags"
                placeholder="Add a tag and press Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button onClick={handleAddTag} variant="outline" className="sm:px-3">
                Add
              </Button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:opacity-70"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="notes">Internal Notes</Label>
            <Textarea
              id="notes"
              placeholder="Private notes about this stream (not visible to students)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-2 h-32"
            />
          </div>

          <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(streamControlPath(courseId, streamId))}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
