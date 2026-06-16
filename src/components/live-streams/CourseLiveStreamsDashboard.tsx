"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, RefreshCw } from "lucide-react";
import { LiveNowBanner } from "@/components/live-streams/LiveNowBanner";
import { StreamTable } from "@/components/live-streams/StreamTable";
import { ScheduleStreamDialog } from "@/components/live-streams/ScheduleStreamDialog";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconBroadcast,
  IconClock,
  IconCalendar,
  IconEye,
} from "@tabler/icons-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  formatStreamDuration,
  formatWatchHours,
  getStatusBadgeClass,
} from "@/lib/live-stream/formatters";
import { streamControlPath, streamEditPath } from "@/lib/live-stream/admin-paths";
import type { StreamListItem, StreamListStats, StreamStatus } from "@/types/live-stream";
import { cn } from "@/lib/utils";
import { startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { Badge } from "@/components/ui/badge";

type CourseLiveStreamsDashboardProps = {
  courseId: string;
};

export function CourseLiveStreamsDashboard({ courseId }: CourseLiveStreamsDashboardProps) {
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const supabase = createClient();

  const [courseTitle, setCourseTitle] = useState("");
  const [streams, setStreams] = useState<StreamListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchStreams = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("live_streams")
        .select(`
          id, title, status, scheduled_at, started_at,
          peak_viewers, concurrent_viewers, duration_sec,
          yt_video_id, yt_thumbnail_url,
          courses (
            id, title,
            subjects (name, code,
              program_levels (label,
                programs (body)
              )
            )
          )
        `)
        .eq("course_id", courseId)
        .order("scheduled_at", { ascending: false });

      if (error) throw error;

      const formatted: StreamListItem[] = (data ?? []).map((s: Record<string, unknown>) => {
        const courses = s.courses as Record<string, unknown> | null;
        const subjects = courses?.subjects as Record<string, unknown> | null;
        const programLevels = subjects?.program_levels as Record<string, unknown> | null;
        const programs = programLevels?.programs as Record<string, unknown> | null;
        return {
          id: s.id as string,
          title: s.title as string,
          status: s.status as StreamStatus,
          scheduledAt: s.scheduled_at as string | null,
          startedAt: s.started_at as string | null,
          courseId: (courses?.id as string) ?? courseId,
          courseTitle: (courses?.title as string) ?? "",
          programBody: (programs?.body as string) ?? "",
          subjectCode: (subjects?.code as string) ?? "",
          peakViewers: (s.peak_viewers as number) ?? 0,
          concurrentViewers: (s.concurrent_viewers as number) ?? 0,
          durationSec: (s.duration_sec as number) ?? 0,
          ytVideoId: s.yt_video_id as string | null,
          ytThumbnailUrl: s.yt_thumbnail_url as string | null,
        };
      });

      setStreams(formatted);
      if (formatted[0]?.courseTitle) {
        setCourseTitle(formatted[0].courseTitle);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load streams");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase
      .from("courses")
      .select("title")
      .eq("id", courseId)
      .single()
      .then(({ data }) => {
        if (data?.title) setCourseTitle(data.title);
      });

    fetchStreams();

    const channel = supabase
      .channel(`live-streams-course-${courseId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_streams" },
        () => fetchStreams(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [courseId, supabase]);

  const stats: StreamListStats = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    return {
      totalStreams: streams.length,
      liveCount: streams.filter((s) => s.status === "live").length,
      scheduledThisWeek: streams.filter(
        (s) =>
          s.status === "scheduled" &&
          s.scheduledAt &&
          isWithinInterval(new Date(s.scheduledAt), { start: weekStart, end: weekEnd }),
      ).length,
      totalWatchHours: streams.reduce((acc, s) => acc + (s.durationSec ?? 0), 0),
    };
  }, [streams]);

  const filteredStreams = useMemo(() => {
    return streams.filter((s) => {
      if (searchTerm && !s.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (dateFrom && s.scheduledAt && new Date(s.scheduledAt) < new Date(dateFrom)) return false;
      if (dateTo && s.scheduledAt && new Date(s.scheduledAt) > new Date(`${dateTo}T23:59:59`)) return false;
      return true;
    });
  }, [streams, searchTerm, statusFilter, dateFrom, dateTo]);

  const liveStreams = streams.filter((s) => s.status === "live");

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this stream?")) return;
    const { error } = await supabase.from("live_streams").delete().eq("id", id);
    if (error) toast.error("Delete failed");
    else toast.success("Stream deleted");
  };

  const handleGoLive = async (id: string) => {
    const res = await fetch("/api/youtube/broadcasts/go-live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ streamId: id }),
    });
    if (res.ok) toast.success("Stream is live");
    else {
      const data = await res.json();
      toast.error(data.error ?? "Failed to go live");
    }
  };

  const handleEndStream = async (id: string) => {
    const res = await fetch("/api/youtube/broadcasts/end", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ streamId: id }),
    });
    if (res.ok) toast.success("Stream ended");
    else toast.error("Failed to end stream");
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Live Streams</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {courseTitle ? `Manage broadcasts for ${courseTitle}` : "Manage course broadcasts"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchStreams}>
            <RefreshCw className="mr-2 size-4" />
            Refresh
          </Button>
          <Button onClick={() => setScheduleOpen(true)}>
            <Plus className="mr-2 size-4" />
            Schedule Stream
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={IconBroadcast} label="Total Streams" value={stats.totalStreams} />
        <StatCard
          icon={IconEye}
          label="Currently Live"
          value={stats.liveCount}
          pulse={stats.liveCount > 0}
        />
        <StatCard icon={IconCalendar} label="Scheduled This Week" value={stats.scheduledThisWeek} />
        <StatCard icon={IconClock} label="Total Watch Hours" value={formatWatchHours(stats.totalWatchHours)} />
      </div>

      {liveStreams.length > 0 && (
        <LiveNowBanner
          courseId={courseId}
          streams={liveStreams.map((s) => ({
            id: s.id,
            title: s.title,
            status: s.status as "live",
            currentViewers: s.concurrentViewers,
            peakViewers: s.peakViewers,
          }))}
        />
      )}

      <Separator />

      <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="live">Live</SelectItem>
            <SelectItem value="ended">Ended</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="replay">Replay</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="w-full md:w-36"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-full md:w-36"
        />
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : filteredStreams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <IconEye className="size-12 text-muted-foreground/30" />
            <div>
              <h3 className="font-semibold">No streams found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Schedule your first live class for this course.
              </p>
            </div>
            <Button onClick={() => setScheduleOpen(true)}>
              <Plus className="mr-2 size-4" />
              Schedule First Stream
            </Button>
          </CardContent>
        </Card>
      ) : isMobile ? (
        <div className="flex flex-col gap-3">
          {filteredStreams.map((stream) => (
            <Card key={stream.id}>
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      href={streamControlPath(courseId, stream.id)}
                      className="font-semibold hover:underline"
                    >
                      {stream.title}
                    </Link>
                  </div>
                  <Badge variant="outline" className={cn("capitalize", getStatusBadgeClass(stream.status))}>
                    {stream.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <p className="text-muted-foreground">Peak</p>
                    <p className="font-bold">{stream.peakViewers}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Duration</p>
                    <p className="font-bold">{formatStreamDuration(stream.durationSec)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Scheduled</p>
                    <p className="font-bold">
                      {stream.scheduledAt
                        ? new Date(stream.scheduledAt).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <Link href={streamControlPath(courseId, stream.id)}>Open Control Room</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <StreamTable
          courseId={courseId}
          streams={filteredStreams}
          onEdit={(id) => router.push(streamEditPath(courseId, id))}
          onGoLive={handleGoLive}
          onEndStream={handleEndStream}
          onDelete={handleDelete}
        />
      )}

      <ScheduleStreamDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        courseId={courseId}
        onCreated={(streamId) => router.push(streamControlPath(courseId, streamId))}
      />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  pulse,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  pulse?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2 p-5">
        <div className="flex items-center gap-2">
          {pulse ? (
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-destructive" />
            </span>
          ) : null}
          <Icon className="size-5 text-muted-foreground" />
        </div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
