"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { IconSend } from "@tabler/icons-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/supabase/client";
import { getStreamChat, sendChatMessage } from "@/lib/supabase/live-stream-queries";
import { useStreamRealtime } from "@/hooks/useStreamRealtime";

interface LiveChatProps {
  streamId: string;
  isLive: boolean;
}

export function LiveChat({ streamId, isLive }: LiveChatProps) {
  const supabase = useMemo(() => createClient(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { chatMessages } = useStreamRealtime(streamId);

  const getRelativeTime = (value?: string | null) => {
    if (!value) return "just now";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "just now";
    return formatDistanceToNow(date, { addSuffix: true });
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, [supabase]);

  useEffect(() => {
    getStreamChat(streamId).then(setMessages).catch(() => setMessages([]));
  }, [streamId]);

  useEffect(() => {
    if (chatMessages.length === 0) return;
    setMessages((prev) => {
      const ids = new Set(prev.map((m: any) => m.id));
      const newMsgs = chatMessages.filter((m: any) => !ids.has(m.id));
      return [...prev, ...newMsgs];
    });
  }, [chatMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || !userId || sending) return;
    setSending(true);
    setInput("");
    try {
      await sendChatMessage(streamId, userId, text);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border bg-card/80 shadow-sm">
      <div className="border-b px-4 py-3.5">
        <p className="text-sm font-medium">Live Chat</p>
        <p className="text-xs text-muted-foreground">{messages.length} messages</p>
      </div>

      <ScrollArea className="flex-1 px-4 py-3">
        <div className="flex flex-col gap-3.5">
          {messages.map((msg: any) => (
            <div
              key={msg.id}
              className={`flex gap-2 ${msg.is_pinned ? "rounded-lg bg-muted/60 p-2" : ""}`}
            >
              <Avatar className="mt-0.5 size-7 shrink-0">
                <AvatarImage src={msg.users?.avatar ?? msg.author_avatar ?? undefined} />
                <AvatarFallback className="text-[10px]">
                  {(msg.users?.name ?? msg.author_name ?? "?").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="mb-1 text-xs font-medium leading-none text-foreground">
                  {msg.users?.name ?? msg.author_name ?? "Anonymous"}
                </p>
                <p className="wrap-break-word text-sm text-foreground/80">{msg.message}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {getRelativeTime(msg.created_at)}
                </p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {isLive && userId ? (
        <div className="flex gap-2 border-t p-3.5">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void handleSend()}
            placeholder="Type a message..."
            className="h-9 text-sm"
            maxLength={200}
            disabled={sending}
          />
          <Button
            size="icon"
            className="size-9 shrink-0"
            onClick={() => void handleSend()}
            disabled={!input.trim() || sending}
          >
            <IconSend />
          </Button>
        </div>
      ) : (
        <div className="border-t p-3.5 text-center">
          <p className="text-xs text-muted-foreground">
            Chat is only available during live sessions
          </p>
        </div>
      )}
    </div>
  );
}
