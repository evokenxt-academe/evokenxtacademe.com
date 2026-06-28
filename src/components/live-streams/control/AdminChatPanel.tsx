"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertCircle,
  ArrowDown,
  Bell,
  CheckCircle,
  Copy,
  Loader2,
  Megaphone,
  MessageCircle,
  MoreHorizontal,
  Pin,
  PinOff,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useStreamChat } from "@/hooks/useStreamChat";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type MessageType = "message" | "announcement" | "system";

const SHORTCUT_MESSAGES = [
  "Any doubt?",
  "Am I audible?",
  "Yes or No?",
  "Quality fine?",
  "Network issue? Check your network.",
];

type AdminChatPanelProps = {
  streamId: string;
  chatModeration?: boolean;
  filterType?: "all" | "question";
  searchTerm?: string;
};

function initials(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function AdminChatPanel({
  streamId,
  chatModeration = false,
  filterType = "all",
  searchTerm = "",
}: AdminChatPanelProps) {
  const {
    messages,
    pendingMessages,
    approvedMessages,
    pinnedMessages,
    loading,
    sendMessage,
    pinMessage,
    deleteMessage,
    approveMessage,
    markAsQuestion,
  } = useStreamChat(streamId, chatModeration);

  const [messageInput, setMessageInput] = useState("");
  const [messageType, setMessageType] = useState<MessageType>("message");
  const [sending, setSending] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const baseMessages = [
    ...approvedMessages,
    ...pendingMessages.filter((m) => !approvedMessages.some((a) => a.id === m.id)),
  ];

  const filteredMessages = (filterType === "question"
    ? baseMessages.filter((m) => m.type === "question")
    : baseMessages
  ).filter((msg) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      msg.message.toLowerCase().includes(q) ||
      msg.author_name?.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    if (scrollRef.current && autoScroll) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, autoScroll, filteredMessages.length]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 80);
  };

  const handleSend = async () => {
    if (!messageInput.trim()) return;
    setSending(true);
    try {
      await sendMessage(messageInput, messageType, true);
      setMessageInput("");
      if (inputRef.current) inputRef.current.style.height = "auto";
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleSendShortcut = async (text: string) => {
    setSending(true);
    try {
      await sendMessage(text, messageType, true);
      toast.success(`Sent: "${text}"`);
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {pinnedMessages.length > 0 && (
        <div className="shrink-0 border-b border-amber-500/20 bg-amber-500/5 px-4 py-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
            <Pin className="size-3" />
            Pinned
          </div>
          {pinnedMessages.map((msg) => (
            <div key={msg.id} className="mt-1 flex items-start justify-between gap-2">
              <p className="text-sm">
                <span className="font-medium">{msg.author_name || "Anonymous"}: </span>
                {msg.message}
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 shrink-0"
                onClick={() => pinMessage(msg.id)}
              >
                <PinOff className="size-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-3"
      >
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <MessageCircle className="size-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              {searchTerm || filterType === "question"
                ? "No messages match your filter"
                : "No messages yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredMessages.map((msg, index) => {
              const isPinned = pinnedMessages.some((p) => p.id === msg.id);
              const showDate =
                index === 0 ||
                format(new Date(msg.created_at), "PP") !==
                  format(new Date(filteredMessages[index - 1].created_at), "PP");

              return (
                <div key={msg.id}>
                  {showDate && (
                    <p className="py-3 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground/60">
                      {format(new Date(msg.created_at), "MMMM d, yyyy")}
                    </p>
                  )}
                  <div
                    className={cn(
                      "group flex gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50",
                      msg.type === "announcement" && "bg-amber-500/5",
                      isPinned && "bg-amber-500/5",
                    )}
                  >
                    <Avatar className="size-8 shrink-0">
                      {msg.author_avatar && (
                        <AvatarImage src={msg.author_avatar} alt={msg.author_name || ""} />
                      )}
                      <AvatarFallback className="text-[10px]">
                        {initials(msg.author_name ?? null)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="break-words text-sm font-medium">
                          {msg.author_name || "Anonymous"}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </span>
                        {msg.type === "announcement" && (
                          <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                            Announcement
                          </span>
                        )}
                        {msg.type === "question" && (
                          <span className="rounded bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-400">
                            Question
                          </span>
                        )}
                        {!msg.is_approved && (
                          <span className="rounded bg-orange-500/15 px-1.5 py-0.5 text-[10px] font-medium text-orange-600">
                            Pending
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap break-words">
                        {msg.message}
                      </p>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 shrink-0 opacity-0 group-hover:opacity-100"
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => pinMessage(msg.id)}>
                          {isPinned ? (
                            <>
                              <PinOff className="mr-2 size-3.5" /> Unpin
                            </>
                          ) : (
                            <>
                              <Pin className="mr-2 size-3.5" /> Pin
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            navigator.clipboard.writeText(msg.message);
                            toast.success("Copied");
                          }}
                        >
                          <Copy className="mr-2 size-3.5" /> Copy
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => markAsQuestion(msg.id)}>
                          <AlertCircle className="mr-2 size-3.5" /> Mark question
                        </DropdownMenuItem>
                        {!msg.is_approved && (
                          <DropdownMenuItem onClick={() => approveMessage(msg.id)}>
                            <CheckCircle className="mr-2 size-3.5" /> Approve
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            if (confirm("Delete this message?")) deleteMessage(msg.id);
                          }}
                        >
                          <Trash2 className="mr-2 size-3.5" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!autoScroll && (
        <div className="relative shrink-0">
          <Button
            size="sm"
            variant="secondary"
            className="absolute -top-10 left-1/2 -translate-x-1/2 rounded-full shadow-md"
            onClick={() => {
              setAutoScroll(true);
              scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
            }}
          >
            <ArrowDown className="mr-1 size-3.5" />
            New messages
          </Button>
        </div>
      )}

      <div className="shrink-0 border-t border-border/60 bg-card p-3">
        <div className="mb-2 flex gap-1">
          {(
            [
              { value: "message" as const, icon: MessageCircle, label: "Message" },
              { value: "announcement" as const, icon: Megaphone, label: "Announce" },
              { value: "system" as const, icon: Bell, label: "System" },
            ] as const
          ).map(({ value, icon: Icon, label }) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={messageType === value ? "secondary" : "ghost"}
              className="h-7 gap-1 px-2 text-xs"
              onClick={() => setMessageType(value)}
            >
              <Icon className="size-3" />
              {label}
            </Button>
          ))}
        </div>

        <div className="mb-2.5 flex flex-wrap gap-1.5">
          {SHORTCUT_MESSAGES.map((msg, i) => (
            <Button
              key={msg}
              id={`chat-shortcut-${i}`}
              type="button"
              variant="outline"
              size="sm"
              className="h-6 rounded-full px-2.5 text-[10px] font-medium text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground hover:scale-105 active:scale-95"
              onClick={() => handleSendShortcut(msg)}
              disabled={sending}
            >
              {msg}
            </Button>
          ))}
        </div>

        <div className="flex gap-2">
          <Textarea
            ref={inputRef}
            placeholder={
              messageType === "announcement"
                ? "Write an announcement…"
                : "Message viewers…"
            }
            value={messageInput}
            onChange={(e) => {
              setMessageInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={sending}
            rows={1}
            className="min-h-9 max-h-[100px] resize-none"
          />
          <Button
            size="icon"
            className="size-9 shrink-0"
            disabled={sending || !messageInput.trim()}
            onClick={handleSend}
          >
            {sending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
