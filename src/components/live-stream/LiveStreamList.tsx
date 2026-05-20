"use client";

import Link from "next/link";
import { LiveStreamCard } from "./LiveStreamCard";
import { useLiveStreamsList } from "@/hooks/useLiveStreams";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function LiveStreamList() {
  const { data: streams, isLoading, error } = useLiveStreamsList();

  const liveNow = streams?.filter((s: any) => s.status === "live") ?? [];
  const upcoming = streams?.filter((s: any) => s.status === "scheduled") ?? [];
  const replays =
    streams?.filter((s: any) => s.status === "ended" || s.status === "replay") ?? [];

  // Only show skeleton on very first load (no cached data).
  // On tab re-visits, cached data renders immediately — no flash.
  if (isLoading && !streams) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Skeleton className="size-5 rounded" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="aspect-video rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !streams?.length) return null;

  return (
    <section className="flex flex-col gap-6">
      {liveNow.length > 0 ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="size-2 animate-pulse rounded-full bg-red-500" />
              <h2 className="text-sm font-semibold">Happening Now</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {liveNow.map((stream: any) => (
              <LiveStreamCard key={stream.id} stream={stream} />
            ))}
          </div>
        </div>
      ) : null}

      {upcoming.length > 0 ? (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Upcoming Classes</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.slice(0, 3).map((stream: any) => (
              <LiveStreamCard key={stream.id} stream={stream} />
            ))}
          </div>
        </div>
      ) : null}

      {replays.length > 0 ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground">Recorded Classes</h2>
            {replays.length > 3 ? (
              <Link href="/dashboard/student/live?tab=replays">
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  View all
                </Button>
              </Link>
            ) : null}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {replays.slice(0, 3).map((stream: any) => (
              <LiveStreamCard key={stream.id} stream={stream} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
