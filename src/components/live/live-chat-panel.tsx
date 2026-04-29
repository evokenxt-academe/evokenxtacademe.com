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
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatLiveTime, getInitials } from "@/features/live-stream/lib";
import type {
  LiveChatMessage,
  LiveStreamStatus,
} from "@/features/live-stream/types";
import {
  IconClock,
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
}: LiveChatPanelProps) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isEnded = streamStatus === "ended";

  return (
    <Card className="flex min-h-[540px] flex-col overflow-hidden border-border/70 shadow-sm">
      <CardHeader className="border-b border-border/60 bg-muted/20">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base">Live Chat</CardTitle>
            <CardDescription>
              {isEnded
                ? "Chat is read-only because the stream ended."
                : "Messages update instantly through Supabase Realtime."}
            </CardDescription>
          </div>
          <Badge
            variant={isEnded ? "outline" : "secondary"}
            className="rounded-full px-2.5 py-0.5"
          >
            {messages.length} messages
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col p-0">
        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-3 p-4">
            {messages.length > 0 ? (
              messages.map((message, index) => (
                <div
                  key={message.id}
                  className="rounded-xl border border-border/60 bg-background/80 p-3 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="size-9 shrink-0">
                      <AvatarImage
                        src={message.userAvatar ?? undefined}
                        alt={message.userName}
                      />
                      <AvatarFallback>
                        {getInitials(message.userName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-medium">
                          {message.userName}
                        </p>
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <IconClock data-icon="inline-start" />
                          {formatLiveTime(message.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm leading-6 text-foreground/90">
                        {message.message}
                      </p>
                    </div>
                  </div>
                  {index < messages.length - 1 ? (
                    <Separator className="mt-3" />
                  ) : null}
                </div>
              ))
            ) : (
              <Empty className="min-h-[280px] border-border/60 bg-muted/10">
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
                    Keep it short and useful
                  </Badge>
                </EmptyContent>
              </Empty>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <Separator />

        <form className="flex gap-2 p-4" onSubmit={onSubmit}>
          <Input
            value={inputMessage}
            onChange={(event) => onInputMessageChange(event.target.value)}
            placeholder={
              isEnded ? "Chat is disabled on ended streams" : "Write a message…"
            }
            disabled={disabled}
            maxLength={280}
            autoComplete="off"
            aria-label="Live chat message"
          />
          <Button
            type="submit"
            disabled={disabled || !inputMessage.trim() || isSending}
          >
            <IconSend2 data-icon="inline-start" />
            Send
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
