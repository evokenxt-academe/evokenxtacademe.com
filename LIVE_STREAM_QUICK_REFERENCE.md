# Live Streaming Feature - Quick Reference

## 🚀 Quick Start

### Access the Live Streams Dashboard
```
/admin/live-streams/
```

### Create a New Stream
```
Click "Create Stream" → Fill 3-step wizard → Authorize YouTube → Done
```

### Go Live
```
1. Stream status: scheduled
2. Click "Go Live Now" button
3. Start encoder with RTMP URL and stream key
4. Stream transitions to "live" status
5. Chat/Polls/Questions tabs active
```

---

## 📂 File Structure Cheat Sheet

```
src/app/admin/live-streams/
├── page.tsx                    # Dashboard (list all streams)
├── new/page.tsx               # Create wizard (3 steps)
└── [streamId]/
    ├── page.tsx               # Control center (embed + encoder + chat)
    ├── edit/page.tsx          # Edit stream details
    └── analytics/page.tsx     # Post-stream charts + metrics

src/components/live-streams/
├── StreamStatsCard.tsx        # Metric display
├── StreamStatusHeader.tsx     # Status badge + countdown
├── YouTubeEmbed.tsx          # YouTube iframe
├── LiveNowBanner.tsx         # Live now highlight
├── StreamTable.tsx           # Stream table with actions
├── chat/ChatPanel.tsx        # Live chat
├── polls/PollsPanel.tsx      # Polls
└── questions/QuestionsPanel.tsx  # Q&A

src/hooks/
├── useLiveStream.ts          # Stream data + realtime
├── useStreamChat.ts          # Chat management
├── useStreamPolls.ts         # Polls management
└── useStreamQuestions.ts     # Questions filtering

src/app/api/
├── youtube/                  # YouTube integration
│   ├── authorize/            # OAuth redirect
│   ├── callback/             # OAuth callback
│   ├── refresh/              # Token refresh
│   ├── disconnect/           # Disconnect account
│   ├── broadcasts/
│   │   ├── create/           # Create broadcast
│   │   ├── go-live/          # Start streaming
│   │   └── end/              # End stream
│   ├── channel/              # Get channel info
│   ├── analytics/sync/       # Fetch YouTube stats
│   └── chat/sync/            # Sync YouTube chat
├── cron/stream-analytics/    # Background sync job
└── live-streams/[streamId]/duplicate/  # Copy stream
```

---

## 🔌 Hook Usage Examples

### Fetch Stream with Real-Time Updates
```typescript
import { useLiveStream } from '@/hooks/useLiveStream';

const { stream, loading } = useLiveStream(streamId);
```

### Send Chat Message
```typescript
import { useStreamChat } from '@/hooks/useStreamChat';

const { messages, sendMessage, pinMessage, deleteMessage } = useStreamChat(streamId);

// Send message
await sendMessage("Hello students!", "message");

// Pin message
await pinMessage(messageId);

// Delete message
await deleteMessage(messageId);
```

### Create and Vote on Polls
```typescript
import { useStreamPolls } from '@/hooks/useStreamPolls';

const { polls, activePoll, createPoll, votePoll, closePoll } = useStreamPolls(streamId);

// Create poll
await createPoll("What's your favorite topic?", ["Option 1", "Option 2"], false);

// Vote
await votePoll(pollId, optionId);

// Close poll
await closePoll(pollId);
```

### Get and Mark Questions
```typescript
import { useStreamQuestions } from '@/hooks/useStreamQuestions';

const { questions, unansweredCount, markAnswered, pinQuestion } = useStreamQuestions(streamId);

// Mark as answered
await markAnswered(questionId);

// Pin question
await pinQuestion(questionId);
```

---

## 🔄 Real-Time Subscription Pattern

All data updates automatically via Supabase subscriptions:

```typescript
// When new message sent:
INSERT chat_messages → ChatPanel updates immediately

// When poll vote received:
INSERT stream_poll_votes → Vote count updates immediately

// When question marked answered:
UPDATE chat_messages (is_answered=true) → QuestionsPanel updates immediately

// When YouTube viewer count changes:
stream_analytics row created → Analytics chart updates on page refresh
```

---

## 📝 Common Tasks

### Add a New Stat Card to Analytics
```typescript
<StreamStatsCard 
  label="My Metric" 
  value={metricValue} 
  trend="up"  // or "down"
/>
```

### Change Chart Color
```typescript
// In analytics/page.tsx
<Line 
  dataKey="viewers" 
  stroke="#3b82f6"  // Change this color
/>
```

### Add New Message Type
```typescript
// In schema:
// type enum: 'message' | 'announcement' | 'system' | 'question' | 'your-type'

// In ChatPanel:
type === 'your-type' && <Badge className="bg-purple-600">YOUR TYPE</Badge>
```

### Update Stream Status
```typescript
const { error } = await supabase
  .from('live_streams')
  .update({ status: 'cancelled' })
  .eq('id', streamId);
```

---

## 🧪 Testing

### Test Chat in Development
```typescript
// In browser console:
// Call useStreamChat hook, then:
await sendMessage("Test message", "message");
```

### Test Cron Job Manually
```bash
curl -X POST https://your-app.com/api/cron/stream-analytics \
  -H "x-cron-secret: YOUR_CRON_SECRET"
```

### View Real-Time Subscriptions
```typescript
// In browser DevTools > Network:
// Look for WebSocket connections to supabase
// Should see realtime channel subscriptions
```

---

## 🔧 Configuration

### Change Cron Frequency
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/stream-analytics",
      "schedule": "*/1 * * * *"  // Change this (cron syntax)
    }
  ]
}
```

### Change Chart Colors
```typescript
// Analytics page
<Line stroke="#your-color" />
<Bar fill="#your-color" />
```

### Modify Stream Validation
```typescript
// Edit page or Create page
if (!title.trim()) {
  toast.error('Title is required');
  return;
}
// Add more validation here
```

---

## 📋 API Response Examples

### Create Broadcast Response
```json
{
  "success": true,
  "streamId": "uuid-xxx",
  "broadcastId": "youtube-broadcast-id",
  "streamId": "youtube-stream-id",
  "rtmpUrl": "rtmps://a.rtmp.youtube.com/live2",
  "streamKey": "your-stream-key"
}
```

### Analytics Sync Response
```json
{
  "success": true,
  "results": {
    "streamsProcessed": 3,
    "analyticsUpdated": 3,
    "chatSynced": 3,
    "errors": []
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Duplicate Stream Response
```json
{
  "success": true,
  "streamId": "new-uuid-xxx",
  "message": "Stream duplicated successfully"
}
```

---

## 🚨 Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `YouTube OAuth failed` | Invalid Client ID | Check Google Cloud Console |
| `Real-time not updating` | Auth token expired | Re-authenticate |
| `Charts not showing` | No analytics data | Run cron job or wait 60s |
| `Stream key empty` | Broadcast not created | Create broadcast first |
| `Can't edit stream` | Stream is live/ended | Wait for stream to end |
| `Duplicate failed` | Missing stream ID | Check URL params |

---

## 📊 Database Queries

### Get All Ended Streams
```sql
SELECT * FROM live_streams WHERE status = 'ended' ORDER BY ended_at DESC;
```

### Get Chat Messages with Author
```sql
SELECT cm.*, u.email FROM chat_messages cm
LEFT JOIN auth.users u ON cm.user_id = u.id
WHERE cm.live_stream_id = 'xxx'
ORDER BY cm.created_at DESC;
```

### Get Poll Results
```sql
SELECT po.*, COUNT(spv.id) as votes FROM stream_poll_options po
LEFT JOIN stream_poll_votes spv ON po.id = spv.option_id
WHERE po.poll_id = 'xxx'
GROUP BY po.id;
```

---

## 📞 Support

For issues, check:
1. Browser console for JavaScript errors
2. Network tab for API failures
3. Database logs for query errors
4. Vercel logs for cron job issues
5. Supabase dashboard for real-time subscriptions

---

**Quick Reference v3.0** ✅
