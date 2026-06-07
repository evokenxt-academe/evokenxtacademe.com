"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Copy,
  ExternalLink,
  AlertCircle,
  Play,
  Square,
  Edit,
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { StreamStatusHeader } from "@/components/live-streams/StreamStatusHeader";
import { YouTubeEmbed } from "@/components/live-streams/YouTubeEmbed";
import { StreamStatsCard } from "@/components/live-streams/StreamStatsCard";
import { ChatPanel } from "@/components/live-streams/chat/ChatPanel";
import { ActiveViewers } from "@/components/live-streams/chat/ActiveViewers";
import { PollsPanel } from "@/components/live-streams/polls/PollsPanel";

interface LiveStream {
  id: string;
  title: string;
  description: string;
  status: "scheduled" | "live" | "ended" | "cancelled";
  scheduled_at: string;
  started_at?: string;
  ended_at?: string;
  course_id: string;
  instructor_id: string;
  yt_video_id?: string;
  yt_broadcast_id?: string;
  yt_stream_id?: string;
  yt_rtmp_url?: string;
  yt_stream_key?: string;
  concurrent_viewers?: number;
  peak_viewers?: number;
  duration_sec?: number;
  total_chat_msgs?: number;
}

export default function StreamControlPage() {
  const params = useParams();
  const router = useRouter();
  const streamId = params.streamId as string;

  const [stream, setStream] = useState<LiveStream | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStreamKey, setShowStreamKey] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  // Fetch stream
  useEffect(() => {
    const fetchStream = async () => {
      try {
        const { data, error } = await supabase
          .from("live_streams")
          .select("*")
          .eq("id", streamId)
          .single();

        if (error) throw error;
        setStream(data);
      } catch (error) {
        console.error("Failed to fetch stream:", error);
        toast.error("Failed to load stream");
      } finally {
        setLoading(false);
      }
    };

    fetchStream();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`live-stream-${streamId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "live_streams",
          filter: `id=eq.${streamId}`,
        },
        (payload) => {
          setStream(payload.new as LiveStream);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId, supabase]);

  const handleGoLive = async () => {
    if (!confirm("Are you sure? Your encoder must already be streaming."))
      return;

    setActionLoading(true);
    try {
      const response = await fetch("/api/youtube/broadcasts/go-live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ streamId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to go live");
      }
      toast.success("Stream is now live!");
    } catch (error: any) {
      console.error("Failed to go live:", error);
      toast.error(error.message || "Failed to go live");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndStream = async () => {
    if (!confirm("Are you sure you want to end this stream?")) return;

    setActionLoading(true);
    try {
      const response = await fetch("/api/youtube/broadcasts/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ streamId }),
      });

      if (!response.ok) throw new Error("Failed to end stream");
      toast.success("Stream ended");
    } catch (error) {
      console.error("Failed to end stream:", error);
      toast.error("Failed to end stream");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyStreamKey = () => {
    if (stream?.yt_stream_key) {
      navigator.clipboard.writeText(stream.yt_stream_key);
      toast.success("Stream key copied!");
    }
  };

  const handleCopyRTMPUrl = () => {
    if (stream?.yt_rtmp_url) {
      navigator.clipboard.writeText(stream.yt_rtmp_url);
      toast.success("RTMP URL copied!");
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading stream...</div>;
  }

  if (!stream) {
    return <div className="text-center py-12">Stream not found</div>;
  }

  return (
    <div className="space-y-8 md:p-10 p-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{stream.title}</h1>
          <p className="text-muted-foreground">{stream.description}</p>
        </div>
        <div className="flex gap-2">
          {stream.status === "scheduled" && (
            <>
              <Button
                onClick={() =>
                  router.push(`/admin/live-streams/${streamId}/edit`)
                }
                variant="outline"
                className="gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Button>
              <Button
                onClick={handleGoLive}
                disabled={actionLoading}
                className="gap-2"
              >
                <Play className="w-4 h-4" />
                Go Live Now
              </Button>
            </>
          )}
          {stream.status === "live" && (
            <Button
              onClick={handleEndStream}
              disabled={actionLoading}
              variant="destructive"
              className="gap-2"
            >
              <Square className="w-4 h-4" />
              End Stream
            </Button>
          )}
        </div>
      </div>

      {/* Status */}
      <StreamStatusHeader
        status={stream.status}
        scheduledAt={stream.scheduled_at}
        startedAt={stream.started_at}
        endedAt={stream.ended_at}
        currentViewers={stream.concurrent_viewers}
        peakViewers={stream.peak_viewers}
        durationSec={stream.duration_sec}
      />

      {/* Main Content: Split Layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Panel: Stream Preview & Controls (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* YouTube Embed */}
          <YouTubeEmbed
            videoId={stream.yt_video_id}
            streamStatus={stream.status}
          />

          {/* Stats (only when live or ended) */}
          {(stream.status === "live" || stream.status === "ended") && (
            <div className="grid grid-cols-4 gap-4">
              <StreamStatsCard
                label="Viewers Now"
                value={stream.concurrent_viewers || 0}
              />
              <StreamStatsCard label="Peak" value={stream.peak_viewers || 0} />
              <StreamStatsCard
                label="Duration"
                value={
                  stream.duration_sec
                    ? `${Math.floor(stream.duration_sec / 60)}:${(
                        stream.duration_sec % 60
                      )
                        .toString()
                        .padStart(2, "0")}`
                    : "0:00"
                }
              />
              <StreamStatsCard
                label="Chat/min"
                value={
                  (stream.total_chat_msgs || 0 / (stream.duration_sec || 1)) *
                  60
                }
              />
            </div>
          )}

          {/* Encoder Details */}
          {stream.yt_stream_key && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Encoder / OBS Setup Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    RTMP Server URL
                  </p>
                  <div className="flex gap-2">
                    <code className="bg-muted px-3 py-2 rounded text-sm flex-1 overflow-auto">
                      {stream.yt_rtmp_url}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyRTMPUrl}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Stream Key
                  </p>
                  <div className="flex gap-2">
                    <input
                      type={showStreamKey ? "text" : "password"}
                      value={stream.yt_stream_key}
                      readOnly
                      className="bg-muted px-3 py-2 rounded text-sm flex-1"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowStreamKey(!showStreamKey)}
                    >
                      {showStreamKey ? "👁" : "👁‍🗨"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyStreamKey}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Broadcast ID
                    </p>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {stream.yt_broadcast_id}
                    </code>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Stream ID</p>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {stream.yt_stream_id}
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel: Chat & Engagement (1/3) */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            {/* Active Viewers */}
            <ActiveViewers streamId={streamId} />
            
            {/* Chat and Polls Tabs */}
            <Tabs defaultValue="chat" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="chat" className="gap-2">
                  <span className="hidden sm:inline">Chat</span>
                  <span className="sm:hidden">💬</span>
                </TabsTrigger>
                <TabsTrigger value="polls" className="gap-2">
                  <span className="hidden sm:inline">Polls</span>
                  <span className="sm:hidden">📊</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="chat" className="h-[calc(100vh-480px)] min-h-[400px]">
                <ChatPanel streamId={streamId} isAdmin={true} />
              </TabsContent>

              <TabsContent value="polls" className="h-[calc(100vh-480px)] min-h-[400px]">
                <PollsPanel streamId={streamId} isAdmin={true} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
