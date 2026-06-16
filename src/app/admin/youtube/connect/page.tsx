"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  IconBrandYoutube,
  IconExternalLink,
  IconRefresh,
  IconSettings,
  IconUnlink,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import {
  mergeEncoderSettings,
  readLocalEncoderSettings,
  writeLocalEncoderSettings,
} from "@/lib/obs/encoder-settings-storage";

type YtStatus = {
  connected: boolean;
  expired?: boolean;
  needsReauth?: boolean;
  scopes?: string;
  lastUpdated?: string;
  channel?: {
    channelName: string;
    subscribers: string;
    thumbnail: string;
  } | null;
};

type EncoderSettings = {
  obs_host: string;
  obs_port: number;
  obs_password: string;
  notes: string;
};

export default function YouTubeConnectPage() {
  const router = useRouter();
  const [status, setStatus] = useState<YtStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [savingEncoder, setSavingEncoder] = useState(false);
  const [encoder, setEncoder] = useState<EncoderSettings>({
    obs_host: "localhost",
    obs_port: 4455,
    obs_password: "",
    notes: "",
  });

  const loadStatus = async () => {
    setLoading(true);
    try {
      const [ytRes, encRes] = await Promise.all([
        fetch("/api/youtube/status"),
        fetch("/api/admin/encoder-settings"),
      ]);
      if (ytRes.ok) setStatus(await ytRes.json());
      if (encRes.ok) {
        const data = await encRes.json();
        if (data.settings) {
          const merged = mergeEncoderSettings(
            {
              obs_host: data.settings.obs_host ?? "localhost",
              obs_port: data.settings.obs_port ?? 4455,
              obs_password: data.settings.obs_password ?? "",
            },
            readLocalEncoderSettings(),
          );
          setEncoder({
            ...merged,
            notes: data.settings.notes ?? "",
          });
        }
      }
    } catch {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();

    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const error = params.get("error");

    if (success === "youtube_connected") {
      toast.success("YouTube account connected!");
      router.replace("/admin/youtube/connect");
    } else if (error) {
      toast.error(`YouTube connection failed: ${error.replace(/_/g, " ")}`);
      router.replace("/admin/youtube/connect");
    }
  }, [router]);

  const handleDisconnect = async () => {
    if (!confirm("Disconnect YouTube account?")) return;
    setDisconnecting(true);
    try {
      const res = await fetch("/api/youtube/oauth/disconnect", { method: "DELETE" });
      if (res.ok) {
        toast.success("Disconnected");
        setStatus({ connected: false });
      } else {
        toast.error("Failed to disconnect");
      }
    } finally {
      setDisconnecting(false);
    }
  };

  const handleRefreshToken = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/youtube/token/refresh", { method: "POST" });
      if (res.ok) {
        toast.success("Token refreshed");
        await loadStatus();
      } else {
        const data = await res.json();
        toast.error(data.error ?? "Refresh failed");
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleSaveEncoder = async () => {
    setSavingEncoder(true);
    try {
      writeLocalEncoderSettings({
        obs_host: encoder.obs_host,
        obs_port: encoder.obs_port,
        obs_password: encoder.obs_password,
      });

      const res = await fetch("/api/admin/encoder-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(encoder),
      });
      if (res.ok) {
        toast.success("Encoder settings saved");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.success(
          "Encoder settings saved on this device. Run supabase-migration-encoder-settings.sql to persist in the database.",
        );
        if (data.error) console.warn("encoder-settings PUT:", data.error);
      }
    } finally {
      setSavingEncoder(false);
    }
  };

  const isHealthy = status?.connected && !status.expired && !status.needsReauth;

  return (
    <div className="mx-auto max-w-2xl flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Streaming Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          YouTube OAuth and OBS encoder configuration for live broadcasts.
        </p>
      </div>

      <Alert>
        <AlertTitle>Required YouTube Permissions</AlertTitle>
        <AlertDescription className="flex flex-col gap-1 text-sm">
          <span>
            <code className="text-xs">youtube</code> — Manage live broadcasts
          </span>
          <span>
            <code className="text-xs">youtube.force-ssl</code> — Live chat sync
          </span>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
              <IconBrandYoutube className="size-6 text-destructive" />
            </div>
            <div>
              <CardTitle className="flex flex-wrap items-center gap-2">
                YouTube Account
                {!loading && (
                  <Badge variant={isHealthy ? "default" : "outline"} className={isHealthy ? "bg-green-600" : ""}>
                    {isHealthy ? "Connected ✓" : "Not Connected"}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>Tokens stored server-side only</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {loading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : isHealthy ? (
            <>
              {status?.channel && (
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  {status.channel.thumbnail && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={status.channel.thumbnail} alt="" className="size-10 rounded-full" />
                  )}
                  <div>
                    <p className="font-medium">{status.channel.channelName}</p>
                    <p className="text-sm text-muted-foreground">
                      {Number(status.channel.subscribers).toLocaleString()} subscribers
                    </p>
                  </div>
                </div>
              )}
              {status?.lastUpdated && (
                <p className="text-sm text-muted-foreground">
                  Last updated: {format(new Date(status.lastUpdated), "PPp")}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {status?.needsReauth
                ? "Reconnect to grant full broadcast permissions."
                : status?.expired
                  ? "Token expired — reconnect or refresh."
                  : "Connect YouTube to auto-create broadcasts in the control room."}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {!isHealthy ? (
              <Button asChild>
                <Link href="/api/youtube/oauth/authorize">
                  <IconExternalLink className="mr-2 size-4" />
                  Connect YouTube
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleRefreshToken} disabled={refreshing}>
                  <IconRefresh className={`mr-2 size-4 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh Token
                </Button>
                <Button
                  variant="outline"
                  className="text-destructive"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                >
                  <IconUnlink className="mr-2 size-4" />
                  Disconnect
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <IconSettings className="size-6 text-muted-foreground" />
            </div>
            <div>
              <CardTitle>OBS Encoder Settings</CardTitle>
              <CardDescription>
                Saved in Supabase — used as your encoder profile reference in the control room
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2 flex flex-col gap-2">
              <Label htmlFor="obs-host">OBS Host</Label>
              <Input
                id="obs-host"
                value={encoder.obs_host}
                onChange={(e) => setEncoder((s) => ({ ...s, obs_host: e.target.value }))}
                placeholder="localhost"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="obs-port">Port</Label>
              <Input
                id="obs-port"
                type="number"
                value={encoder.obs_port}
                onChange={(e) =>
                  setEncoder((s) => ({ ...s, obs_port: parseInt(e.target.value, 10) || 4455 }))
                }
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="obs-pass">WebSocket Password</Label>
            <Input
              id="obs-pass"
              type="password"
              value={encoder.obs_password}
              onChange={(e) => setEncoder((s) => ({ ...s, obs_password: e.target.value }))}
              placeholder="From OBS → Tools → WebSocket Server Settings"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="obs-notes">Notes</Label>
            <Textarea
              id="obs-notes"
              value={encoder.notes}
              onChange={(e) => setEncoder((s) => ({ ...s, notes: e.target.value }))}
              rows={2}
              placeholder="Scene name, audio device, etc."
            />
          </div>

          <Button onClick={handleSaveEncoder} disabled={savingEncoder} className="w-full sm:w-auto">
            {savingEncoder ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Encoder Settings"
            )}
          </Button>
        </CardContent>
      </Card>

      <Button variant="ghost" asChild className="self-start">
        <Link href="/admin/courses">← Back to Courses</Link>
      </Button>
    </div>
  );
}
