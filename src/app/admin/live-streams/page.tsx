"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  RefreshCw,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { StreamStatsCard } from "@/components/live-streams/StreamStatsCard";
import { LiveNowBanner } from "@/components/live-streams/LiveNowBanner";
import { StreamTable } from "@/components/live-streams/StreamTable";
import { createBrowserClient } from "@supabase/ssr";
import { toast } from "sonner";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  IconBroadcast,
  IconUsers,
  IconMessageCircle,
  IconClock,
} from "@tabler/icons-react";
import { useMediaQuery } from "@/hooks/use-media-query";

interface Stream {
  id: string;
  title: string;
  program?: string;
  course?: string;
  scheduledAt?: string;
  startedAt?: string;
  status: "scheduled" | "live" | "ended" | "cancelled";
  currentViewers?: number;
  peakViewers?: number;
  durationSec?: number;
  totalChatMsgs?: number;
}

interface Stats {
  totalStreams: number;
  totalViewers: number;
  avgDuration: string;
  totalChatMessages: number;
  liveCount: number;
}

export default function LiveStreamsDashboard() {
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [streams, setStreams] = useState<Stream[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalStreams: 0,
    totalViewers: 0,
    avgDuration: "0h 0m",
    totalChatMessages: 0,
    liveCount: 0,
  });
  const [filteredStreams, setFilteredStreams] = useState<Stream[]>([]);
  const [liveStreams, setLiveStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [authError, setAuthError] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [programFilter, setProgramFilter] = useState<string>("all");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const handleSync = async () => {
    setSyncing(true);
    setAuthError(false);
    try {
      const response = await fetch("/api/youtube/broadcasts/sync", {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        if (data.error?.includes("invalid_grant")) {
          setAuthError(true);
          toast.error("YouTube account needs reconnection");
        } else {
          toast.error(data.error || "Sync failed");
        }
        return;
      }

      if (data.success && data.count > 0) {
        toast.success(`Synced ${data.count} stream(s) from YouTube`);
      } else if (data.success) {
        toast.info("No active streams found on YouTube");
      }
    } catch (error) {
      console.error("Failed to sync from YouTube:", error);
      toast.error("Network error during sync");
    } finally {
      setSyncing(false);
    }
  };

  // Fetch streams
  useEffect(() => {
    const fetchStreams = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("live_streams")
          .select(
            `
            id,
            title,
            status,
            scheduled_at,
            started_at,
            ended_at,
            concurrent_viewers,
            peak_viewers,
            duration_sec,
            total_chat_msgs,
            courses (
              id,
              title,
              subject:subjects (
                name,
                program_level:program_levels (
                  label
                )
              )
            )
          `,
          )
          .order("scheduled_at", { ascending: false });

        if (error) {
          console.error("Supabase error fetching streams:", error);
          throw error;
        }

        const formattedStreams: Stream[] = (data || []).map((s: any) => ({
          id: s.id,
          title: s.title,
          status: s.status,
          scheduledAt: s.scheduled_at,
          startedAt: s.started_at,
          currentViewers: s.concurrent_viewers,
          peakViewers: s.peak_viewers,
          durationSec: s.duration_sec,
          totalChatMsgs: s.total_chat_msgs,
          program: s.courses?.subject?.program_level?.label,
          course: s.courses?.subject?.name,
        }));

        setStreams(formattedStreams);

        // Calculate stats
        const totalViewers = formattedStreams.reduce(
          (acc, s) => acc + (s.currentViewers || s.peakViewers || 0),
          0,
        );
        const totalDuration = formattedStreams.reduce(
          (acc, s) => acc + (s.durationSec || 0),
          0,
        );
        const avgDuration = totalDuration / (formattedStreams.length || 1);
        const avgHours = Math.floor(avgDuration / 3600);
        const avgMinutes = Math.floor((avgDuration % 3600) / 60);
        const liveCount = formattedStreams.filter(
          (s) => s.status === "live",
        ).length;

        setStats({
          totalStreams: formattedStreams.length,
          totalViewers,
          avgDuration: `${avgHours}h ${avgMinutes}m`,
          totalChatMessages: formattedStreams.reduce(
            (acc, s) => acc + (s.totalChatMsgs || 0),
            0,
          ),
          liveCount,
        });

        setLiveStreams(formattedStreams.filter((s) => s.status === "live"));
      } catch (error: any) {
        console.error("Failed to fetch streams:", error?.message || error);
      } finally {
        setLoading(false);
      }
    };

    fetchStreams();
    handleSync();

    // Subscribe to live_streams changes
    const channel = supabase
      .channel("live-streams-dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_streams" },
        () => {
          fetchStreams();
        },
      )
      .subscribe();

    // Handle success messages from URL
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "connected") {
      toast.success("YouTube account connected successfully!");
      router.replace("/admin/live-streams");
    }
    if (params.get("error") === "oauth_failed") {
      toast.error("Failed to connect YouTube account");
      router.replace("/admin/live-streams");
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router]);

  // Apply filters
  useEffect(() => {
    let filtered = streams;

    if (searchTerm) {
      filtered = filtered.filter((s) =>
        s.title.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    if (programFilter !== "all") {
      filtered = filtered.filter((s) => s.program === programFilter);
    }

    setFilteredStreams(filtered);
  }, [streams, searchTerm, statusFilter, programFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this stream?")) return;

    try {
      const { error } = await supabase
        .from("live_streams")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setStreams(streams.filter((s) => s.id !== id));
    } catch (error) {
      console.error("Failed to delete stream:", error);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      const { error } = await supabase
        .from("live_streams")
        .update({ status: "cancelled" })
        .eq("id", id);
      if (error) throw error;
    } catch (error) {
      console.error("Failed to cancel stream:", error);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const response = await fetch(`/api/live-streams/${id}/duplicate`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to duplicate stream");
      }

      const data = await response.json();
      router.push(`/admin/live-streams/${data.streamId}/edit`);
    } catch (error) {
      console.error("Failed to duplicate stream:", error);
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/admin/live-streams/${id}/edit`);
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
      {/* Page Header */}
      <div className="space-y-1.5 md:space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Live Streams
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
          Manage live classes across all programs and track real-time viewer
          engagement.
        </p>
      </div>

      {/* Action Button */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <Button
          onClick={handleSync}
          variant="outline"
          disabled={syncing}
          className="gap-2 flex-1 sm:flex-none"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Sync YouTube</span>
          <span className="sm:hidden">Sync</span>
        </Button>
        <Button asChild size="lg" className="gap-2 flex-1 sm:flex-none">
          <Link href="/admin/live-streams/new">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Schedule Stream</span>
            <span className="sm:hidden">New</span>
          </Link>
        </Button>
      </div>

      {/* YouTube Auth Alert */}
      {authError && (
        <Alert
          variant="destructive"
          className="border-destructive/20 bg-destructive/5"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>YouTube Authentication Expired</AlertTitle>
          <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-2">
            <span>
              Your YouTube access has expired. Please reconnect your account to
              sync live streams.
            </span>
            <Button
              size="sm"
              variant="outline"
              className="gap-2 w-full sm:w-auto"
              asChild
            >
              <Link href="/api/youtube/oauth/authorize">
                <ExternalLink className="w-4 h-4" />
                Reconnect YouTube
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Live Count Badge */}
      {stats.liveCount > 0 && (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 border border-destructive/20">
          <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
          <span className="text-sm font-medium text-destructive">
            {stats.liveCount} stream{stats.liveCount !== 1 ? "s" : ""} live now
          </span>
        </div>
      )}

      <Separator className="my-2" />

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StreamStatCardResponsive
          icon={IconBroadcast}
          label="Total Streams"
          value={stats.totalStreams}
          gradient="from-blue-500/10 to-cyan-500/10"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        <StreamStatCardResponsive
          icon={IconUsers}
          label="Total Viewers"
          value={stats.totalViewers.toLocaleString()}
          gradient="from-emerald-500/10 to-teal-500/10"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
        <StreamStatCardResponsive
          icon={IconClock}
          label="Avg Duration"
          value={stats.avgDuration}
          gradient="from-amber-500/10 to-orange-500/10"
          iconColor="text-amber-600 dark:text-amber-400"
        />
        <StreamStatCardResponsive
          icon={IconMessageCircle}
          label="Chat Messages"
          value={stats.totalChatMessages.toLocaleString()}
          gradient="from-purple-500/10 to-pink-500/10"
          iconColor="text-purple-600 dark:text-purple-400"
        />
      </div>

      {/* Live Now Banner */}
      {liveStreams.length > 0 && <LiveNowBanner streams={liveStreams} />}

      {/* Filters */}
      <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search streams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <Select value={programFilter} onValueChange={setProgramFilter}>
          <SelectTrigger className="w-full md:w-56">
            <SelectValue placeholder="All Programs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Programs</SelectItem>
            <SelectItem value="Applied Knowledge">
              ACCA - Applied Knowledge
            </SelectItem>
            <SelectItem value="Applied Skills">
              ACCA - Applied Skills
            </SelectItem>
            <SelectItem value="Level 1">CFA - Level 1</SelectItem>
            <SelectItem value="Part 1">CMA - Part 1</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-56">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="live">Live</SelectItem>
            <SelectItem value="ended">Ended</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Streams List */}
      <div className="space-y-4">
        {loading ? (
          <Card className="border-border/50">
            <CardContent className="p-6 sm:p-8 text-center">
              <p className="text-muted-foreground">Loading streams...</p>
            </CardContent>
          </Card>
        ) : filteredStreams.length === 0 ? (
          <EmptyStreamState />
        ) : isMobile ? (
          // Mobile: Card-based view
          <div className="space-y-3">
            {filteredStreams.map((stream) => (
              <StreamCardMobile key={stream.id} stream={stream} />
            ))}
          </div>
        ) : (
          // Desktop: Table view
          <StreamTable
            streams={filteredStreams}
            onEdit={(id) => router.push(`/admin/live-streams/${id}/edit`)}
            onDuplicate={handleDuplicate}
            onCancel={handleCancel}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
}

// ── Responsive Stat Card Component ────────────────────────────────

interface StreamStatCardResponsiveProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  gradient: string;
  iconColor: string;
}

function StreamStatCardResponsive({
  icon: Icon,
  label,
  value,
  gradient,
  iconColor,
}: StreamStatCardResponsiveProps) {
  return (
    <Card className="group overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardContent className="p-5 sm:p-6">
        <div className="space-y-3">
          <div
            className={`flex size-12 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} backdrop-blur-sm`}
          >
            <Icon className={`size-6 ${iconColor}`} />
          </div>
          <div className="space-y-1">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide opacity-75">
              {label}
            </p>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight">
              {value}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Empty State Component ───────────────────────────────────────────

function EmptyStreamState() {
  return (
    <Card className="border-border/50">
      <CardContent className="p-8 sm:p-12 text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
          <IconBroadcast className="size-8 text-muted-foreground/40" />
        </div>
        <h3 className="mb-2 text-lg sm:text-xl font-semibold text-foreground">
          No streams found
        </h3>
        <p className="mb-6 max-w-sm text-sm text-muted-foreground leading-relaxed mx-auto">
          Create your first live stream to start broadcasting to your students.
        </p>
        <Button asChild variant="outline" className="gap-2">
          <Link href="/admin/live-streams/new">
            <Plus className="w-4 h-4" />
            Create Stream
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// ── Mobile Stream Card Component ────────────────────────────────────

function StreamCardMobile({ stream }: { stream: Stream }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "live":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "scheduled":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "ended":
        return "bg-muted text-muted-foreground border-border/30";
      default:
        return "bg-muted text-muted-foreground border-border/30";
    }
  };

  return (
    <Card className="overflow-hidden border-border/50 hover:border-border transition-colors">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm sm:text-base truncate text-foreground">
              {stream.title}
            </h3>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {stream.course || "No course assigned"}
            </p>
          </div>
          <Badge
            variant="outline"
            className={`text-xs shrink-0 ${getStatusColor(stream.status)}`}
          >
            {stream.status.charAt(0).toUpperCase() + stream.status.slice(1)}
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 py-2">
          <StatItemMobile label="Viewers" value={stream.currentViewers || 0} />
          <StatItemMobile label="Peak" value={stream.peakViewers || 0} />
          <StatItemMobile label="Messages" value={stream.totalChatMsgs || 0} />
          <StatItemMobile
            label="Duration"
            value={`${Math.round((stream.durationSec || 0) / 60)}m`}
          />
        </div>

        {/* Time Info */}
        {stream.scheduledAt && (
          <div className="text-xs text-muted-foreground border-t border-border/50 pt-2">
            {stream.status === "scheduled" ? "Scheduled" : "Started"}:{" "}
            {new Date(
              stream.startedAt || stream.scheduledAt,
            ).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatItemMobile({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="text-center space-y-0.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-base sm:text-lg font-bold text-foreground">{value}</p>
    </div>
  );
}
