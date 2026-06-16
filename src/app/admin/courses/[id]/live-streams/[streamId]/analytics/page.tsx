"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Download, ArrowLeft } from "lucide-react";
import {
  formatStreamDuration,
  getStatusBadgeClass,
  chatMessagesToCsv,
} from "@/lib/live-stream/formatters";
import type {
  LiveStreamRow,
  StreamAnalyticsSnapshot,
  StreamRegistration,
  PollOption,
} from "@/types/live-stream";
import { cn } from "@/lib/utils";
import { streamControlPath } from "@/lib/live-stream/admin-paths";

export default function StreamAnalyticsPage() {
  const params = useParams();
  const courseId = params.id as string;
  const streamId = params.streamId as string;
  const supabase = createClient();

  const [stream, setStream] = useState<LiveStreamRow | null>(null);
  const [snapshots, setSnapshots] = useState<StreamAnalyticsSnapshot[]>([]);
  const [registrations, setRegistrations] = useState<StreamRegistration[]>([]);
  const [polls, setPolls] = useState<Array<{ id: string; question: string; options: PollOption[] }>>([]);
  const [chatBuckets, setChatBuckets] = useState<Array<{ bucket: string; count: number }>>([]);
  const [metrics, setMetrics] = useState({
    registered: 0,
    attended: 0,
    attendanceRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [attendeeSearch, setAttendeeSearch] = useState("");
  const [sortField, setSortField] = useState<"name" | "join" | "duration">("name");

  useEffect(() => {
    const load = async () => {
      try {
        const [streamRes, analyticsRes, regRes, pollRes, chatRes] = await Promise.all([
          supabase.from("live_streams").select("*").eq("id", streamId).single(),
          supabase
            .from("stream_analytics")
            .select("*")
            .eq("live_stream_id", streamId)
            .order("snapshot_at", { ascending: true }),
          supabase
            .from("stream_registrations")
            .select("*, users(name, avatar, email)")
            .eq("live_stream_id", streamId),
          supabase.from("stream_polls").select("*").eq("live_stream_id", streamId),
          supabase
            .from("chat_messages")
            .select("created_at")
            .eq("live_stream_id", streamId)
            .eq("is_deleted", false),
        ]);

        if (streamRes.error) throw streamRes.error;
        setStream(streamRes.data as LiveStreamRow);
        setSnapshots((analyticsRes.data as StreamAnalyticsSnapshot[]) ?? []);

        const regs = (regRes.data as StreamRegistration[]) ?? [];
        setRegistrations(regs);
        const attended = regs.filter((r) => r.attended).length;
        setMetrics({
          registered: regs.length,
          attended,
          attendanceRate: regs.length ? Math.round((attended / regs.length) * 100) : 0,
        });

        const pollRows = pollRes.data ?? [];
        const formattedPolls: Array<{ id: string; question: string; options: PollOption[] }> = [];
        for (const poll of pollRows) {
          const { data: votes } = await supabase
            .from("stream_poll_votes")
            .select("option_id")
            .eq("poll_id", poll.id);
          const options = (poll.options as PollOption[]) ?? [];
          const counts = (votes ?? []).reduce<Record<number, number>>((acc, v) => {
            acc[v.option_id] = (acc[v.option_id] ?? 0) + 1;
            return acc;
          }, {});
          formattedPolls.push({
            id: poll.id,
            question: poll.question,
            options: options.map((o) => ({ ...o, votes: counts[o.id] ?? 0 })),
          });
        }
        setPolls(formattedPolls);

        const buckets: Record<string, number> = {};
        for (const msg of chatRes.data ?? []) {
          const d = new Date(msg.created_at);
          d.setMinutes(Math.floor(d.getMinutes() / 5) * 5, 0, 0);
          const key = format(d, "HH:mm");
          buckets[key] = (buckets[key] ?? 0) + 1;
        }
        setChatBuckets(
          Object.entries(buckets)
            .map(([bucket, count]) => ({ bucket, count }))
            .sort((a, b) => a.bucket.localeCompare(b.bucket)),
        );
      } catch (err) {
        console.error(err);
        toast.error("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [streamId, supabase]);

  const viewerChartData = snapshots.map((s) => ({
    time: format(new Date(s.snapshot_at), "HH:mm"),
    viewers: s.concurrent_viewers,
  }));

  const sortedAttendees = useMemo(() => {
    let list = [...registrations];
    if (attendeeSearch) {
      const q = attendeeSearch.toLowerCase();
      list = list.filter(
        (r) =>
          r.users?.name?.toLowerCase().includes(q) ||
          r.users?.email?.toLowerCase().includes(q),
      );
    }
    list.sort((a, b) => {
      if (sortField === "join") {
        return (a.join_time ?? "").localeCompare(b.join_time ?? "");
      }
      if (sortField === "duration") {
        return b.watch_duration_sec - a.watch_duration_sec;
      }
      return (a.users?.name ?? "").localeCompare(b.users?.name ?? "");
    });
    return list;
  }, [registrations, attendeeSearch, sortField]);

  const handleExportChat = async () => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("created_at, author_name, message, type, is_pinned")
      .eq("live_stream_id", streamId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Export failed");
      return;
    }

    const csv = chatMessagesToCsv(data ?? []);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-${streamId.slice(0, 8)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Chat exported");
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (!stream) {
    return <div className="p-6 text-center">Stream not found</div>;
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
            <Link href={streamControlPath(courseId, streamId)}>
              <ArrowLeft className="mr-2 size-4" />
              Control Room
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{stream.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {stream.scheduled_at && format(new Date(stream.scheduled_at), "PPP p")}
            {stream.duration_sec ? ` · ${formatStreamDuration(stream.duration_sec)}` : ""}
          </p>
          <Badge variant="outline" className={cn("mt-2 capitalize", getStatusBadgeClass(stream.status))}>
            {stream.status}
          </Badge>
        </div>
        <Button variant="outline" onClick={handleExportChat}>
          <Download className="mr-2 size-4" />
          Export Chat
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {[
          { label: "Peak Viewers", value: stream.peak_viewers.toLocaleString() },
          { label: "Chat Messages", value: stream.total_chat_msgs.toLocaleString() },
          { label: "Registered", value: metrics.registered },
          { label: "Attended", value: metrics.attended },
          { label: "Attendance Rate", value: `${metrics.attendanceRate}%` },
        ].map((m) => (
          <Card key={m.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <p className="text-2xl font-bold mt-1">{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Viewers Over Time</CardTitle>
            <CardDescription>Concurrent viewers from snapshots</CardDescription>
          </CardHeader>
          <CardContent>
            {viewerChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={viewerChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="viewers"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.15}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">No snapshot data</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Chat Activity</CardTitle>
            <CardDescription>Messages per 5-minute bucket</CardDescription>
          </CardHeader>
          <CardContent>
            {chatBuckets.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chatBuckets}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">No chat data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {polls.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="font-semibold">Poll Results</h2>
          {polls.map((poll) => {
            const maxVotes = Math.max(...poll.options.map((o) => o.votes), 1);
            return (
              <Card key={poll.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{poll.question}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {poll.options.map((opt) => (
                    <div key={opt.id} className="flex flex-col gap-1">
                      <div className="flex justify-between text-sm">
                        <span>{opt.text}</span>
                        <span className="font-medium">{opt.votes}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${(opt.votes / maxVotes) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-base">Attendees</CardTitle>
            <div className="flex gap-2">
              <Input
                placeholder="Search…"
                value={attendeeSearch}
                onChange={(e) => setAttendeeSearch(e.target.value)}
                className="h-8 w-40"
              />
              <select
                className="h-8 rounded-md border bg-background px-2 text-sm"
                value={sortField}
                onChange={(e) => setSortField(e.target.value as typeof sortField)}
              >
                <option value="name">Name</option>
                <option value="join">Join Time</option>
                <option value="duration">Watch Duration</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sortedAttendees.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No registrations yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Join</TableHead>
                  <TableHead>Leave</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Attended</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAttendees.map((reg) => (
                  <TableRow key={reg.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="size-7">
                          {reg.users?.avatar && <AvatarImage src={reg.users.avatar} />}
                          <AvatarFallback className="text-xs">
                            {reg.users?.name?.[0] ?? "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{reg.users?.name ?? "Unknown"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {reg.join_time ? format(new Date(reg.join_time), "p") : "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {reg.leave_time ? format(new Date(reg.leave_time), "p") : "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatStreamDuration(reg.watch_duration_sec)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={reg.attended ? "default" : "outline"}>
                        {reg.attended ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
