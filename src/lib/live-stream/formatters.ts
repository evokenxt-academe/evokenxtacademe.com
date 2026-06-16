import type { StreamStatus } from "@/types/live-stream";

export function formatStreamDuration(seconds?: number | null): string {
  if (!seconds || seconds <= 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatWatchHours(totalSeconds: number): string {
  const hours = totalSeconds / 3600;
  if (hours < 1) return `${Math.round(totalSeconds / 60)}m`;
  return `${hours.toFixed(1)}h`;
}

export function getStatusBadgeClass(status: StreamStatus): string {
  switch (status) {
    case "live":
      return "bg-destructive/10 text-destructive border-destructive/30";
    case "scheduled":
      return "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400";
    case "ended":
    case "replay":
      return "bg-muted text-muted-foreground border-border";
    case "cancelled":
      return "bg-muted text-muted-foreground border-border line-through";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function chatMessagesToCsv(
  messages: Array<{
    created_at: string;
    author_name: string | null;
    message: string;
    type: string;
    is_pinned: boolean;
  }>,
): string {
  const header = "timestamp,author,type,message,pinned";
  const rows = messages.map((m) => {
    const escaped = `"${m.message.replace(/"/g, '""')}"`;
    return `${m.created_at},${m.author_name ?? "Anonymous"},${m.type},${escaped},${m.is_pinned}`;
  });
  return [header, ...rows].join("\n");
}
