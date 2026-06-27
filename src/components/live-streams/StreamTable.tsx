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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  BarChart3,
  Trash2,
  Edit,
  Radio,
  Square,
  Settings2,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { formatStreamDuration, getStatusBadgeClass } from "@/lib/live-stream/formatters";
import { extractYoutubeVideoId } from "@/features/live-stream/lib";
import {
  streamAnalyticsPath,
  streamControlPath,
} from "@/lib/live-stream/admin-paths";
import type { StreamListItem, StreamStatus } from "@/types/live-stream";
import { cn } from "@/lib/utils";

interface StreamTableProps {
  courseId: string;
  streams: StreamListItem[];
  onEdit?: (id: string) => void;
  onGoLive?: (id: string) => void;
  onEndStream?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function StreamTable({
  courseId,
  streams,
  onEdit,
  onGoLive,
  onEndStream,
  onDelete,
}: StreamTableProps) {
  const thumbnailUrl = (stream: StreamListItem) => {
    if (stream.ytThumbnailUrl) return stream.ytThumbnailUrl;
    const videoId = extractYoutubeVideoId(stream.ytVideoId);
    if (videoId) return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    return null;
  };

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-20">Preview</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Scheduled</TableHead>
            <TableHead>Peak</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead className="w-12">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {streams.map((stream) => {
            const thumb = thumbnailUrl(stream);
            return (
              <TableRow key={stream.id} className="hover:bg-muted/30">
                <TableCell>
                  <div className="relative aspect-video w-16 overflow-hidden rounded bg-muted">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt="" className="size-full object-cover" />
                    ) : (
                      <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                        —
                      </div>
                    )}
                    {stream.status === "live" && (
                      <span className="absolute left-1 top-1 size-2 animate-pulse rounded-full bg-destructive" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Link
                    href={streamControlPath(courseId, stream.id)}
                    className="font-medium hover:underline"
                  >
                    {stream.title}
                  </Link>
                  <div className="mt-0.5 flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-xs">
                      {stream.programBody}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {stream.subjectCode}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{stream.courseTitle}</p>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn("capitalize", getStatusBadgeClass(stream.status))}
                  >
                    {stream.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {stream.scheduledAt
                    ? format(new Date(stream.scheduledAt), "MMM d, HH:mm")
                    : "—"}
                </TableCell>
                <TableCell className="text-sm">
                  {stream.peakViewers > 0 ? stream.peakViewers.toLocaleString() : "—"}
                </TableCell>
                <TableCell className="text-sm">
                  {formatStreamDuration(stream.durationSec)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={streamControlPath(courseId, stream.id)}>
                          <Settings2 className="mr-2 size-4" />
                          Control Room
                        </Link>
                      </DropdownMenuItem>
                      {onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(stream.id)}>
                          <Edit className="mr-2 size-4" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      {stream.status === "scheduled" && onGoLive && (
                        <DropdownMenuItem onClick={() => onGoLive(stream.id)}>
                          <Radio className="mr-2 size-4" />
                          Go Live
                        </DropdownMenuItem>
                      )}
                      {stream.status === "live" && onEndStream && (
                        <DropdownMenuItem onClick={() => onEndStream(stream.id)}>
                          <Square className="mr-2 size-4" />
                          End Stream
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild>
                        <Link href={streamAnalyticsPath(courseId, stream.id)}>
                          <BarChart3 className="mr-2 size-4" />
                          Analytics
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {onDelete && (
                        <DropdownMenuItem
                          onClick={() => onDelete(stream.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 size-4" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
