"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { LiveStreamRow } from "@/types/live-stream";

type YouTubeControlsProps = {
  stream: LiveStreamRow;
  onBroadcastCreated: () => void;
};

export function YouTubeControls({ stream, onBroadcastCreated }: YouTubeControlsProps) {
  const [creating, setCreating] = useState(false);
  const [ytError, setYtError] = useState<string | null>(null);
  const [ytConnected, setYtConnected] = useState<boolean | null>(null);
  const autoAttempted = useRef(false);

  const handleCreateBroadcast = useCallback(
    async (silent = false) => {
      if (stream.yt_broadcast_id) return;

      setCreating(true);
      setYtError(null);
      try {
        const res = await fetch("/api/youtube/broadcasts/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ streamId: stream.id }),
        });
        const data = await res.json();
        if (!res.ok) {
          setYtError(data.error ?? `Error ${res.status}`);
          if (!silent) toast.error(data.error ?? "Failed to create broadcast");
          return;
        }
        if (!silent) toast.success("YouTube broadcast ready");
        onBroadcastCreated();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to create broadcast";
        setYtError(msg);
        if (!silent) toast.error(msg);
      } finally {
        setCreating(false);
      }
    },
    [stream.id, stream.yt_broadcast_id, onBroadcastCreated],
  );

  useEffect(() => {
    fetch("/api/youtube/status")
      .then((r) => r.json())
      .then((d) => setYtConnected(d.connected && !d.expired && !d.needsReauth))
      .catch(() => setYtConnected(false));
  }, []);

  useEffect(() => {
    if (autoAttempted.current || stream.yt_broadcast_id || ytConnected !== true) return;
    autoAttempted.current = true;
    void handleCreateBroadcast(true);
  }, [stream.yt_broadcast_id, ytConnected, handleCreateBroadcast]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">YouTube</CardTitle>
            <CardDescription>Auto-managed broadcast</CardDescription>
          </div>
          {ytConnected === true && (
            <Badge className="bg-green-600 shrink-0">Connected ✓</Badge>
          )}
          {ytConnected === false && (
            <Button size="sm" variant="outline" asChild>
              <Link href="/admin/youtube/connect">Connect</Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {ytError && (
          <Alert variant="destructive">
            <AlertTitle>YouTube Error</AlertTitle>
            <AlertDescription>{ytError}</AlertDescription>
          </Alert>
        )}

        {creating && !stream.yt_broadcast_id && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Preparing broadcast…
          </div>
        )}

        {stream.yt_broadcast_id ? (
          <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Broadcast ready</p>
            <p>ID: {stream.yt_broadcast_id}</p>
            <p className="mt-1">RTMP will be pushed to OBS automatically on Go Live.</p>
          </div>
        ) : (
          !creating && (
            <p className="text-sm text-muted-foreground">
              {ytConnected
                ? "Broadcast will be created automatically…"
                : "Connect YouTube to enable auto-broadcast."}
            </p>
          )
        )}
      </CardContent>
    </Card>
  );
}
