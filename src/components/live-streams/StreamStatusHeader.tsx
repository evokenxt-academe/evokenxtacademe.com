import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";

interface StreamStatusHeaderProps {
  status: "scheduled" | "live" | "ended" | "cancelled";
  scheduledAt?: string;
  startedAt?: string;
  endedAt?: string;
  currentViewers?: number;
  peakViewers?: number;
  durationSec?: number;
}

export function StreamStatusHeader({
  status,
  scheduledAt,
  startedAt,
  endedAt,
  currentViewers,
  peakViewers,
  durationSec,
}: StreamStatusHeaderProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    if (status === "scheduled" && scheduledAt) {
      const updateTimer = () => {
        const now = new Date();
        const scheduled = new Date(scheduledAt);
        const diff = scheduled.getTime() - now.getTime();

        if (diff <= 0) {
          setTimeRemaining("Starting now...");
          return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setTimeRemaining(`Starts in ${hours}h ${minutes}m ${seconds}s`);
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [status, scheduledAt]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const getStatusDisplay = () => {
    switch (status) {
      case "scheduled":
        return (
          <div className="border-b pb-4 mb-4">
            <div className="flex items-center gap-3">
              <Badge variant="outline">SCHEDULED</Badge>
              <span className="text-sm font-medium">{timeRemaining}</span>
            </div>
          </div>
        );
      case "live":
        return (
          <div className="border-b pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                <Badge
                  variant="default"
                  className="bg-red-600 hover:bg-red-700"
                >
                  LIVE
                </Badge>
              </div>
              <span className="text-sm">
                {startedAt &&
                  formatDistanceToNow(new Date(startedAt), {
                    addSuffix: false,
                  })}{" "}
                elapsed
              </span>
              <span className="text-sm font-medium">
                {currentViewers?.toLocaleString() || 0} viewers
              </span>
            </div>
          </div>
        );
      case "ended":
        return (
          <div className="border-b pb-4 mb-4">
            <div className="flex items-center gap-3">
              <Badge variant="secondary">ENDED</Badge>
              <span className="text-sm">
                Duration: {durationSec ? formatDuration(durationSec) : "0m"}
              </span>
              <span className="text-sm font-medium">
                Peak: {peakViewers?.toLocaleString() || 0} viewers
              </span>
            </div>
          </div>
        );
      case "cancelled":
        return (
          <div className="border-b pb-4 mb-4">
            <div className="flex items-center gap-3">
              <Badge variant="destructive">CANCELLED</Badge>
            </div>
          </div>
        );
    }
  };

  return getStatusDisplay();
}
