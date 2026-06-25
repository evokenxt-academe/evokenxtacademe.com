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
import {
  IconArrowLeft,
  IconBrandYoutube,
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
import { cn } from "@/lib/utils";

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
  const [from, setFrom] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("from");
    }
    return null;
  });
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
    const fromVal = params.get("from");

    if (fromVal) {
      setFrom(fromVal);
    }

    const cleanUrl = fromVal
      ? `/admin/youtube/connect?from=${encodeURIComponent(fromVal)}`
      : "/admin/youtube/connect";

    if (success === "youtube_connected") {
      toast.success("YouTube account connected!");
      router.replace(cleanUrl);
    } else if (error) {
      toast.error(`YouTube connection failed: ${error.replace(/_/g, " ")}`);
      router.replace(cleanUrl);
    }
  }, [router]);

  const handleDisconnect = async () => {
    if (!confirm("Disconnect YouTube account?")) return;
    setDisconnecting(true);
    try {
      const res = await fetch("/api/youtube/oauth/disconnect", {
        method: "DELETE",
      });
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
    <div className="mx-auto max-w-5xl w-full flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      {/* Navigation */}
      <Button
        variant="ghost"
        asChild
        className="self-start -ml-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Link href={from || "/admin/courses"}>
          <IconArrowLeft className="mr-2 size-4" />
          {from ? "Back to Live Control Room" : "Back to Courses"}
        </Link>
      </Button>

      {/* Header */}
      <div className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Streaming & Broadcast Settings
        </h1>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Pair your YouTube account to automatically schedule and control live
          streams, and configure OBS settings to stream directly from your local
          encoder.
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
        {/* YouTube Connection */}
        <Card className="flex flex-col h-full border border-border/80 shadow-sm hover:border-border transition-all duration-200">
          <CardHeader className="pb-4 border-b border-border/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
                  <IconBrandYoutube className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">
                    YouTube Account
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Manage your stream destination
                  </CardDescription>
                </div>
              </div>
              {!loading && (
                <Badge
                  variant={isHealthy ? "default" : "secondary"}
                  className={cn(
                    "text-xs px-2.5 py-0.5 rounded-full font-medium transition-colors border-0",
                    isHealthy
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 dark:bg-emerald-500/20"
                      : "bg-amber-500/10 text-amber-700 dark:text-amber-400 dark:bg-amber-500/20",
                  )}
                >
                  {isHealthy ? "Connected" : "Disconnected"}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between p-6 gap-6">
            {loading ? (
              <div className="space-y-4 w-full">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ) : isHealthy ? (
              <div className="space-y-6 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  {status?.channel && (
                    <div className="flex items-center gap-3.5 rounded-xl border border-border/50 bg-muted/20 p-4 transition-all hover:bg-muted/30">
                      {status.channel.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={status.channel.thumbnail}
                          alt={status.channel.channelName}
                          className="size-12 rounded-full border border-border/80 shadow-inner"
                        />
                      ) : (
                        <div className="size-12 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center font-bold text-red-600 dark:text-red-400">
                          {status.channel.channelName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm leading-tight text-foreground truncate">
                          {status.channel.channelName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {Number(status.channel.subscribers).toLocaleString()}{" "}
                          subscribers
                        </p>
                      </div>
                    </div>
                  )}

                  {status?.lastUpdated && (
                    <div className="flex items-center justify-between text-xs border-t border-border/40 pt-4">
                      <span className="text-muted-foreground">
                        Last authorized on
                      </span>
                      <span className="font-medium text-foreground">
                        {format(new Date(status.lastUpdated), "PPp")}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-auto pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshToken}
                    disabled={refreshing}
                    className="flex-1 text-xs gap-2 h-9 font-medium"
                  >
                    <IconRefresh
                      className={cn("size-3.5", refreshing && "animate-spin")}
                    />
                    Refresh Token
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive gap-2 h-9 border-destructive/20 hover:border-destructive/30 font-medium"
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                  >
                    {disconnecting ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <IconUnlink className="size-3.5" />
                    )}
                    Disconnect
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 flex-1 flex flex-col justify-between">
                <div className="rounded-xl border border-dashed border-border/80 p-5 text-center bg-muted/10">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {status?.needsReauth
                      ? "Your YouTube authorization has expired. Please reconnect to resume managing broadcasts."
                      : status?.expired
                        ? "Your session expired. Reconnect your account to sync chat and broadcasts."
                        : "Connect your YouTube account to automatically schedule broadcasts, go live, and sync chat from the control room."}
                  </p>
                </div>

                <Button asChild size="lg" variant="destructive">
                  <Link
                    href={
                      from
                        ? `/api/youtube/oauth/authorize?state=${encodeURIComponent(from)}`
                        : "/api/youtube/oauth/authorize"
                    }
                    className="flex items-center justify-center gap-2"
                  >
                    <IconBrandYoutube className="size-4" />
                    Connect YouTube Channel
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* OBS Settings */}
        <Card className="flex flex-col h-full border border-border/80 shadow-sm hover:border-border transition-all duration-200">
          <CardHeader className="pb-4 border-b border-border/40">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                <IconSettings className="size-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">
                  OBS Studio Integration
                </CardTitle>
                <CardDescription className="text-xs">
                  Live encoder profile details
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col gap-5">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label
                  htmlFor="obs-host"
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  OBS Host / IP
                </Label>
                <Input
                  id="obs-host"
                  className="h-9 text-sm"
                  value={encoder.obs_host}
                  onChange={(e) =>
                    setEncoder((s) => ({ ...s, obs_host: e.target.value }))
                  }
                  placeholder="localhost"
                />
              </div>
              <div className="col-span-1 space-y-1.5">
                <Label
                  htmlFor="obs-port"
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  Port
                </Label>
                <Input
                  id="obs-port"
                  type="number"
                  className="h-9 text-sm"
                  value={encoder.obs_port}
                  onChange={(e) =>
                    setEncoder((s) => ({
                      ...s,
                      obs_port: parseInt(e.target.value, 10) || 4455,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="obs-pass"
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
              >
                WebSocket Password
              </Label>
              <Input
                id="obs-pass"
                type="password"
                className="h-9 text-sm"
                value={encoder.obs_password}
                onChange={(e) =>
                  setEncoder((s) => ({ ...s, obs_password: e.target.value }))
                }
                placeholder="Enter WebSocket password"
              />
              <p className="text-[11px] text-muted-foreground mt-1 leading-normal">
                Enable WebSocket Server in OBS Studio via{" "}
                <strong className="font-semibold text-foreground">
                  Tools → WebSocket Server Settings
                </strong>
                .
              </p>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="obs-notes"
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
              >
                Setup Notes
              </Label>
              <Textarea
                id="obs-notes"
                value={encoder.notes}
                onChange={(e) =>
                  setEncoder((s) => ({ ...s, notes: e.target.value }))
                }
                rows={2}
                className="text-sm resize-none"
                placeholder="e.g., Default mic, primary camera scene..."
              />
            </div>

            <Button
              onClick={handleSaveEncoder}
              disabled={savingEncoder}
              className="w-full h-10 mt-auto font-semibold"
            >
              {savingEncoder ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving Settings…
                </>
              ) : (
                "Save OBS Configuration"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
