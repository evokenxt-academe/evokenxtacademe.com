import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StreamStatus = "scheduled" | "live" | "ended" | "replay" | "cancelled";

const config: Record<StreamStatus, { label: string; className: string; dot?: boolean }> = {
  live: {
    label: "Live Now",
    className: "border-red-200 bg-red-500/10 text-red-600",
    dot: true,
  },
  scheduled: {
    label: "Upcoming",
    className: "border-blue-200 bg-blue-500/10 text-blue-600",
  },
  replay: {
    label: "Replay",
    className: "border-purple-200 bg-purple-500/10 text-purple-600",
  },
  ended: {
    label: "Ended",
    className: "border-border bg-muted text-muted-foreground",
  },
  cancelled: {
    label: "Cancelled",
    className: "border-border bg-muted text-muted-foreground",
  },
};

export function StreamStatusBadge({ status }: { status: StreamStatus }) {
  const { label, className, dot } = config[status] ?? config.ended;

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        className,
      )}
    >
      {dot ? <span className="size-1.5 animate-pulse rounded-full bg-red-500" /> : null}
      {label}
    </Badge>
  );
}
