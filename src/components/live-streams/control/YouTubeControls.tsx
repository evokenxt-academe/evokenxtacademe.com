"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { AlertCircle, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { LiveStreamRow } from "@/types/live-stream";

type YouTubeControlsProps = {
  stream: LiveStreamRow;
  onBroadcastCreated: () => void;
};

export function YouTubeControls({ stream, onBroadcastCreated }: YouTubeControlsProps) {
  const pathname = usePathname();
  const [creating, setCreating] = useState(false);
  const [ytError, setYtError] = useState<string | null>(null);
  const [ytErrorReason, setYtErrorReason] = useState<string | null>(null);
  const [ytConnected, setYtConnected] = useState<boolean | null>(null);
  const autoAttempted = useRef(false);

  const handleCreateBroadcast = useCallback(
    async (silent = false) => {
      if (stream.yt_broadcast_id) return;

      setCreating(true);
      setYtError(null);
      setYtErrorReason(null);
      try {
        const res = await fetch("/api/youtube/broadcasts/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ streamId: stream.id }),
        });
        const data = await res.json();
        if (!res.ok) {
          setYtError(data.error ?? `Error ${res.status}`);
          setYtErrorReason(data.reason ?? null);
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
              <Link href={`/admin/youtube/connect?from=${encodeURIComponent(pathname)}`}>Connect</Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {ytErrorReason === "liveStreamingNotEnabled" ? (
          <div className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50/50 p-4 dark:border-red-950/40 dark:bg-red-950/10">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="mt-0.5 size-4 text-red-600 dark:text-red-500 shrink-0" />
              <div className="flex flex-col gap-1">
                <h4 className="text-xs font-semibold text-red-900 dark:text-red-400">
                  YouTube Live Streaming Disabled
                </h4>
                <p className="text-[11px] leading-relaxed text-red-700/90 dark:text-red-500/90">
                  Your connected YouTube account doesn't have live streaming enabled. YouTube requires channel verification and a 24-hour setup period before you can broadcast.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 rounded-md bg-white/60 p-3 text-[11px] border border-red-100/50 dark:bg-zinc-900/50 dark:border-zinc-800/40">
              <div className="flex items-start gap-2">
                <span className="flex size-4.5 shrink-0 items-center justify-center rounded-full bg-red-100 font-medium text-red-700 dark:bg-red-950/50 dark:text-red-400 text-[10px]">1</span>
                <div>
                  <span className="font-semibold text-foreground">Enable Features:</span> Go to the{" "}
                  <a
                    href="https://www.youtube.com/features"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 underline hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center gap-0.5"
                  >
                    YouTube Live Enable Page <ExternalLink className="size-3" />
                  </a>{" "}
                  or open YouTube Studio and click **Go Live**.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex size-4.5 shrink-0 items-center justify-center rounded-full bg-red-100 font-medium text-red-700 dark:bg-red-950/50 dark:text-red-400 text-[10px]">2</span>
                <div>
                  <span className="font-semibold text-foreground">Verify Channel:</span> Complete the phone verification prompt if requested by YouTube.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex size-4.5 shrink-0 items-center justify-center rounded-full bg-red-100 font-medium text-red-700 dark:bg-red-950/50 dark:text-red-400 text-[10px]">3</span>
                <div>
                  <span className="font-semibold text-foreground">Wait 24 Hours:</span> Google takes up to 24 hours to activate live streaming on new accounts.
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                size="sm"
                variant="destructive"
                className="w-full text-xs font-medium h-8"
                asChild
              >
                <a href="https://www.youtube.com/features" target="_blank" rel="noopener noreferrer">
                  Enable Live Streaming
                </a>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs h-8 border-red-200 hover:bg-red-50 dark:border-red-950/40 dark:hover:bg-red-950/10"
                onClick={() => handleCreateBroadcast(false)}
                disabled={creating}
              >
                {creating ? (
                  <>
                    <Loader2 className="mr-1.5 size-3 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-1.5 size-3" />
                    Retry Setup
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          ytError && (
            <Alert variant="destructive">
              <AlertTitle>YouTube Error</AlertTitle>
              <AlertDescription>{ytError}</AlertDescription>
            </Alert>
          )
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
