"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { IconTrash } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { adminApi } from "@/features/admin/lib/admin-api";
import { formatDateTime } from "@/features/admin/lib/formatters";

export default function LiveChatPage() {
  const chatQuery = useQuery({
    queryKey: ["admin-live-chat"],
    queryFn: adminApi.getLiveChat,
  });
  const streamsQuery = useQuery({
    queryKey: ["admin-live-streams"],
    queryFn: adminApi.getLiveStreams,
  });

  const chatMessages = chatQuery.data?.chatMessages ?? [];
  const liveStreams = streamsQuery.data?.liveStreams ?? [];
  const [activeStream, setActiveStream] = React.useState("");

  React.useEffect(() => {
    if (!activeStream && liveStreams[0]?.title) {
      setActiveStream(liveStreams[0].title);
    }
  }, [activeStream, liveStreams]);

  const visibleMessages = React.useMemo(
    () => chatMessages.filter((message) => message.stream === activeStream),
    [activeStream, chatMessages],
  );

  return (
    <AdminPageShell
      title="Live Chat"
      description="Moderate stream chat in real time with fast message removal."
      actions={
        <Badge variant="secondary" className="rounded-full px-3 py-1">
          {visibleMessages.length} messages
        </Badge>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="rounded-2xl border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Streams</CardTitle>
            <CardDescription>Pick a live or recent broadcast.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {liveStreams.map((stream) => (
              <button
                key={stream.id}
                className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${activeStream === stream.title ? "border-primary bg-primary/5" : "border-border/60 hover:bg-accent/50"}`}
                onClick={() => setActiveStream(stream.title)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{stream.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {stream.course}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="rounded-full capitalize"
                  >
                    {stream.status}
                  </Badge>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>{activeStream}</CardTitle>
            <CardDescription>
              Message moderation queue for the selected stream.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-130 rounded-xl border border-border/60 p-4">
              <div className="space-y-4">
                {visibleMessages.map((message, index) => (
                  <div key={message.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{message.user}</p>
                          <Badge
                            variant="secondary"
                            className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.2em]"
                          >
                            Chat
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {message.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(message.createdAt)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-lg"
                        onClick={() => toast.success("Message deleted")}
                      >
                        <IconTrash />
                      </Button>
                    </div>
                    {index < visibleMessages.length - 1 ? (
                      <Separator className="my-4" />
                    ) : null}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </AdminPageShell>
  );
}
