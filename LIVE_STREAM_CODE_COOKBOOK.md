# 📖 LMS Live Stream - Complete Code Cookbook

## Table of Contents

1. Student Live Stream Page
2. Admin Live Chat Monitor
3. Custom Implementations
4. API Handlers
5. React Hooks
6. Component Examples

---

## 1️⃣ Student Live Stream Page

### File: `src/app/(dashboard)/live/[courseId]/page.tsx`

```typescript
import { notFound } from "next/navigation"
import { LiveStreamRoom } from "@/features/live-stream/components/live-stream-room"

type PageProps = {
  params: Promise<{ courseId: string }>
}

/**
 * Student Live Stream Page
 * Route: /dashboard/live/[courseId]
 *
 * Features:
 * - Video player (YouTube embed)
 * - Real-time chat powered by Supabase Realtime
 * - Enrollment verification
 * - Enterprise dashboard UI
 */
export default async function LiveStreamPage({ params }: PageProps) {
  const { courseId } = await params

  if (!courseId) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Page container */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Live Class</h1>
          <p className="text-muted-foreground">
            Watch the live stream and chat with classmates in real-time.
          </p>
        </div>

        {/* Live stream room with video player and chat */}
        <LiveStreamRoom courseId={courseId} courseName="" />

        {/* Course Info Section */}
        <div className="mt-12 space-y-6">
          <div>
            <h2 className="text-xl font-semibold">About This Class</h2>
            <p className="mt-2 text-muted-foreground">
              Live classes are interactive sessions where you can watch the instructor
              and chat with your classmates in real-time.
              Messages are visible to all enrolled students.
            </p>
          </div>

          <div className="rounded-lg border border-border/60 bg-muted/20 p-6">
            <h3 className="font-semibold">Tips for Best Experience</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>✓ Use a stable internet connection for smooth streaming</li>
              <li>✓ Enable notifications to get alerted when a live class starts</li>
              <li>✓ Keep chat respectful and focused on the course content</li>
              <li>✓ Messages are logged and moderated by instructors</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

## 2️⃣ Admin Live Chat Monitor

### File: `src/app/admin/live-streams/[streamId]/chat/page.tsx`

```typescript
import { AdminPageShell } from "@/features/admin/components/admin-page-shell"
import { LiveChatAdminPage } from "@/features/live-stream/components/live-chat-admin-page"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { IconArrowLeft } from "@tabler/icons-react"

type PageProps = {
  params: Promise<{ streamId: string }>
}

export default async function AdminLiveChatRoute({ params }: PageProps) {
  const { streamId } = await params

  return (
    <AdminPageShell
      title="Live Chat"
      description="Manage your live stream broadcast and monitor the real-time chat."
      headerAction={
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/live-streams">
            <IconArrowLeft data-icon="inline-start" />
            Back to streams
          </Link>
        </Button>
      }
    >
      <LiveChatAdminPage streamId={streamId} />
    </AdminPageShell>
  )
}
```

---

## 3️⃣ Main Student Component

### File: `src/features/live-stream/components/live-stream-room.tsx`

```typescript
"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { LiveChatPanel } from "@/components/live/live-chat-panel"
import { LiveVideoPanel } from "@/components/live/live-video-panel"
import { useChatMessages } from "@/hooks/live/use-chat-messages"
import { useLiveStream } from "@/hooks/live/use-live-stream"
import { useSendMessage } from "@/hooks/live/use-send-message"
import { IconBroadcast, IconMessages } from "@tabler/icons-react"
import { toast } from "sonner"

type LiveStreamRoomProps = {
  courseId: string
  courseName: string
}

export function LiveStreamRoom({ courseId, courseName }: LiveStreamRoomProps) {
  const { currentStream, initialMessages, isLoading, error } =
    useLiveStream(courseId)
  const { messages } = useChatMessages(
    currentStream?.id ?? null,
    initialMessages,
  )
  const { sendMessage, isSending } = useSendMessage()
  const [inputMessage, setInputMessage] = React.useState("")

  const canChat = Boolean(currentStream && currentStream.status === "live")

  const handleSubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (!currentStream || !canChat || !inputMessage.trim()) {
        return
      }

      try {
        await sendMessage({
          streamId: currentStream.id,
          message: inputMessage.trim(),
        })
        setInputMessage("")
      } catch (sendError) {
        toast.error(
          sendError instanceof Error
            ? sendError.message
            : "Failed to send message",
        )
      }
    },
    [canChat, currentStream, inputMessage, sendMessage],
  )

  if (isLoading) {
    return (
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <Skeleton className="aspect-video w-full rounded-3xl" />
          <Skeleton className="h-28 w-full rounded-3xl" />
        </div>
        <Skeleton className="min-h-[540px] w-full rounded-3xl" />
      </div>
    )
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
    )
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
    )
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
  )
}
```

---

## 4️⃣ Video Player Component

### File: `src/components/live/live-video-panel.tsx`

```typescript
"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  buildYoutubeEmbedUrl,
  formatLiveDateTime,
} from "@/features/live-stream/lib"
import type { LiveStreamSummary } from "@/features/live-stream/types"
import { IconBroadcast, IconPlayerPauseFilled } from "@tabler/icons-react"

type LiveVideoPanelProps = {
  stream: LiveStreamSummary
  courseName: string
}

export function LiveVideoPanel({ stream, courseName }: LiveVideoPanelProps) {
  const isLive = stream.status === "live"

  return (
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <CardHeader className="space-y-3 border-b border-border/60 bg-muted/20">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={isLive ? "destructive" : "outline"}
            className="rounded-full px-2.5 py-0.5 uppercase tracking-[0.18em]"
          >
            {isLive ? "Live" : "Ended"}
          </Badge>
          <Badge variant="secondary" className="rounded-full px-2.5 py-0.5">
            {courseName}
          </Badge>
        </div>
        <div className="space-y-1">
          <CardTitle className="text-xl leading-tight md:text-2xl">
            {stream.title}
          </CardTitle>
          <CardDescription>
            {isLive
              ? "The broadcast is live now. Students can watch and chat in real time."
              : `This stream ended at ${formatLiveDateTime(stream.endedAt || stream.startedAt)}`}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {stream.ytVideoId ? (
          <div className="relative aspect-video bg-black">
            <iframe
              className="absolute inset-0 size-full"
              src={buildYoutubeEmbedUrl(stream.ytVideoId)}
              title={stream.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
            <div className="pointer-events-none absolute left-3 top-3">
              <Badge
                variant={isLive ? "destructive" : "secondary"}
                className="rounded-full px-2.5 py-0.5 shadow-sm"
              >
                {isLive ? (
                  <>
                    <IconBroadcast data-icon="inline-start" />
                    Live
                  </>
                ) : (
                  <>
                    <IconPlayerPauseFilled data-icon="inline-start" />
                    Stream ended
                  </>
                )}
              </Badge>
            </div>
          </div>
        ) : (
          <div className="flex aspect-video items-center justify-center bg-muted/30 px-6 text-center">
            <div className="max-w-sm space-y-3">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-border/70">
                <IconBroadcast />
              </div>
              <p className="text-sm font-medium">
                No YouTube video is attached to this stream yet.
              </p>
              <p className="text-sm text-muted-foreground">
                Add a YouTube Live URL or video ID in the admin panel, then
                start the stream.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

---

## 5️⃣ Chat Panel Component

### File: `src/components/live/live-chat-panel.tsx`

```typescript
"use client"

import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { formatLiveTime, getInitials } from "@/features/live-stream/lib"
import type {
  LiveChatMessage,
  LiveStreamStatus,
} from "@/features/live-stream/types"
import {
  IconClock,
  IconMessageCircle,
  IconMoodSmile,
  IconSend2,
} from "@tabler/icons-react"

type LiveChatPanelProps = {
  streamId: string | null
  streamStatus: LiveStreamStatus | null
  messages: LiveChatMessage[]
  inputMessage: string
  onInputMessageChange: (value: string) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  isSending: boolean
  disabled: boolean
}

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
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const isEnded = streamStatus === "ended"

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
                      <AvatarFallback className="bg-muted text-xs font-semibold">
                        {getInitials(message.userName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <p className="text-sm font-semibold">
                          {message.userName}
                        </p>
                        <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <IconClock size={10} />
                          {formatLiveTime(message.createdAt)}
                        </p>
                      </div>
                      <p className="mt-1 break-words text-sm leading-relaxed">
                        {message.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <Empty className="py-12">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <IconMessageCircle size={32} />
                  </EmptyMedia>
                  <EmptyTitle>No messages yet</EmptyTitle>
                  <EmptyDescription>
                    Be the first to start the discussion!
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>

      {/* Message Input */}
      <div className="border-t border-border/60 bg-muted/10 p-4">
        {isEnded ? (
          <div className="rounded-lg border border-border/60 bg-muted/50 px-4 py-3 text-center text-sm text-muted-foreground">
            Stream has ended. Chat is read-only.
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex gap-2">
            <Input
              placeholder="Type your message..."
              value={inputMessage}
              onChange={(e) => onInputMessageChange(e.target.value)}
              disabled={disabled || isSending}
              className="min-h-10"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!inputMessage.trim() || disabled || isSending}
              className="gap-2 px-3"
            >
              {isSending ? (
                <IconMoodSmile size={18} className="animate-spin" />
              ) : (
                <IconSend2 size={18} />
              )}
            </Button>
          </form>
        )}
      </div>
    </Card>
  )
}
```

---

## 6️⃣ Core Hooks

### Hook: `useLiveStream`

```typescript
// File: src/hooks/live/use-live-stream.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import type { LiveStreamPayload } from "@/features/live-stream/types";

async function fetchLiveStream(courseId: string): Promise<LiveStreamPayload> {
  const response = await fetch(
    `/api/student/live-stream?courseId=${encodeURIComponent(courseId)}`,
    {
      credentials: "include",
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(payload?.error || `Request failed (${response.status})`);
  }

  return response.json() as Promise<LiveStreamPayload>;
}

export function useLiveStream(courseId: string) {
  const query = useQuery({
    queryKey: ["live-stream", courseId],
    enabled: Boolean(courseId),
    queryFn: () => fetchLiveStream(courseId),
  });

  return {
    ...query,
    currentStream: query.data?.currentStream ?? null,
    initialMessages: query.data?.messages ?? [],
  };
}
```

### Hook: `useChatMessages`

```typescript
// File: src/hooks/live/use-chat-messages.ts
"use client";

import * as React from "react";
import { createClient } from "@/utils/supabase/client";
import type { LiveChatMessage } from "@/features/live-stream/types";

type UserProfile = {
  name: string | null;
  avatar: string | null;
};

function mapChatMessage(
  payload: Record<string, unknown>,
  profile: UserProfile | null,
): LiveChatMessage | null {
  const id = String(payload.id ?? "");
  const liveStreamId = String(payload.live_stream_id ?? "");
  const userId = String(payload.user_id ?? "");
  const message = String(payload.message ?? "");
  const createdAt = String(payload.created_at ?? "");

  if (!id || !liveStreamId || !userId || !message || !createdAt) {
    return null;
  }

  return {
    id,
    liveStreamId,
    userId,
    userName: profile?.name?.trim() || "Anonymous",
    userAvatar: profile?.avatar ?? null,
    message,
    createdAt,
  };
}

export function useChatMessages(
  streamId: string | null,
  initialMessages: LiveChatMessage[] = [],
) {
  const [messages, setMessages] =
    React.useState<LiveChatMessage[]>(initialMessages);

  React.useEffect(() => {
    setMessages(initialMessages);
  }, [streamId, initialMessages]);

  React.useEffect(() => {
    if (!streamId) {
      return;
    }

    const supabase = createClient();
    const channel = supabase
      .channel(`live-chat-${streamId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `live_stream_id=eq.${streamId}`,
        },
        async (payload) => {
          const nextMessage = payload.new as Record<string, unknown>;
          const userId = String(nextMessage.user_id ?? "");

          const { data: profile } = await supabase
            .from("users")
            .select("name, avatar")
            .eq("id", userId)
            .maybeSingle();

          const chatMessage = mapChatMessage(nextMessage, profile ?? null);
          if (!chatMessage) {
            return;
          }

          setMessages((current) => {
            if (current.some((message) => message.id === chatMessage.id)) {
              return current;
            }

            return [...current, chatMessage];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId]);

  return { messages, setMessages };
}
```

### Hook: `useSendMessage`

```typescript
// File: src/hooks/live/use-send-message.ts
"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import type { LiveChatMessage } from "@/features/live-stream/types";

type SendMessageInput = {
  streamId: string;
  message: string;
};

async function sendChatMessage(
  payload: SendMessageInput,
): Promise<LiveChatMessage> {
  const response = await fetch("/api/student/live-stream", {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(data?.error || `Request failed (${response.status})`);
  }

  const data = (await response.json()) as { chatMessage: LiveChatMessage };
  return data.chatMessage;
}

export function useSendMessage() {
  const lastSentAtRef = React.useRef(0);

  const mutation = useMutation({
    mutationFn: async (payload: SendMessageInput) => {
      const now = Date.now();
      if (now - lastSentAtRef.current < 900) {
        throw new Error("You're sending messages too quickly.");
      }

      lastSentAtRef.current = now;
      return sendChatMessage(payload);
    },
  });

  return {
    sendMessage: mutation.mutateAsync,
    isSending: mutation.isPending,
  };
}
```

---

## 7️⃣ API Endpoint

### Endpoint: `POST /api/student/live-stream`

```typescript
// File: src/app/api/student/live-stream/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { streamId, message } = body;

  if (!streamId || !message?.trim()) {
    return NextResponse.json(
      { error: "Stream ID and message are required." },
      { status: 400 },
    );
  }

  // Verify the stream exists and is live
  const { data: stream } = await supabase
    .from("live_streams")
    .select("id, course_id, status")
    .eq("id", streamId)
    .maybeSingle();

  if (!stream || stream.status !== "live") {
    return NextResponse.json(
      { error: "Stream is not currently live." },
      { status: 400 },
    );
  }

  // Check enrollment
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", stream.course_id)
    .eq("status", "active")
    .maybeSingle();

  if (!enrollment) {
    return NextResponse.json(
      { error: "You are not enrolled in this course." },
      { status: 403 },
    );
  }

  // Insert message
  const { data: chatMsg, error: insertError } = await supabase
    .from("chat_messages")
    .insert({
      live_stream_id: streamId,
      user_id: user.id,
      message: message.trim(),
    })
    .select("id, message, created_at")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Get user profile for response
  const { data: profile } = await supabase
    .from("users")
    .select("name, avatar")
    .eq("id", user.id)
    .maybeSingle();

  return NextResponse.json({
    success: true,
    chatMessage: {
      id: chatMsg.id,
      liveStreamId: streamId,
      message: chatMsg.message,
      createdAt: chatMsg.created_at,
      userId: user.id,
      userName: profile?.name ?? "Anonymous",
      userAvatar: profile?.avatar ?? null,
    },
  });
}
```

---

## 8️⃣ Utility Functions

### File: `src/features/live-stream/lib.ts`

```typescript
const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

export function extractYoutubeVideoId(input: string) {
  const value = input.trim();

  if (!value) {
    return "";
  }

  if (YOUTUBE_ID_PATTERN.test(value)) {
    return value;
  }

  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      return url.pathname.replace("/", "").slice(0, 11);
    }

    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      const embedMatch = url.pathname.match(
        /\/(embed|shorts|live)\/([a-zA-Z0-9_-]{11})/,
      );
      if (embedMatch?.[2]) {
        return embedMatch[2];
      }

      const searchId = url.searchParams.get("v");
      if (searchId && YOUTUBE_ID_PATTERN.test(searchId)) {
        return searchId;
      }
    }
  } catch {
    return "";
  }

  const fallbackMatch = value.match(/([a-zA-Z0-9_-]{11})/);
  return fallbackMatch?.[1] ?? "";
}

export function buildYoutubeEmbedUrl(videoId: string) {
  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&controls=1&iv_load_policy=3&disablekb=0`;
}

export function formatLiveDateTime(value: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatLiveTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function getInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U"
  );
}
```

---

## 🎯 TypeScript Types

### File: `src/features/live-stream/types.ts`

```typescript
export type LiveStreamStatus = "live" | "ended";

export type LiveStreamCourseOption = {
  id: string;
  name: string;
  slug: string | null;
};

export type LiveStreamSummary = {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  ytVideoId: string | null;
  status: LiveStreamStatus;
  startedAt: string | null;
  endedAt: string | null;
};

export type LiveChatMessage = {
  id: string;
  liveStreamId: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  message: string;
  createdAt: string;
};

export type LiveStreamPayload = {
  currentStream: LiveStreamSummary | null;
  messages: LiveChatMessage[];
};

export type LiveStreamAdminItem = LiveStreamSummary & {
  courseSlug: string | null;
};
```

---

**Code Cookbook Version**: 1.0
**Last Updated**: May 2026
**Total Files Shown**: 8 complete implementations
