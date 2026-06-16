"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, RefreshCw } from "lucide-react";
import type { EncoderSettings, ObsConnectionStatus } from "@/lib/obs/obs-client";

type EncoderSetupCardProps = {
  obsStatus: ObsConnectionStatus;
  isStreaming: boolean;
  error: string | null;
  rtmpConfigured: boolean;
  settings: EncoderSettings;
  onReconnect?: () => void;
  onSavePassword?: (password: string) => Promise<void>;
  reconnecting?: boolean;
};

const STATUS_LABEL: Record<ObsConnectionStatus, string> = {
  disconnected: "Disconnected",
  connecting: "Connecting…",
  connected: "Connected",
  error: "Error",
};

function needsPasswordSetup(error: string | null, settings: EncoderSettings): boolean {
  if (!settings.obs_password?.trim()) return true;
  return Boolean(
    error?.includes("password") ||
      (error?.includes("authentication") && error.includes("required")),
  );
}

export function EncoderSetupCard({
  obsStatus,
  isStreaming,
  error,
  rtmpConfigured,
  settings,
  onReconnect,
  onSavePassword,
  reconnecting,
}: EncoderSetupCardProps) {
  const [password, setPassword] = useState(settings.obs_password);
  const [savingPassword, setSavingPassword] = useState(false);
  const showPasswordForm = needsPasswordSetup(error, settings);

  useEffect(() => {
    setPassword(settings.obs_password);
  }, [settings.obs_password]);

  const handleSavePassword = async () => {
    if (!onSavePassword || !password.trim()) return;
    setSavingPassword(true);
    try {
      await onSavePassword(password.trim());
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">OBS Encoder</CardTitle>
            <CardDescription>Automatic — no manual copy/paste required</CardDescription>
          </div>
          <Badge
            variant={obsStatus === "connected" ? "default" : "outline"}
            className={obsStatus === "connected" ? "bg-green-600" : ""}
          >
            {obsStatus === "connecting" && <Loader2 className="mr-1 size-3 animate-spin" />}
            {STATUS_LABEL[obsStatus]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">RTMP auto-config</span>
            <span className="font-medium">{rtmpConfigured ? "Done" : "Waiting"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">OBS streaming</span>
            <span className="font-medium">{isStreaming ? "Active" : "Idle"}</span>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        {showPasswordForm && (
          <div className="flex flex-col gap-2 rounded-md border p-3">
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

        <p className="text-xs text-muted-foreground">
          Click <strong>Go Live</strong> to automatically connect OBS, push YouTube RTMP settings, start encoding, and publish.
          OBS must be running on this machine with WebSocket enabled.
        </p>

        <div className="flex flex-wrap gap-2">
          {onReconnect && (
            <Button size="sm" variant="outline" onClick={onReconnect} disabled={reconnecting}>
              <RefreshCw className={`mr-1 size-3.5 ${reconnecting ? "animate-spin" : ""}`} />
              Reconnect OBS
            </Button>
          )}
          <Button variant="link" size="sm" className="h-auto p-0" asChild>
            <Link href="/admin/youtube/connect">Encoder settings</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
