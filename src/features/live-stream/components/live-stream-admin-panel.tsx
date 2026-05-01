"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";
import {
  IconBroadcast,
  IconClock,
  IconCopy,
  IconMessageCircle,
  IconPlayerPauseFilled,
  IconPlayerPlayFilled,
  IconPlus,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  extractYoutubeVideoId,
  formatLiveDateTime,
} from "@/features/live-stream/lib";
import type {
  LiveStreamAdminItem,
  LiveStreamCourseOption,
} from "@/features/live-stream/types";

type ApiCourse = {
  id: string;
  name: string;
  slug?: string | null;
};

async function fetchCourses(): Promise<LiveStreamCourseOption[]> {
  const response = await fetch("/api/admin/courses", {
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(payload?.error || `Request failed (${response.status})`);
  }

  const data = (await response.json()) as { courses?: ApiCourse[] };
  return (data.courses ?? []).map((course) => ({
    id: course.id,
    name: course.name,
    slug: course.slug ?? null,
  }));
}

async function fetchLiveStreams(): Promise<LiveStreamAdminItem[]> {
  const response = await fetch("/api/admin/live-streams", {
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(payload?.error || `Request failed (${response.status})`);
  }

  const data = (await response.json()) as {
    liveStreams?: LiveStreamAdminItem[];
  };
  return data.liveStreams ?? [];
}

async function manageLiveStream(payload: Record<string, unknown>) {
  const response = await fetch("/api/admin/live-streams/manage", {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(data?.error || `Request failed (${response.status})`);
  }

  return response.json();
}

export function LiveStreamAdminPanel() {
  const queryClient = useQueryClient();
  const [title, setTitle] = React.useState("");
  const [courseId, setCourseId] = React.useState("");
  const [videoSource, setVideoSource] = React.useState("");

  const streamsQuery = useQuery({
    queryKey: ["admin-live-streams-list"],
    queryFn: fetchLiveStreams,
  });

  const coursesQuery = useQuery({
    queryKey: ["admin-live-stream-courses"],
    queryFn: fetchCourses,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      manageLiveStream({
        action: "create",
        title: title.trim(),
        courseId,
        videoSource: videoSource.trim(),
      }),
    onSuccess: () => {
      toast.success("Live stream created");
      setTitle("");
      setCourseId("");
      setVideoSource("");
      queryClient.invalidateQueries({ queryKey: ["admin-live-streams-list"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const statusMutation = useMutation({
    mutationFn: (payload: {
      streamId: string;
      action: "start" | "end";
      ytVideoId?: string | null;
    }) =>
      manageLiveStream({
        action: payload.action,
        streamId: payload.streamId,
        ytVideoId: payload.ytVideoId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-live-streams-list"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const liveStreams = Array.isArray(streamsQuery.data) ? streamsQuery.data : [];
  const courses = Array.isArray(coursesQuery.data) ? coursesQuery.data : [];

  const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const extractedVideoId = extractYoutubeVideoId(videoSource);

    if (!title.trim() || !courseId) {
      toast.error("Title and course are required");
      return;
    }

    if (videoSource.trim() && !extractedVideoId) {
      toast.error("Enter a valid YouTube video ID or URL");
      return;
    }

    createMutation.mutate();
  };

  const handleCopyLink = async (stream: LiveStreamAdminItem) => {
    const courseSegment = stream.courseSlug || stream.courseId;
    const url = `${window.location.origin}/dashboard/courses/${courseSegment}/learn/live`;
    await navigator.clipboard.writeText(url);
    toast.success("Student link copied");
  };

  const handleStart = (stream: LiveStreamAdminItem) => {
    statusMutation.mutate({
      streamId: stream.id,
      action: "start",
      ytVideoId: stream.ytVideoId ?? extractYoutubeVideoId(videoSource),
    });
  };

  const handleEnd = (stream: LiveStreamAdminItem) => {
    statusMutation.mutate({
      streamId: stream.id,
      action: "end",
    });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="space-y-2 border-b border-border/60 bg-muted/20">
          <CardTitle>Create live stream</CardTitle>
          <CardDescription>
            Create the stream record, attach a YouTube live URL or video ID, and
            start it when you are ready.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <form className="flex flex-col gap-5" onSubmit={handleCreate}>
            <FieldGroup>
              <Field>
                <FieldContent>
                  <FieldLabel htmlFor="live-stream-title">Title</FieldLabel>
                  <Input
                    id="live-stream-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Weekly doubt clearing"
                    maxLength={120}
                    autoComplete="off"
                  />
                  <FieldDescription>
                    Visible to students on the live class page.
                  </FieldDescription>
                </FieldContent>
              </Field>

              <Field>
                <FieldContent>
                  <FieldLabel htmlFor="live-stream-course">Course</FieldLabel>
                  <Select value={courseId} onValueChange={setCourseId}>
                    <SelectTrigger id="live-stream-course" className="w-full">
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    Students enrolled in this course can open the live page.
                  </FieldDescription>
                </FieldContent>
              </Field>

              <Field>
                <FieldContent>
                  <FieldLabel htmlFor="live-stream-video">
                    YouTube video URL or ID
                  </FieldLabel>
                  <Input
                    id="live-stream-video"
                    value={videoSource}
                    onChange={(event) => setVideoSource(event.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    autoComplete="off"
                  />
                  <FieldDescription>
                    Paste a YouTube Live URL, watch URL, embed URL, or a raw
                    video ID.
                  </FieldDescription>
                </FieldContent>
              </Field>
            </FieldGroup>

            <Button
              type="submit"
              disabled={createMutation.isPending || courses.length === 0}
            >
              <IconPlus data-icon="inline-start" />
              Create stream
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="flex min-h-155 flex-col border-border/70 shadow-sm">
        <CardHeader className="space-y-2 border-b border-border/60 bg-muted/20">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Live stream sessions</CardTitle>
              <CardDescription>
                Start a stream to go live, end it when the class is finished.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="rounded-full px-2.5 py-0.5">
              {liveStreams.length} total
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 p-0">
          {liveStreams.length === 0 ? (
            <Empty className="m-4 min-h-105 border-border/60 bg-muted/10">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <IconBroadcast />
                </EmptyMedia>
                <EmptyTitle>No live streams yet</EmptyTitle>
                <EmptyDescription>
                  Create the first course live class here. Students will see the
                  stream once it is started.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Badge variant="outline" className="rounded-full px-2.5 py-0.5">
                  No scheduling required
                </Badge>
              </EmptyContent>
            </Empty>
          ) : (
            <ScrollArea className="h-155 w-full">
              <div className="flex flex-col gap-4 p-4">
                {liveStreams.map((stream, index) => {
                  const isLive = stream.status === "live";
                  const timeLabel = isLive
                    ? stream.startedAt
                    : stream.endedAt || stream.startedAt;
                  const courseSegment = stream.courseSlug || stream.courseId;

                  return (
                    <div
                      key={stream.id}
                      className="rounded-2xl border border-border/70 bg-background p-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant={isLive ? "destructive" : "outline"}
                              className="rounded-full px-2.5 py-0.5 uppercase tracking-[0.18em]"
                            >
                              {isLive ? "Live" : "Ended"}
                            </Badge>
                            <Badge
                              variant="secondary"
                              className="rounded-full px-2.5 py-0.5"
                            >
                              {stream.courseName}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <h3 className="truncate text-base font-semibold">
                              {stream.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {stream.ytVideoId
                                ? `Video ID: ${stream.ytVideoId}`
                                : "No YouTube video attached yet."}
                            </p>
                            <p className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                              <IconClock data-icon="inline-start" />
                              {timeLabel
                                ? formatLiveDateTime(timeLabel)
                                : "Not started yet"}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 md:justify-end">
                          <Button variant="outline" size="sm" asChild>
                            <Link
                              href={`/admin/live-streams/${stream.id}/chat`}
                            >
                              <IconMessageCircle data-icon="inline-start" />
                              Open Chat
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyLink(stream)}
                          >
                            <IconCopy data-icon="inline-start" />
                            Copy student link
                          </Button>
                          {isLive ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleEnd(stream)}
                              disabled={statusMutation.isPending}
                            >
                              <IconPlayerPauseFilled data-icon="inline-start" />
                              End stream
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleStart(stream)}
                              disabled={statusMutation.isPending}
                            >
                              <IconPlayerPlayFilled data-icon="inline-start" />
                              Start stream
                            </Button>
                          )}
                        </div>
                      </div>

                      {index < liveStreams.length - 1 ? (
                        <Separator className="mt-4" />
                      ) : null}

                      <div className="mt-4 grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
                        <div>
                          <div className="font-medium text-foreground">
                            Course link
                          </div>
                          <div className="truncate">
                            /dashboard/courses/{courseSegment}/learn/live
                          </div>
                        </div>
                        <div>
                          <div className="font-medium text-foreground">
                            Started
                          </div>
                          <div>{formatLiveDateTime(stream.startedAt)}</div>
                        </div>
                        <div>
                          <div className="font-medium text-foreground">
                            Ended
                          </div>
                          <div>{formatLiveDateTime(stream.endedAt)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
