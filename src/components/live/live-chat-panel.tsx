"use client";

import * as React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Textarea } from "@/components/ui/textarea";
import { formatLiveTime, getInitials } from "@/features/live-stream/lib";
import type {
  LiveChatMessage,
  LiveStreamStatus,
} from "@/features/live-stream/types";
import { cn } from "@/lib/utils";
import {
  IconArrowDown,
  IconClock,
  IconLoader2,
  IconMessageCircle,
  IconMoodSmile,
  IconSend2,
} from "@tabler/icons-react";

type LiveChatPanelProps = {
  streamId: string | null;
  streamStatus: LiveStreamStatus | null;
  messages: LiveChatMessage[];
  inputMessage: string;
  onInputMessageChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  isSending: boolean;
  disabled: boolean;
  className?: string;
};

export function LiveChatPanel({
  streamId,
  streamStatus,
  messages,
  inputMessage,
  onInputMessageChange,
  onSubmit,
  isSending,
  disabled,
  className,
}: LiveChatPanelProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const [autoScroll, setAutoScroll] = React.useState(true);

  const isEnded = streamStatus === "ended";
  const isLive = streamStatus === "live";

  React.useEffect(() => {
    if (scrollRef.current && autoScroll) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, autoScroll]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 80);
  };

  const scrollToBottom = () => {
    setAutoScroll(true);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  return (
    <Card
      className={cn(
        "flex min-h-[480px] flex-col overflow-hidden border-border/70 shadow-sm",
        className,
      )}
    >
      <CardHeader className="shrink-0 border-b border-border/60 bg-muted/20 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <IconMessageCircle className="size-4 text-primary" />
            </div>
            <div className="space-y-0.5">
              <CardTitle className="text-base">Live Chat</CardTitle>
              <CardDescription className="text-xs">
                {isEnded
                  ? "Read-only — stream has ended"
                  : streamStatus === "scheduled"
                    ? "Waiting for the instructor to go live"
                    : isLive
                      ? "Chat with your class in real time"
                      : "Waiting for stream to start"}
              </CardDescription>
            </div>
          </div>
          <Badge
            variant={isLive ? "default" : "outline"}
            className="rounded-full px-2.5 py-0.5 tabular-nums"
          >
            {messages.length}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative flex min-h-0 flex-1 flex-col p-0">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3"
        >
          {messages.length > 0 ? (
            <div className="space-y-1">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className="group flex gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-muted/40"
                >
                  <Avatar className="size-8 shrink-0">
                    <AvatarImage
                      src={message.userAvatar ?? undefined}
                      alt={message.userName}
                    />
                    <AvatarFallback className="text-[10px] font-medium">
                      {getInitials(message.userName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="break-words text-sm font-semibold text-foreground">
                        {message.userName}
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
                        <IconClock className="size-3" />
                        {formatLiveTime(message.createdAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 break-words text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                      {message.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty className="min-h-[240px] border-border/60 bg-muted/10">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <IconMessageCircle />
                </EmptyMedia>
                <EmptyTitle>No messages yet</EmptyTitle>
                <EmptyDescription>
                  Be the first to ask a question or say hello when the class
                  starts.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Badge
                  variant="outline"
                  className="rounded-full px-2.5 py-0.5"
                >
                  <IconMoodSmile data-icon="inline-start" />
                  Keep it respectful and on-topic
                </Badge>
              </EmptyContent>
            </Empty>
          )}
        </div>

        {!autoScroll && messages.length > 0 ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-[88px] flex justify-center">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="pointer-events-auto rounded-full shadow-md"
              onClick={scrollToBottom}
            >
              <IconArrowDown data-icon="inline-start" />
              New messages
            </Button>
          </div>
        ) : null}

        <form
          className="shrink-0 border-t border-border/60 bg-card p-3"
          onSubmit={onSubmit}
        >
          <div className="flex gap-2">
            <Textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(event) => {
                onInputMessageChange(event.target.value);
                event.target.style.height = "auto";
                event.target.style.height = `${Math.min(event.target.scrollHeight, 100)}px`;
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  if (!disabled && inputMessage.trim() && !isSending) {
                    event.currentTarget.form?.requestSubmit();
                  }
                }
              }}
              placeholder={
                isEnded
                  ? "Chat is disabled — stream ended"
                  : disabled
                    ? streamStatus === "scheduled"
                      ? "Chat opens when the instructor goes live"
                      : "Chat opens when the stream goes live"
                    : "Write a message…"
              }
              disabled={disabled || isSending}
              maxLength={500}
              rows={1}
              autoComplete="off"
              aria-label="Live chat message"
              className="min-h-10 max-h-[100px] resize-none"
            />
            <Button
              type="submit"
              size="icon"
              className="size-10 shrink-0"
              disabled={disabled || !inputMessage.trim() || isSending}
              aria-label="Send message"
            >
              {isSending ? (
                <IconLoader2 className="size-4 animate-spin" />
              ) : (
                <IconSend2 className="size-4" />
              )}
            </Button>
          </div>
          {streamId ? (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Press Enter to send · Shift+Enter for a new line
            </p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
