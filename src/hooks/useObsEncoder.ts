"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  connectObs,
  getObsStreamStatus,
  isObsConfiguredForStream,
  isObsConnected,
  pushRtmpToObs,
  startObsStream,
  stopObsStream,
  wait,
  type EncoderSettings,
  type ObsConnectionStatus,
} from "@/lib/obs/obs-client";
import { DEFAULT_ENCODER_SETTINGS } from "@/lib/obs/constants";
import {
  mergeEncoderSettings,
  readLocalEncoderSettings,
  writeLocalEncoderSettings,
} from "@/lib/obs/encoder-settings-storage";

type UseObsEncoderOptions = {
  rtmpUrl?: string | null;
  streamKey?: string | null;
  autoConnect?: boolean;
};

export function useObsEncoder({
  rtmpUrl,
  streamKey,
  autoConnect = true,
}: UseObsEncoderOptions) {
  const [status, setStatus] = useState<ObsConnectionStatus>("disconnected");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<EncoderSettings>(DEFAULT_ENCODER_SETTINGS);
  const [rtmpPushed, setRtmpPushed] = useState(false);
  const connectAttemptedRef = useRef(false);

  const loadSettings = useCallback(async (): Promise<EncoderSettings> => {
    const local = readLocalEncoderSettings();
    let remote: EncoderSettings = DEFAULT_ENCODER_SETTINGS;

    try {
      const res = await fetch("/api/admin/encoder-settings");
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          remote = {
            obs_host: data.settings.obs_host || DEFAULT_ENCODER_SETTINGS.obs_host,
            obs_port: data.settings.obs_port || DEFAULT_ENCODER_SETTINGS.obs_port,
            obs_password: data.settings.obs_password ?? DEFAULT_ENCODER_SETTINGS.obs_password,
          };
        }
      }
    } catch {
      /* use defaults + local */
    }

    const merged = mergeEncoderSettings(remote, local);
    setSettings(merged);
    return merged;
  }, []);

  const saveSettings = useCallback(async (next: EncoderSettings) => {
    writeLocalEncoderSettings(next);
    setSettings(next);

    try {
      await fetch("/api/admin/encoder-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...next,
          notes: "",
        }),
      });
    } catch {
      /* localStorage is enough when DB table is missing */
    }
  }, []);

  const refreshStreamStatus = useCallback(async () => {
    if (!isObsConnected()) return;
    try {
      const { isStreaming: active } = await getObsStreamStatus();
      setIsStreaming(active);
    } catch {
      /* ignore */
    }
  }, []);

  const connect = useCallback(
    async (s?: EncoderSettings) => {
      const cfg = s ?? settings ?? DEFAULT_ENCODER_SETTINGS;

      setStatus("connecting");
      setError(null);
      try {
        await connectObs(cfg);
        setStatus("connected");
        await refreshStreamStatus();
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "OBS not reachable. Open OBS on this machine with WebSocket enabled.";
        setStatus("error");
        setError(msg);
        throw err instanceof Error ? err : new Error(msg);
      }
    },
    [settings, refreshStreamStatus],
  );

  const ensureConnected = useCallback(async () => {
    if (isObsConnected()) {
      setStatus("connected");
      await refreshStreamStatus();
      return;
    }
    const cfg = await loadSettings();
    await connect(cfg);
  }, [loadSettings, connect, refreshStreamStatus]);

  const pushRtmp = useCallback(
    async (url?: string | null, key?: string | null) => {
      const server = url ?? rtmpUrl;
      const streamKeyValue = key ?? streamKey;
      if (!server || !streamKeyValue) {
        throw new Error("YouTube broadcast RTMP credentials not ready yet");
      }
      await ensureConnected();

      if (await isObsConfiguredForStream(server, streamKeyValue)) {
        setRtmpPushed(true);
        setError(null);
        await refreshStreamStatus();
        return;
      }

      try {
        await pushRtmpToObs(server, streamKeyValue);
        setRtmpPushed(true);
        setError(null);
        await refreshStreamStatus();
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to configure OBS stream settings";
        setError(msg);
        throw err instanceof Error ? err : new Error(msg);
      }
    },
    [rtmpUrl, streamKey, ensureConnected, refreshStreamStatus],
  );

  const startStreaming = useCallback(async () => {
    await ensureConnected();
    if (!rtmpPushed && rtmpUrl && streamKey) {
      await pushRtmp(rtmpUrl, streamKey);
    }
    await startObsStream(streamKey ?? undefined);

    const deadline = Date.now() + 15_000;
    while (Date.now() < deadline) {
      await wait(2_000);
      await refreshStreamStatus();
      const { isStreaming: active } = await getObsStreamStatus();
      if (active) {
        setIsStreaming(true);
        return;
      }
    }

    throw new Error(
      "OBS did not confirm streaming within 15 seconds. Start streaming in OBS, then try Go Live again.",
    );
  }, [ensureConnected, rtmpUrl, streamKey, rtmpPushed, pushRtmp, refreshStreamStatus]);

  const stopStreaming = useCallback(async () => {
    if (!isObsConnected()) return;
    await stopObsStream();
    setIsStreaming(false);
  }, []);

  useEffect(() => {
    if (!autoConnect) return;

    let cancelled = false;

    const init = async () => {
      try {
        if (isObsConnected()) {
          if (cancelled) return;
          setStatus("connected");
          const { isStreaming: active } = await getObsStreamStatus();
          if (cancelled) return;
          setIsStreaming(active);
          if (rtmpUrl && streamKey) {
            const configured = await isObsConfiguredForStream(rtmpUrl, streamKey);
            if (cancelled) return;
            if (configured) setRtmpPushed(true);
          }
          return;
        }

        if (connectAttemptedRef.current) return;
        connectAttemptedRef.current = true;

        const cfg = await loadSettings();
        if (cancelled) return;
        await connect(cfg);
      } catch {
        /* connect() sets error state */
      }
    };

    void init();

    return () => {
      cancelled = true;
    };
  }, [autoConnect, loadSettings, connect, rtmpUrl, streamKey]);

  useEffect(() => {
    if (!rtmpUrl || !streamKey || rtmpPushed) return;
    if (!isObsConnected() && status !== "connected") return;

    const maybePush = async () => {
      try {
        const { isStreaming: active } = await getObsStreamStatus();
        if (active) {
          setIsStreaming(true);
          if (await isObsConfiguredForStream(rtmpUrl, streamKey)) {
            setRtmpPushed(true);
          }
          return;
        }
      } catch {
        /* OBS not ready yet */
      }

      if (isStreaming) return;

      pushRtmp(rtmpUrl, streamKey).catch(() => {
        /* error state set in pushRtmp */
      });
    };

    void maybePush();
  }, [rtmpUrl, streamKey, rtmpPushed, status, isStreaming, pushRtmp]);

  useEffect(() => {
    if (status !== "connected") return;
    const interval = setInterval(refreshStreamStatus, 5000);
    return () => clearInterval(interval);
  }, [status, refreshStreamStatus]);

  return {
    status,
    isStreaming,
    error,
    settings,
    rtmpConfigured: rtmpPushed || Boolean(rtmpUrl && streamKey),
    connect,
    ensureConnected,
    saveSettings,
    pushRtmp,
    startStreaming,
    stopStreaming,
    refreshStreamStatus,
  };
}
