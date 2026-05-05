# Live Streaming Feature — Quick Implementation Reference

## 🎯 What's Been Built

### Core Infrastructure (100% Complete)

✅ **Database Schema** — 8 tables with YouTube integration, RLS, indexes
✅ **YouTube OAuth Flow** — Secure token management + auto-refresh
✅ **YouTube Broadcasts API** — Create, go-live, end broadcasts
✅ **Background Jobs** — Chat sync + analytics polling
✅ **Real-Time Hooks** — Supabase subscriptions for live updates
✅ **Query Functions** — Supabase operations for all entities

---

## 📊 Database Tables

| Table                 | Purpose                          | Key Fields                                                       |
| --------------------- | -------------------------------- | ---------------------------------------------------------------- |
| `live_streams`        | Stream metadata + YouTube IDs    | title, status, yt_broadcast_id, concurrent_viewers, peak_viewers |
| `chat_messages`       | Live chat with moderation        | message, type, is_approved, yt_message_id                        |
| `stream_analytics`    | Viewer snapshots (60s intervals) | concurrent_viewers, messages_total                               |
| `stream_polls`        | Live polls                       | question, is_active                                              |
| `stream_poll_options` | Poll answers                     | option_text, position                                            |
| `stream_poll_votes`   | User votes                       | option_id, user_id (nullable for anonymous)                      |

---

## 🔌 API Routes

### OAuth

- `GET  /api/youtube/oauth/authorize` → Google consent screen
- `GET  /api/youtube/oauth/callback` → Exchange code for tokens
- `POST /api/youtube/token/refresh` → Auto-refresh access token
- `DEL  /api/youtube/oauth/disconnect` → Revoke + delete tokens

### Broadcasts

- `POST /api/youtube/broadcasts/create` → Create broadcast + stream
- `POST /api/youtube/broadcasts/go-live` → Start streaming
- `POST /api/youtube/broadcasts/end` → End broadcast
- `GET  /api/youtube/channel` → Fetch channel info

### Sync Jobs (require x-cron-secret header)

- `POST /api/youtube/chat/sync` → Poll YouTube chat, dedupe, insert
- `POST /api/youtube/analytics/sync` → Fetch stats, store snapshots

---

## 🪝 React Hooks

```typescript
// Stream real-time updates
useLiveStream(streamId);

// Dashboard updates
useStreamsDashboard();

// Chat moderation
useStreamChat(streamId);

// Poll voting
useStreamPolls(streamId);

// OAuth state
useYouTubeAuth();
```

---

## 📚 Query Functions

```typescript
// Fetch data
getStreams(status?) → all streams
getStream(streamId) → single stream
getStreamChat(streamId) → messages
getStreamAnalytics(streamId) → snapshots
getStreamPolls(streamId) → polls

// Create/modify
createChatMessage(streamId, message, type)
createPoll(streamId, question, options)
votePoll(optionId, pollId)
getPollResults(pollId)
```

---

## 🛠️ Utility Functions

```typescript
// Token management
getAccessToken() → fresh YouTube access token

// YouTube API
createLiveBroadcast(title, scheduledAt, options)
transitionToLive(broadcastId)
endBroadcast(broadcastId)
getChannelInfo() → name, subscribers, thumbnail
fetchLiveChatMessages(liveChatId, pageToken)
getVideoStatistics(videoId) → viewers, stats
```

---

## 🎨 Next: UI Components to Build

### Pages (5 files)

1. **admin/live-streams/page.tsx** — Dashboard
2. **admin/live-streams/new/page.tsx** — Create wizard
3. **admin/live-streams/[streamId]/page.tsx** — Control center
4. **admin/live-streams/[streamId]/edit/page.tsx** — Edit
5. **admin/live-streams/[streamId]/analytics/page.tsx** — Analytics

### Components (20+ shadcn/ui)

- Stream stats cards, tables, live banner
- Wizard steps (info, YouTube setup, review)
- Chat panel (messages, moderation, pinning)
- Polls (active, closed, voting)
- Stream controls (go-live, end, duplicate)
- Analytics charts (viewer timeline, engagement)
- Encoder details accordion

---

## 🔐 Security Features

✅ Service role key for token storage
✅ Email-based admin verification in RLS
✅ Auto-token refresh with 5-min buffer
✅ Stream key shown as password input
✅ Chat message deduplication
✅ Cron endpoint secret verification
✅ Full RLS policies on all tables

---

## 🚀 Deployment Checklist

- [ ] Set env variables (Google OAuth, Supabase, CRON_SECRET)
- [ ] Run schema migration
- [ ] Test OAuth flow end-to-end
- [ ] Deploy API routes
- [ ] Deploy hooks + utilities
- [ ] Build UI components
- [ ] Configure Vercel cron (or Supabase functions)
  - Chat sync: every 5-30 seconds during stream
  - Analytics sync: every 60 seconds during stream
- [ ] Test in staging
- [ ] Deploy to production

---

## 📖 Documentation

**Full details:** `LIVE_STREAMING_IMPLEMENTATION.md`
**Specification:** `LIVE_STREAM_QUICK_REF.md` (from original request)

---

## 💡 Implementation Notes

- Database schema includes comments on all tables
- API routes are fully commented
- Real-time hooks follow React Query best practices
- YouTube API uses official googleapis library
- Chat deduplicat via `yt_message_id`
- All endpoints validated + error handled

**Status:** 🟢 Ready for UI component development
