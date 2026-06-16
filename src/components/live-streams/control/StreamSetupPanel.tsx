"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
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
  ChevronDown,
  Loader2,
  Radio,
  RefreshCw,
  Square,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import type { EncoderSettings, ObsConnectionStatus } from "@/lib/obs/obs-client";
import type { LiveStreamRow, PipelineStepStatus } from "@/types/live-stream";
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
  const [ytConnected, setYtConnected] = useState<boolean | null>(null);
  const [creating, setCreating] = useState(false);
  const [ytError, setYtError] = useState<string | null>(null);
  const [password, setPassword] = useState(obsSettings.obs_password);
  const [savingPassword, setSavingPassword] = useState(false);
  const [troubleshootOpen, setTroubleshootOpen] = useState(false);
  const autoAttempted = useRef(false);

  const showPasswordForm = needsPasswordSetup(obsError, obsSettings);
  const hasIssue = Boolean(obsError || ytError || showPasswordForm);

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
          Open OBS on this machine, then press <strong>Go Live</strong>. RTMP settings
          are applied automatically.
        </p>
      )}

      {!ytConnected && ytConnected !== null && (
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href="/admin/youtube/connect">Connect YouTube account</Link>
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
          {(ytError || obsError) && (
            <Alert variant="destructive">
              <AlertDescription className="text-xs">
                {ytError || obsError}
              </AlertDescription>
            </Alert>
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
              <Link href="/admin/youtube/connect">Encoder settings</Link>
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
