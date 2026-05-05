import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Play,
  BarChart3,
  Copy,
  Trash2,
  Edit,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

interface Stream {
  id: string;
  title: string;
  program?: string;
  course?: string;
  scheduledAt?: string;
  status: "scheduled" | "live" | "ended" | "cancelled";
  currentViewers?: number;
  peakViewers?: number;
  durationSec?: number;
  totalChatMsgs?: number;
}

interface StreamTableProps {
  streams: Stream[];
  onEdit?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onCancel?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  scheduled: "outline",
  live: "default",
  ended: "secondary",
  cancelled: "destructive",
};

export function StreamTable({
  streams,
  onEdit,
  onDuplicate,
  onCancel,
  onDelete,
}: StreamTableProps) {
  const formatDuration = (seconds?: number) => {
    if (!seconds) return "-";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>#</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Program</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Scheduled</TableHead>
            <TableHead>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-600 rounded-full" />
                Status
              </div>
            </TableHead>
            <TableHead>Viewers</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Chat</TableHead>
            <TableHead className="w-12">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {streams.map((stream, idx) => (
            <TableRow key={stream.id} className="hover:bg-muted/50">
              <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
              <TableCell>
                <Link
                  href={`/admin/live-streams/${stream.id}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {stream.title}
                </Link>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {stream.program || "-"}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {stream.course || "-"}
              </TableCell>
              <TableCell className="text-sm">
                {stream.scheduledAt
                  ? format(new Date(stream.scheduledAt), "MMM d, HH:mm")
                  : "-"}
              </TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANTS[stream.status]}>
                  {stream.status === "live" && (
                    <div className="w-1.5 h-1.5 bg-current rounded-full mr-1.5" />
                  )}
                  {stream.status.toUpperCase()}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">
                {stream.status === "live" || stream.status === "ended"
                  ? `${stream.currentViewers?.toLocaleString() || stream.peakViewers?.toLocaleString() || "-"}`
                  : "-"}
              </TableCell>
              <TableCell className="text-sm">
                {formatDuration(stream.durationSec)}
              </TableCell>
              <TableCell className="text-sm">
                {stream.totalChatMsgs?.toLocaleString() || "-"}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/admin/live-streams/${stream.id}`}
                        className="flex items-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        Control Center
                      </Link>
                    </DropdownMenuItem>
                    {stream.status === "ended" && (
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/admin/live-streams/${stream.id}/analytics`}
                          className="flex items-center gap-2"
                        >
                          <BarChart3 className="w-4 h-4" />
                          Analytics
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {onEdit && (
                      <DropdownMenuItem
                        onClick={() => onEdit(stream.id)}
                        className="flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {onDuplicate && (
                      <DropdownMenuItem
                        onClick={() => onDuplicate(stream.id)}
                        className="flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Duplicate
                      </DropdownMenuItem>
                    )}
                    {(stream.status === "scheduled" ||
                      stream.status === "live") &&
                      onCancel && (
                        <DropdownMenuItem
                          onClick={() => onCancel(stream.id)}
                          className="flex items-center gap-2 text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                          Cancel
                        </DropdownMenuItem>
                      )}
                    {onDelete && (
                      <DropdownMenuItem
                        onClick={() => onDelete(stream.id)}
                        className="flex items-center gap-2 text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
