# 🚀 LMS Live Stream - Quick Reference Guide

## System Overview

```
Student Page: /dashboard/live/[courseId]
  └─ Video (70%) + Chat (30%)
  └─ Real-time via Supabase Realtime
  └─ Enrollment verified

Admin Chat: /admin/live-streams/[streamId]/chat
  └─ Stream selector
  └─ Real-time message feed
  └─ Delete capability
```

---

## 🔗 File Map

### Student Flow

```
Student accesses: /dashboard/live/[courseId]
    ↓
page.tsx (renders LiveStreamRoom)
    ↓
LiveStreamRoom component:
  - Calls useLiveStream(courseId)
  - Calls useChatMessages(streamId, initialMessages)
  - Calls useSendMessage()
    ↓
API calls:
  - GET /api/student/live-stream?courseId=...
  - POST /api/student/live-stream (send message)
    ↓
Renders:
  - LiveVideoPanel (YouTube embed)
  - LiveChatPanel (chat UI)
```

### Admin Flow

```
Admin accesses: /admin/live-streams/[streamId]/chat
    ↓
page.tsx (renders LiveChatAdminPage)
    ↓
LiveChatAdminPage component:
  - Calls useAdminLiveStream(streamId)
  - Calls useChatMessages(streamId, initialMessages)
  - Calls useSendAdminMessage()
    ↓
API calls:
  - GET /api/admin/live-streams
  - GET /api/admin/live-chat
  - POST /api/student/live-stream (send message)
    ↓
Renders:
  - Stream selector
  - Chat panel with messages
```

---

## 🎯 Core Hooks

### `useLiveStream(courseId)`

```typescript
import { useLiveStream } from "@/hooks/live/use-live-stream";

const { currentStream, initialMessages, isLoading, error } =
  useLiveStream("course-id");

// currentStream: { id, title, courseName, ytVideoId, status, startedAt, endedAt }
// initialMessages: LiveChatMessage[]
// isLoading: boolean
// error: Error | null
```

### `useChatMessages(streamId, initialMessages)`

```typescript
import { useChatMessages } from "@/hooks/live/use-chat-messages";

const { messages, setMessages } = useChatMessages("stream-id", initialMessages);

// messages: LiveChatMessage[] (auto-updated via Realtime)
// setMessages: (messages) => void
```

### `useSendMessage()`

```typescript
import { useSendMessage } from "@/hooks/live/use-send-message";

const { sendMessage, isSending } = useSendMessage();

await sendMessage({ streamId: "stream-id", message: "Hello!" });
```

---

## 🎨 UI Components

### `LiveVideoPanel`

```typescript
<LiveVideoPanel
  stream={currentStream}
  courseName="React Fundamentals"
/>
```

### `LiveChatPanel`

```typescript
<LiveChatPanel
  streamId="stream-id"
  streamStatus="live"
  messages={messages}
  inputMessage={inputMessage}
  onInputMessageChange={setInputMessage}
  onSubmit={handleSubmit}
  isSending={isSending}
  disabled={!canChat}
/>
```

---

## 📊 Data Types

### LiveStreamSummary

```typescript
{
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  ytVideoId: string | null;
  status: "live" | "ended";
  startedAt: string | null;
  endedAt: string | null;
}
```

### LiveChatMessage

```typescript
{
  id: string;
  liveStreamId: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  message: string;
  createdAt: string;
}
```

### LiveStreamStatus

```typescript
type LiveStreamStatus = "live" | "ended";
```

---

## 🔧 API Endpoints

### GET /api/student/live-stream

```
Query: courseId (required)
Returns: { currentStream, messages }
Error: 401 Unauthorized, 403 Not Enrolled, 404 Course Not Found
```

### POST /api/student/live-stream

```
Body: { streamId, message }
Returns: { success: true, chatMessage }
Error: 400 Invalid Input, 403 Not Enrolled, 401 Unauthorized
```

### GET /api/admin/live-streams

```
Returns: { liveStreams: [] }
Error: 401 Unauthorized, 403 Not Admin
```

### GET /api/admin/live-chat

```
Returns: { chatMessages: [] }
Error: 401 Unauthorized, 403 Not Admin
```

---

## 🚀 Quick Start

### Add to Existing Page

```typescript
import { LiveStreamRoom } from "@/features/live-stream/components/live-stream-room"

export default function MyPage() {
  return (
    <LiveStreamRoom
      courseId="course-123"
      courseName="My Course"
    />
  )
}
```

### Custom Implementation

```typescript
import { useLiveStream } from "@/hooks/live/use-live-stream"
import { useChatMessages } from "@/hooks/live/use-chat-messages"
import { useSendMessage } from "@/hooks/live/use-send-message"
import { LiveVideoPanel } from "@/components/live/live-video-panel"
import { LiveChatPanel } from "@/components/live/live-chat-panel"

export function MyLiveStream() {
  const { currentStream, initialMessages, isLoading } = useLiveStream("courseId")
  const { messages } = useChatMessages(currentStream?.id ?? null, initialMessages)
  const { sendMessage, isSending } = useSendMessage()
  const [input, setInput] = React.useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentStream) return

    await sendMessage({ streamId: currentStream.id, message: input })
    setInput("")
  }

  if (isLoading) return <LoadingState />
  if (!currentStream) return <NoStreamState />

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2">
        <LiveVideoPanel stream={currentStream} courseName={currentStream.courseName} />
      </div>
      <div>
        <LiveChatPanel
          streamId={currentStream.id}
          streamStatus={currentStream.status}
          messages={messages}
          inputMessage={input}
          onInputMessageChange={setInput}
          onSubmit={handleSubmit}
          isSending={isSending}
          disabled={currentStream.status !== "live"}
        />
      </div>
    </div>
  )
}
```

---

## 🛠️ Debugging Tips

### Check if Realtime Connected

```typescript
const { isSubscribed } = useRealtimeMessages(streamId, onNewMessage);
console.log("Connected:", isSubscribed);
```

### Monitor Messages

```typescript
const { messages } = useChatMessages(streamId, []);
console.log("Total messages:", messages.length);
console.log("Latest:", messages[messages.length - 1]);
```

### Check Stream Status

```typescript
const { currentStream } = useLiveStream(courseId);
console.log("Status:", currentStream?.status);
console.log("Video ID:", currentStream?.ytVideoId);
```

### Test API Endpoint

```typescript
// In browser console
fetch("/api/student/live-stream?courseId=xxx", {
  credentials: "include",
})
  .then((r) => r.json())
  .then(console.log);
```

---

## 📱 Responsive Breakpoints

```
Mobile (< 768px): Stacked layout
Tablet (768px - 1024px): Responsive grid
Desktop (1024px+): 70/30 side-by-side
```

---

## 🎯 Performance Tips

1. **Message Limiting**: Only fetch last 200 messages
2. **Auto-scroll Optimization**: Use `behavior: "smooth"`
3. **Memoization**: Wrap expensive components in React.memo
4. **Rate Limiting**: 900ms between messages (built-in)
5. **Lazy Loading**: Use React.lazy for admin pages

---

## 🔐 Security Notes

- ✅ Enrollment verified server-side
- ✅ Stream status checked before message insert
- ✅ User ID from auth token (not user input)
- ✅ Rate limiting prevents spam
- ✅ Messages sanitized by default

---

## 📖 Code Examples

### Example 1: Add Live Stream Link to Course Page

```typescript
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function CourseCard({ course }) {
  return (
    <div>
      <h2>{course.name}</h2>
      <Link href={`/dashboard/live/${course.id}`}>
        <Button>Go to Live Class</Button>
      </Link>
    </div>
  )
}
```

### Example 2: Display Live Status Badge

```typescript
import { Badge } from "@/components/ui/badge"
import { IconBroadcast } from "@tabler/icons-react"

export function LiveBadge({ stream }) {
  return (
    <Badge variant={stream.status === "live" ? "destructive" : "outline"}>
      {stream.status === "live" && <IconBroadcast />}
      {stream.status === "live" ? "LIVE NOW" : "Ended"}
    </Badge>
  )
}
```

### Example 3: Admin Stream Selector

```typescript
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function StreamSelector({ streams, selected, onSelect }) {
  return (
    <Select value={selected} onValueChange={onSelect}>
      <SelectTrigger>
        <SelectValue placeholder="Select stream" />
      </SelectTrigger>
      <SelectContent>
        {streams.map(stream => (
          <SelectItem key={stream.id} value={stream.id}>
            {stream.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
```

---

## 🚨 Error Handling

### Common Errors

**401 Unauthorized**

- User not logged in
- Session expired
- Solution: Redirect to login

**403 Forbidden**

- User not enrolled
- User not admin
- Solution: Show access denied message

**404 Not Found**

- Course/stream doesn't exist
- Solution: Show not found page

**400 Bad Request**

- Missing required fields
- Invalid stream ID
- Solution: Show validation error

---

## 📞 Support

For issues or questions:

1. Check LIVE_STREAM_SYSTEM_DOCS.md
2. Review LIVE_STREAM_CHECKLIST.md
3. Check browser console for errors
4. Verify API endpoint responses
5. Check Supabase Realtime status

---

**Quick Reference Version**: 1.0
**Last Updated**: May 2026
