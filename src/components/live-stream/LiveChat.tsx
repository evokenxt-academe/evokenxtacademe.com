"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { IconSend, IconArrowDown } from "@tabler/icons-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/supabase/client";
import { getStreamChat, sendChatMessage } from "@/lib/supabase/live-stream-queries";
import { useStreamRealtime } from "@/hooks/useStreamRealtime";
import { cn } from "@/lib/utils";

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
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const { chatMessages } = useStreamRealtime(streamId);

  const getRelativeTime = (value?: string | null) => {
    if (!value) return "just now";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "just now";
    return formatDistanceToNow(date, { addSuffix: true });
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.id) {
        setUserId(data.user.id);
        supabase.from("users").select("name, avatar").eq("id", data.user.id).single().then(({ data: user }) => {
          setCurrentUser(user);
        });
      }
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
      
      // If we receive a real message, we can clear our optimistic message of the same text
      // to prevent duplicates.
      const newTexts = new Set(newMsgs.map(m => m.message));
      const cleanPrev = prev.filter(m => !(m.is_optimistic && newTexts.has(m.message)));
      
      return [...cleanPrev, ...newMsgs];
    });
  }, [chatMessages]);

  const scrollToBottom = useCallback(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
      setIsAutoScrolling(true);
    }
  }, []);

  useEffect(() => {
    if (isAutoScrolling) {
      scrollToBottom();
    }
  }, [messages, isAutoScrolling, scrollToBottom]);

  const handleScroll = useCallback((e: Event) => {
    const target = e.target as HTMLDivElement;
    const scrollPosition = target.scrollTop + target.clientHeight;
    const scrollHeight = target.scrollHeight;
    const isAtBottom = scrollHeight - scrollPosition < 100;
    
    if (!isAtBottom && isAutoScrolling) {
      setIsAutoScrolling(false);
    } else if (isAtBottom && !isAutoScrolling) {
      setIsAutoScrolling(true);
    }
  }, [isAutoScrolling]);

  // Hook into shadcn ScrollArea's inner viewport to track scroll.
  useEffect(() => {
    const viewport = scrollViewportRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.addEventListener("scroll", handleScroll);
      return () => viewport.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  async function handleSend() {
    const text = input.trim();
    if (!text || !userId || sending) return;
    
    // Optimistic append
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      message: text,
      created_at: new Date().toISOString(),
      author_name: currentUser?.name ?? "User",
      author_avatar: currentUser?.avatar ?? null,
      user_id: userId,
      is_optimistic: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setInput("");
    scrollToBottom();
    
    setSending(true);
    try {
      await sendChatMessage(streamId, userId, text);
    } catch (e) {
      setMessages((prev) => prev.filter(m => m.id !== tempId));
    } finally {
      setSending(false);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border bg-card/80 shadow-sm relative">
      <div className="border-b px-4 py-3.5 shrink-0 bg-card z-10">
        <p className="text-sm font-medium">Live Chat</p>
        <p className="text-xs text-muted-foreground">{messages.filter(m => !m.is_optimistic).length} messages</p>
      </div>

      <div className="flex-1 relative min-h-0 overflow-hidden" ref={scrollViewportRef}>
        <ScrollArea className="h-full px-4 py-3">
          <div className="flex flex-col gap-3.5 pb-2">
            {messages.map((msg: any) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-2",
                  msg.is_pinned && "rounded-lg bg-muted/60 p-2",
                  msg.is_optimistic && "opacity-70"
                )}
              >
                <Avatar className="mt-0.5 size-7 shrink-0">
                  <AvatarImage src={msg.users?.avatar ?? msg.author_avatar ?? undefined} />
                  <AvatarFallback className="text-[10px]">
                    {(msg.users?.name ?? msg.author_name ?? "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="mb-1 text-xs font-medium leading-none text-foreground flex items-center gap-1.5">
                    {msg.users?.name ?? msg.author_name ?? "User"}
                    {userId && msg.user_id === userId && <span className="text-muted-foreground font-normal text-[10px] bg-muted px-1 rounded">(You)</span>}
                  </p>
                  <p className="wrap-break-word text-sm text-foreground/80 whitespace-pre-wrap">{msg.message}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {getRelativeTime(msg.created_at)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} className="h-1" />
          </div>
        </ScrollArea>

        {!isAutoScrolling && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none z-10">
            <Button 
              variant="secondary" 
              size="sm" 
              className="rounded-full shadow-md text-xs h-8 px-4 border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pointer-events-auto"
              onClick={scrollToBottom}
            >
              <IconArrowDown className="mr-1.5 size-3.5" />
              Jump to latest
            </Button>
          </div>
        )}
      </div>

      {userId ? (
        <div className="flex gap-2 border-t p-3.5 shrink-0 bg-card z-10">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[40px] max-h-[120px] text-sm resize-none py-2.5"
            maxLength={500}
            disabled={sending}
            rows={1}
          />
          <Button
            size="icon"
            className="size-10 shrink-0 self-end bg-green-500 hover:bg-green-600 text-white transition-colors"
            onClick={() => void handleSend()}
            disabled={!input.trim() || sending}
          >
            <IconSend className="size-4" />
          </Button>
        </div>
      ) : (
        <div className="border-t p-3.5 text-center shrink-0 bg-card z-10">
          <p className="text-xs text-muted-foreground">
            Please sign in to chat
          </p>
        </div>
      )}
    </div>
  );
}
