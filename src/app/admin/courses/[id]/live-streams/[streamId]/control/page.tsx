"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { StreamSetupPanel } from "@/components/live-streams/control/StreamSetupPanel";
import { StreamPreviewPanel } from "@/components/live-streams/control/StreamPreviewPanel";
import { ControlRoomChat } from "@/components/live-streams/control/ControlRoomChat";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  BarChart3,
  Edit,
  ExternalLink,
  MessageCircle,
  Settings2,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { useObsEncoder } from "@/hooks/useObsEncoder";
import { runEndStreamSequence, runGoLiveSequence } from "@/lib/live-stream/go-live-orchestrator";
import { getStatusBadgeClass } from "@/lib/live-stream/formatters";
import {
  courseLiveStreamsPath,
  streamAnalyticsPath,
  streamEditPath,
} from "@/lib/live-stream/admin-paths";
import { buildYoutubeStudioEditUrl } from "@/features/live-stream/lib";
import type { LiveStreamRow, PipelineStepStatus } from "@/types/live-stream";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<LiveStreamRow["status"], string> = {
  scheduled: "Scheduled",
  live: "Live",
  ended: "Ended",
  replay: "Replay",
  cancelled: "Cancelled",
};

export default function StreamControlRoomPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const streamId = params.streamId as string;
  const supabase = createClient();

  const [stream, setStream] = useState<LiveStreamRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [goLiveStep, setGoLiveStep] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(false);

  const obs = useObsEncoder({
    rtmpUrl: stream?.yt_rtmp_url,
    streamKey: stream?.yt_stream_key,
    autoConnect: true,
  });

  const fetchStream = useCallback(async () => {
    const { data, error } = await supabase
      .from("live_streams")
      .select("*")
      .eq("id", streamId)
      .eq("course_id", courseId)
      .single();

    if (error) {
      toast.error("Failed to load stream");
      return;
    }
    setStream(data as LiveStreamRow);
    setLoading(false);
  }, [streamId, courseId, supabase]);

  useEffect(() => {
    fetchStream();

    const channel = supabase
      .channel(`control-${streamId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "live_streams",
          filter: `id=eq.${streamId}`,
        },
        (payload) => setStream(payload.new as LiveStreamRow),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId, supabase, fetchStream]);

  useEffect(() => {
    if (stream?.status !== "live") return;
    const interval = setInterval(async () => {
      await fetch(`/api/admin/live-streams/${streamId}/sync-chat`, {
        method: "POST",
      }).catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [stream?.status, streamId]);

  const pipelineSteps = useMemo(() => {
    if (!stream) return [];
    const step = (done: boolean, inProgress = false): PipelineStepStatus =>
      done ? "done" : inProgress ? "in_progress" : "pending";

    const hasBroadcast = Boolean(stream.yt_broadcast_id);
    const hasRtmp = Boolean(stream.yt_rtmp_url && stream.yt_stream_key);
    const obsConnected = obs.status === "connected";
    const obsConnecting =
      obs.status === "connecting" ||
      (actionLoading && goLiveStep === "Connecting to OBS…");
    const encoderStarting =
      actionLoading &&
      Boolean(
        goLiveStep &&
          /preparing obs encoder|configuring obs stream|starting obs encoder/i.test(
            goLiveStep,
          ),
      );
    const encoderDone =
      obs.isStreaming || stream.status === "live" || stream.status === "ended";

    const studioEditUrl = buildYoutubeStudioEditUrl(stream.yt_video_id);

    return [
      {
        id: 1,
        label: "YouTube broadcast",
        status: step(hasBroadcast),
        extra: hasBroadcast && studioEditUrl ? (
          <span className="inline-flex items-center gap-1 text-xs">
            (
            <a
              href={studioEditUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center gap-0.5"
            >
              YouTube Studio <ExternalLink className="size-3" strokeWidth={2.5} />
            </a>
            )
          </span>
        ) : undefined,
      },
      { id: 2, label: "Stream credentials", status: step(hasRtmp) },
      { id: 3, label: "OBS connected", status: step(obsConnected, obsConnecting) },
      { id: 4, label: "Encoder streaming", status: step(encoderDone, encoderStarting) },
      { id: 5, label: "Published live", status: step(stream.status === "live") },
    ];
  }, [stream, obs.status, obs.isStreaming, actionLoading, goLiveStep]);

  const handleGoLive = async () => {
    setActionLoading(true);
    setGoLiveStep("Starting…");
    try {
      await runGoLiveSequence(
        streamId,
        {
          ensureConnected: obs.ensureConnected,
          pushRtmp: obs.pushRtmp,
          startStreaming: obs.startStreaming,
          stopStreaming: obs.stopStreaming,
        },
        { onStep: setGoLiveStep },
      );
      await fetchStream();
      toast.success("You are live!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Go live failed");
    } finally {
      setActionLoading(false);
      setGoLiveStep(null);
    }
  };

  const handleEndStream = async () => {
    if (!confirm("End this stream?")) return;
    setActionLoading(true);
    setGoLiveStep("Ending stream…");
    try {
      await runEndStreamSequence(streamId, { stopStreaming: obs.stopStreaming }, {
        onStep: setGoLiveStep,
      });
      await fetchStream();
      toast.success("Stream ended");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to end stream");
    } finally {
      setActionLoading(false);
      setGoLiveStep(null);
    }
  };

  const handleReconnectObs = async () => {
    setReconnecting(true);
    try {
      await obs.ensureConnected();
      toast.success("OBS reconnected");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reconnect failed");
    } finally {
      setReconnecting(false);
    }
  };

  const handleSaveObsPassword = async (password: string) => {
    await obs.saveSettings({
      ...obs.settings,
      obs_password: password,
    });
    await obs.ensureConnected();
    toast.success("OBS password saved");
  };

  const handleSaveReplay = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/live-streams/${streamId}/replay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Failed to save replay");
      toast.success("Saved as replay");
      fetchStream();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 sm:p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="aspect-video w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6 text-muted-foreground">
        Stream not found
      </div>
    );
  }

  const setupPanel = (
    <StreamSetupPanel
      stream={stream}
      steps={pipelineSteps}
      obsStatus={obs.status}
      isStreaming={obs.isStreaming}
      obsError={obs.error}
      rtmpConfigured={obs.rtmpConfigured}
      obsSettings={obs.settings}
      onReconnectObs={handleReconnectObs}
      onSaveObsPassword={handleSaveObsPassword}
      reconnecting={reconnecting}
      onBroadcastCreated={fetchStream}
      actionLoading={actionLoading}
      goLiveStep={goLiveStep}
      onGoLive={handleGoLive}
      onEndStream={handleEndStream}
      onSaveReplay={handleSaveReplay}
    />
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 pb-8 sm:gap-6 sm:p-6">
      <header className="flex flex-col gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 w-fit gap-1.5 text-muted-foreground"
          asChild
        >
          <Link href={courseLiveStreamsPath(courseId)}>
            <ArrowLeft className="size-4" />
            Live Streams
          </Link>
        </Button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
              {stream.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge
                variant="outline"
                className={cn("capitalize", getStatusBadgeClass(stream.status))}
              >
                {stream.status === "live" && (
                  <span className="mr-1.5 size-1.5 animate-pulse rounded-full bg-destructive" />
                )}
                {STATUS_LABEL[stream.status]}
              </Badge>
              <span>
                {stream.concurrent_viewers} viewer{stream.concurrent_viewers === 1 ? "" : "s"}
              </span>
              {stream.peak_viewers > 0 && (
                <>
                  <span className="text-border">·</span>
                  <span>peak {stream.peak_viewers}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex shrink-0 gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={streamAnalyticsPath(courseId, streamId)}>
                <BarChart3 className="mr-1.5 size-4" />
                Analytics
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(streamEditPath(courseId, streamId))}
            >
              <Edit className="mr-1.5 size-4" />
              Edit
            </Button>
          </div>
        </div>
      </header>

      <div className="lg:hidden">
        <Tabs defaultValue="preview" className="flex flex-col gap-4">
          <TabsList className="grid h-10 w-full grid-cols-3">
            <TabsTrigger value="preview" className="gap-1.5 text-xs">
              <Video className="size-3.5" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="setup" className="gap-1.5 text-xs">
              <Settings2 className="size-3.5" />
              Setup
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-1.5 text-xs">
              <MessageCircle className="size-3.5" />
              Chat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="mt-0">
            <StreamPreviewPanel stream={stream} compact />
          </TabsContent>
          <TabsContent value="setup" className="mt-0">
            {setupPanel}
          </TabsContent>
          <TabsContent value="chat" className="mt-0 flex h-[calc(100dvh-11rem)] flex-col">
            <ControlRoomChat
              streamId={streamId}
              chatModeration={stream.chat_moderation}
              activeViewers={stream.concurrent_viewers}
            />
          </TabsContent>
        </Tabs>
      </div>

      <div className="hidden flex-col gap-6 lg:flex">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
          <StreamPreviewPanel stream={stream} />
          <div className="xl:sticky xl:top-6 xl:self-start">{setupPanel}</div>
        </div>

        <div className="h-[calc(100dvh-18rem)] min-h-[480px]">
          <ControlRoomChat
            streamId={streamId}
            chatModeration={stream.chat_moderation}
            activeViewers={stream.concurrent_viewers}
          />
        </div>
      </div>
    </div>
  );
}
