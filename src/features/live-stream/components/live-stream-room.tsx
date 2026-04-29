"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { LiveChatPanel } from "@/components/live/live-chat-panel";
import { LiveVideoPanel } from "@/components/live/live-video-panel";
import { useChatMessages } from "@/hooks/live/use-chat-messages";
import { useLiveStream } from "@/hooks/live/use-live-stream";
import { useSendMessage } from "@/hooks/live/use-send-message";
import { IconBroadcast, IconMessages } from "@tabler/icons-react";
import { toast } from "sonner";

type LiveStreamRoomProps = {
  courseId: string;
  courseName: string;
};

export function LiveStreamRoom({ courseId, courseName }: LiveStreamRoomProps) {
  const { currentStream, initialMessages, isLoading, error } =
    useLiveStream(courseId);
  const { messages } = useChatMessages(
    currentStream?.id ?? null,
    initialMessages,
  );
  const { sendMessage, isSending } = useSendMessage();
  const [inputMessage, setInputMessage] = React.useState("");

  const canChat = Boolean(currentStream && currentStream.status === "live");

  const handleSubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!currentStream || !canChat || !inputMessage.trim()) {
        return;
      }

      try {
        await sendMessage({
          streamId: currentStream.id,
          message: inputMessage.trim(),
        });
        setInputMessage("");
      } catch (sendError) {
        toast.error(
          sendError instanceof Error
            ? sendError.message
            : "Failed to send message",
        );
      }
    },
    [canChat, currentStream, inputMessage, sendMessage],
  );

  if (isLoading) {
    return (
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <Skeleton className="aspect-video w-full rounded-3xl" />
          <Skeleton className="h-28 w-full rounded-3xl" />
        </div>
        <Skeleton className="min-h-[540px] w-full rounded-3xl" />
      </div>
    );
  }

  if (error) {
    return (
      <Empty className="min-h-[420px] border-border/60 bg-muted/10">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <IconBroadcast />
          </EmptyMedia>
          <EmptyTitle>Unable to load live stream</EmptyTitle>
          <EmptyDescription>
            {error instanceof Error
              ? error.message
              : "There was a problem loading this live class."}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  if (!currentStream) {
    return (
      <Empty className="min-h-[520px] border-border/60 bg-muted/10">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <IconMessages />
          </EmptyMedia>
          <EmptyTitle>No live stream yet</EmptyTitle>
          <EmptyDescription>
            Your instructor has not started a live class for this course yet.
            Check back when the broadcast goes live.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Badge variant="outline" className="rounded-full px-2.5 py-0.5">
            Waiting for broadcast
          </Badge>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <LiveVideoPanel stream={currentStream} courseName={courseName} />
      <LiveChatPanel
        streamId={currentStream.id}
        streamStatus={currentStream.status}
        messages={messages}
        inputMessage={inputMessage}
        onInputMessageChange={setInputMessage}
        onSubmit={handleSubmit}
        isSending={isSending}
        disabled={!canChat}
      />
    </div>
  );
}
