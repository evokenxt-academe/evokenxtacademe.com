"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import type { StreamAnalyticsSnapshot } from "@/types/live-stream";
import { Skeleton } from "@/components/ui/skeleton";

type ViewerChartProps = {
  streamId: string;
  isLive: boolean;
};

export function ViewerChart({ streamId, isLive }: ViewerChartProps) {
  const [snapshots, setSnapshots] = useState<StreamAnalyticsSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchSnapshots = async () => {
    const { data } = await supabase
      .from("stream_analytics")
      .select("*")
      .eq("live_stream_id", streamId)
      .order("snapshot_at", { ascending: true })
      .limit(60);

    setSnapshots((data as StreamAnalyticsSnapshot[]) ?? []);
    setLoading(false);
  };

  const insertSnapshot = async () => {
    await fetch(`/api/admin/live-streams/${streamId}/analytics-snapshot`, {
      method: "POST",
    });
    await fetchSnapshots();
  };

  useEffect(() => {
    fetchSnapshots();

    const channel = supabase
      .channel(`analytics-${streamId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "stream_analytics",
          filter: `live_stream_id=eq.${streamId}`,
        },
        (payload) => {
          setSnapshots((prev) => [
            ...prev,
            payload.new as StreamAnalyticsSnapshot,
          ].slice(-60));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId, supabase]);

  useEffect(() => {
    if (!isLive) return;
    insertSnapshot();
    const interval = setInterval(insertSnapshot, 60_000);
    return () => clearInterval(interval);
  }, [isLive, streamId]);

  const chartData = snapshots.map((s) => ({
    time: format(new Date(s.snapshot_at), "HH:mm"),
    viewers: s.concurrent_viewers,
  }));

  if (loading) return <Skeleton className="h-32 w-full" />;

  if (chartData.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-6">
        Viewer data will appear when the stream goes live
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={120}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="time" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} width={30} />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="viewers"
          stroke="hsl(var(--primary))"
          dot={false}
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
