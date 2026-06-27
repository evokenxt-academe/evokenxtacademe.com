"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PipelineStatus } from "./PipelineStatus";
import {
  AlertCircle,
  ChevronDown,
  ExternalLink,
  Loader2,
  Radio,
  RefreshCw,
  Square,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import type { EncoderSettings, ObsConnectionStatus } from "@/lib/obs/obs-client";
import type { LiveStreamRow, PipelineStepStatus } from "@/types/live-stream";
import { buildYoutubeStudioEditUrl } from "@/features/live-stream/lib";
import { cn } from "@/lib/utils";

type Step = {
  id: number;
  label: string;
  status: PipelineStepStatus;
};

type StreamSetupPanelProps = {
  stream: LiveStreamRow;
  steps: Step[];
  obsStatus: ObsConnectionStatus;
  isStreaming: boolean;
  obsError: string | null;
  rtmpConfigured: boolean;
  obsSettings: EncoderSettings;
  onReconnectObs: () => Promise<void>;
  onSaveObsPassword: (password: string) => Promise<void>;
  reconnecting: boolean;
  onBroadcastCreated: () => void;
  actionLoading: boolean;
  goLiveStep: string | null;
  onGoLive: () => void;
  onEndStream: () => void;
  onSaveReplay: () => void;
};

function StatusDot({ ok, pending }: { ok: boolean; pending?: boolean }) {
  return (
    <span
      className={cn(
        "size-2 shrink-0 rounded-full",
        ok && "bg-emerald-500",
        pending && !ok && "animate-pulse bg-blue-500",
        !ok && !pending && "bg-muted-foreground/30",
      )}
    />
  );
}

function needsPasswordSetup(error: string | null, settings: EncoderSettings): boolean {
  if (!settings.obs_password?.trim()) return true;
  return Boolean(
    error?.includes("password") ||
      (error?.includes("authentication") && error.includes("required")),
  );
}

export function StreamSetupPanel({
  stream,
  steps,
  obsStatus,
  isStreaming,
  obsError,
  rtmpConfigured,
  obsSettings,
  onReconnectObs,
  onSaveObsPassword,
  reconnecting,
  onBroadcastCreated,
  actionLoading,
  goLiveStep,
  onGoLive,
  onEndStream,
  onSaveReplay,
}: StreamSetupPanelProps) {
  const pathname = usePathname();
  const [ytConnected, setYtConnected] = useState<boolean | null>(null);
  const [creating, setCreating] = useState(false);
  const [ytError, setYtError] = useState<string | null>(null);
  const [ytErrorReason, setYtErrorReason] = useState<string | null>(null);
  const [password, setPassword] = useState(obsSettings.obs_password);
  const [savingPassword, setSavingPassword] = useState(false);
  const [troubleshootOpen, setTroubleshootOpen] = useState(false);
  const autoAttempted = useRef(false);

  const showPasswordForm = needsPasswordSetup(obsError, obsSettings);
  const hasIssue = Boolean(obsError || ytError || showPasswordForm);
  const studioEditUrl = buildYoutubeStudioEditUrl(stream.yt_video_id);

  useEffect(() => {
    setPassword(obsSettings.obs_password);
  }, [obsSettings.obs_password]);

  useEffect(() => {
    if (hasIssue) setTroubleshootOpen(true);
  }, [hasIssue]);

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
        if (!silent) {
          if (data.embedDisabled) {
            toast.warning(
              "YouTube broadcast ready, but embedding is disabled. Enable it in YouTube Studio.",
              { duration: 8000 }
            );
          } else {
            toast.success("YouTube broadcast ready");
          }
        }
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

  const handleSavePassword = async () => {
    if (!password.trim()) return;
    setSavingPassword(true);
    try {
      await onSaveObsPassword(password.trim());
    } finally {
      setSavingPassword(false);
    }
  };

  const primaryAction =
    stream.status === "scheduled" ? (
      <Button className="w-full" size="lg" onClick={onGoLive} disabled={actionLoading}>
        {actionLoading ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : (
          <Radio className="mr-2 size-4" />
        )}
        Go Live
      </Button>
    ) : stream.status === "live" ? (
      <Button
        variant="destructive"
        className="w-full"
        size="lg"
        onClick={onEndStream}
        disabled={actionLoading}
      >
        <Square className="mr-2 size-4" />
        End Stream
      </Button>
    ) : stream.status === "ended" ? (
      <Button
        variant="outline"
        className="w-full"
        size="lg"
        onClick={onSaveReplay}
        disabled={actionLoading}
      >
        <Video className="mr-2 size-4" />
        Save as Replay
      </Button>
    ) : null;

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-border/60 bg-card p-4 sm:p-5">
      {primaryAction}

      {stream.enable_embed === false && stream.yt_broadcast_id && (
        <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-950/40 dark:bg-amber-950/10">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="mt-0.5 size-4 text-amber-600 dark:text-amber-500 shrink-0" />
            <div className="flex flex-col gap-1">
              <h4 className="text-xs font-semibold text-amber-900 dark:text-amber-400">
                YouTube Embedding Disabled
              </h4>
              <p className="text-[11px] leading-relaxed text-amber-700/90 dark:text-amber-500/90">
                YouTube has disabled video embedding for this stream. To play this live stream directly inside the LMS, you must manually enable embedding in YouTube Studio:
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 rounded-md bg-white/60 p-3 text-[11px] border border-amber-100/50 dark:bg-zinc-900/50 dark:border-zinc-800/40">
            <div>
              1. Open your live stream in{" "}
              <a
                href={studioEditUrl ?? "https://studio.youtube.com"}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-blue-600 underline hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center gap-0.5"
              >
                YouTube Studio <ExternalLink className="size-3" />
              </a>
            </div>
            <div>2. Click **Edit** (pencil icon) on the top right.</div>
            <div>3. Scroll down, click **SHOW MORE**, and scroll to the **License** section.</div>
            <div>4. Check the box for **Allow embedding**.</div>
            <div>5. Click **Save** in YouTube Studio.</div>
          </div>
          <p className="text-[10px] text-amber-600/80 dark:text-amber-500/80 italic">
            * Note: Once enabled in YouTube Studio, the player will start working for students immediately.
          </p>
        </div>
      )}

      {goLiveStep && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          {goLiveStep}
        </p>
      )}

      <PipelineStatus steps={steps} />

      <div className="flex flex-col gap-2 rounded-lg bg-muted/30 px-3 py-2.5 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-muted-foreground">
            <StatusDot ok={ytConnected === true} pending={creating} />
            YouTube
          </span>
          <span className="font-medium">
            {creating
              ? "Preparing…"
              : !ytConnected
                ? "Not connected"
                : stream.yt_broadcast_id
                  ? "Ready"
                  : "Waiting"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-muted-foreground">
            <StatusDot
              ok={obsStatus === "connected"}
              pending={obsStatus === "connecting"}
            />
            OBS
          </span>
          <span className="font-medium">
            {obsStatus === "connecting"
              ? "Connecting…"
              : obsStatus === "connected"
                ? isStreaming
                  ? "Streaming"
                  : rtmpConfigured
                    ? "Ready"
                    : "Connected"
                : "Offline"}
          </span>
        </div>
      </div>

      {stream.status === "scheduled" && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          Open OBS on this machine, then press <strong>Go Live</strong>. YouTube RTMP
          settings are applied automatically. If OBS shows &quot;No Broadcast Configured&quot;
          the first time only, open <strong>Settings → Stream → Custom</strong>, click{" "}
          <strong>Apply</strong> once, then use Go Live again.
        </p>
      )}

      {!ytConnected && ytConnected !== null && (
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href={`/admin/youtube/connect?from=${encodeURIComponent(pathname)}`}>Connect YouTube account</Link>
        </Button>
      )}

      <Collapsible open={troubleshootOpen} onOpenChange={setTroubleshootOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between px-0 text-muted-foreground hover:text-foreground"
          >
            Troubleshooting
            <ChevronDown
              className={cn(
                "size-4 transition-transform",
                troubleshootOpen && "rotate-180",
              )}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="flex flex-col gap-3 pt-2">
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
            (ytError || obsError) && (
              <Alert variant="destructive">
                <AlertDescription className="text-xs">
                  {ytError || obsError}
                </AlertDescription>
              </Alert>
            )
          )}

          {showPasswordForm && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="obs-ws-password" className="text-xs">
                OBS WebSocket password
              </Label>
              <Input
                id="obs-ws-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="From OBS → Tools → WebSocket Server Settings"
              />
              <Button
                size="sm"
                onClick={handleSavePassword}
                disabled={!password.trim() || savingPassword}
              >
                {savingPassword ? (
                  <>
                    <Loader2 className="mr-1 size-3.5 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save & reconnect"
                )}
              </Button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onReconnectObs}
              disabled={reconnecting}
            >
              <RefreshCw className={cn("mr-1 size-3.5", reconnecting && "animate-spin")} />
              Reconnect OBS
            </Button>
            <Button variant="link" size="sm" className="h-8 px-0" asChild>
              <Link href={`/admin/youtube/connect?from=${encodeURIComponent(pathname)}`}>Encoder settings</Link>
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
