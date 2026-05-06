"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { LiveStreamCard } from "@/components/live-stream/LiveStreamCard";
import type { LiveStreamItem } from "@/components/live-stream/LiveStreamCard";
import { useLiveStreamsList } from "@/hooks/useLiveStreams";

type TabValue = "all" | "live" | "upcoming" | "replays";

const validTabs = new Set<TabValue>(["all", "live", "upcoming", "replays"]);

function filterStreams(streams: LiveStreamItem[], tab: TabValue) {
  if (tab === "all") return streams;
  if (tab === "live") return streams.filter((stream) => stream.status === "live");
  if (tab === "upcoming") {
    return streams.filter((stream) => stream.status === "scheduled");
  }
  return streams.filter((stream) => stream.status === "ended" || stream.status === "replay");
}

export function LiveStreamListClient({ initialTab }: { initialTab: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: streams, isLoading, error } = useLiveStreamsList();
  const activeTab: TabValue = validTabs.has(initialTab as TabValue)
    ? (initialTab as TabValue)
    : "all";

  const counts = useMemo(() => {
    const source = (streams ?? []) as LiveStreamItem[];
    return {
      all: source.length,
      live: source.filter((stream) => stream.status === "live").length,
      upcoming: source.filter((stream) => stream.status === "scheduled").length,
      replays: source.filter(
        (stream) => stream.status === "ended" || stream.status === "replay",
      ).length,
    };
  }, [streams]);

  const onTabChange = (nextTab: string) => {
    if (!validTabs.has(nextTab as TabValue)) return;
    const params = new URLSearchParams(searchParams.toString());
    if (nextTab === "all") params.delete("tab");
    else params.set("tab", nextTab);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  if (isLoading) return <StreamsGridSkeleton />;
  if (error) {
    return (
      <div className="rounded-2xl border border-dashed bg-card/40 p-8 text-center">
        <p className="text-sm font-medium">Could not load live classes</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Please refresh the page and try again.
        </p>
      </div>
    );
  }
  if (!streams?.length) {
    return (
      <div className="rounded-2xl border border-dashed bg-card/40 p-8 text-center">
        <p className="text-sm font-medium">No live classes right now</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Upcoming and recordings will appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-5">
      <div className="overflow-x-auto pb-1">
        <TabsList className="inline-flex h-auto w-fit min-w-max flex-nowrap items-center gap-1 rounded-xl border bg-card/60 p-1 shadow-sm">
          <TabsTrigger value="all" className="px-3 text-xs">
          All ({counts.all})
          </TabsTrigger>
          <TabsTrigger value="live" className="px-3 text-xs">
          Live Now ({counts.live})
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="px-3 text-xs">
          Upcoming ({counts.upcoming})
          </TabsTrigger>
          <TabsTrigger value="replays" className="px-3 text-xs">
          Recordings ({counts.replays})
          </TabsTrigger>
        </TabsList>
      </div>

      {(["all", "live", "upcoming", "replays"] as const).map((tab) => {
        const filtered = filterStreams((streams ?? []) as LiveStreamItem[], tab);
        return (
          <TabsContent key={tab} value={tab} className="mt-0">
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-card/30 p-8 text-center">
                <p className="text-sm text-muted-foreground">No streams found for this filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((stream) => (
                  <LiveStreamCard key={stream.id} stream={stream} />
                ))}
              </div>
            )}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}

function StreamsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <Skeleton className="aspect-video rounded-2xl" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}
