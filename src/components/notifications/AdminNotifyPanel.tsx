'use client';

import { useState } from 'react';
import { Button }   from '@/components/ui/button';
import { Input }    from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label }    from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { IconSend, IconPhoto, IconLink, IconUsers } from '@tabler/icons-react';
import { createClient } from '@/utils/supabase/client';

const QUICK_ROUTES = [
  { label: 'Dashboard',    value: '/dashboard' },
  { label: 'All Courses',  value: '/courses' },
  { label: 'Live Streams', value: '/live' },
];

export default function AdminNotifyPanel() {
  const [title,     setTitle]     = useState('');
  const [body,      setBody]      = useState('');
  const [imageUrl,  setImageUrl]  = useState('');
  const [route,     setRoute]     = useState('');
  const [videoId,   setVideoId]   = useState('');
  const [sending,   setSending]   = useState(false);
  const [preview,   setPreview]   = useState<string | null>(null);

  const supabase = createClient();

  // Auto-fill YouTube thumbnail from video ID
  function applyVideoId() {
    if (!videoId.trim()) return;
    const thumb = `https://img.youtube.com/vi/${videoId.trim()}/maxresdefault.jpg`;
    setImageUrl(thumb);
    setPreview(thumb);
  }

  async function handleSend() {
    if (!title.trim() || !body.trim()) {
      toast.error('Title and body are required');
      return;
    }

    setSending(true);
    try {
      // Use Supabase service role key for admin operations
      // Insert notification with user_id = null for broadcast
      const { error: notifError } = await (supabase as any)
        .from('notifications')
        .insert({
          user_id:   null,
          title:     title.trim(),
          body:      body.trim(),
          image_url: imageUrl.trim() || null,
          route:     route.trim()    || null,
          type:      'custom_admin',
          source_id: null,
        });

      if (notifError) throw notifError;

      // Send FCM push to all users via API route
      await fetch('/api/notifications/send-push', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:    title.trim(),
          body:     body.trim(),
          imageUrl: imageUrl.trim() || undefined,
          route:    route.trim()    || undefined,
        }),
      });

      toast.success('Notification sent to all users!');
      setTitle('');
      setBody('');
      setImageUrl('');
      setRoute('');
      setVideoId('');
      setPreview(null);
    } catch (err) {
      toast.error('Failed to send notification. Check console.');
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <IconUsers className="size-4 text-emerald-500" />
          Send Notification to All Users
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor="notif-title">Title *</Label>
          <Input
            id="notif-title"
            placeholder="e.g. New React Native Course — Enroll Now!"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
          />
          <p className="text-xs text-muted-foreground text-right">{title.length}/100</p>
        </div>

        {/* Body */}
        <div className="space-y-1.5">
          <Label htmlFor="notif-body">Message *</Label>
          <Textarea
            id="notif-body"
            placeholder="e.g. We've added 12 new lectures covering hooks, navigation, and deployment..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            maxLength={250}
          />
          <p className="text-xs text-muted-foreground text-right">{body.length}/250</p>
        </div>

        {/* YouTube Video ID → auto thumbnail */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <IconPhoto className="size-3.5" />
            YouTube Video Thumbnail (optional)
          </Label>
          <div className="flex gap-2">
            <Input
              placeholder="YouTube Video ID (e.g. dQw4w9WgXcQ)"
              value={videoId}
              onChange={(e) => setVideoId(e.target.value)}
            />
            <Button variant="outline" size="sm" onClick={applyVideoId} type="button">
              Use Thumbnail
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Or paste a direct image URL below:</p>
          <Input
            placeholder="https://... (image URL)"
            value={imageUrl}
            onChange={(e) => {
              setImageUrl(e.target.value);
              setPreview(e.target.value || null);
            }}
          />
        </div>

        {/* Thumbnail preview */}
        {preview && (
          <div className="rounded-lg overflow-hidden border w-full aspect-video max-h-40">
            <img
              src={preview}
              alt="Notification thumbnail preview"
              className="w-full h-full object-cover"
              onError={() => setPreview(null)}
            />
          </div>
        )}

        {/* Deep-link route */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <IconLink className="size-3.5" />
            Deep Link Route (optional)
          </Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {QUICK_ROUTES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRoute(r.value)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  route === r.value
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'hover:border-emerald-500 hover:text-emerald-500'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <Input
            placeholder="/courses/[id]  or  /live/[streamId]"
            value={route}
            onChange={(e) => setRoute(e.target.value)}
          />
        </div>

        {/* Preview card */}
        {(title || body) && (
          <div className="border rounded-lg p-3 bg-muted/30 space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Preview
            </p>
            <div className="flex gap-2">
              {preview && (
                <img
                  src={preview}
                  alt=""
                  className="w-12 h-9 rounded object-cover flex-shrink-0"
                />
              )}
              <div>
                <p className="text-sm font-medium">{title || '—'}</p>
                <p className="text-xs text-muted-foreground">{body || '—'}</p>
              </div>
            </div>
          </div>
        )}

        <Button
          onClick={handleSend}
          disabled={sending || !title.trim() || !body.trim()}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white gap-2"
        >
          <IconSend className="size-4" />
          {sending ? 'Sending…' : 'Send to All Users'}
        </Button>
      </CardContent>
    </Card>
  );
}
