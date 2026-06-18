"use client";

import OBSWebSocket from "obs-websocket-js/json";

export type ObsConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export type EncoderSettings = {
  obs_host: string;
  obs_port: number;
  obs_password: string;
};

type StreamServiceConfig = {
  streamServiceType: string;
  streamServiceSettings: Record<string, any>;
};

let client: OBSWebSocket | null = null;

function getClient(): OBSWebSocket {
  if (!client) client = new OBSWebSocket();
  return client;
}

export function formatObsConnectionError(error: unknown): string {
  const message =
    error instanceof Error ? error.message : "Failed to connect to OBS";

  if (
    message.includes("authentication") &&
    message.includes("required")
  ) {
    return "OBS WebSocket requires a password. Enter the password from OBS → Tools → WebSocket Server Settings in Encoder settings, then reconnect.";
  }

  if (message.includes("ECONNREFUSED") || message.includes("Failed to connect")) {
    return "OBS not reachable. Open OBS on this machine and enable WebSocket (Tools → WebSocket Server Settings).";
  }

  return message;
}

/** Split YouTube ingestion URL + stream key for OBS custom RTMP. */
export function normalizeYoutubeRtmpCredentials(
  server: string,
  key: string,
): { server: string; key: string } {
  const trimmedKey = key.trim();
  let trimmedServer = server.trim();

  const live2WithKey = trimmedServer.match(/^(.*\/live2)\/(.+)$/);
  if (live2WithKey) {
    return {
      server: live2WithKey[1],
      key: live2WithKey[2] || trimmedKey,
    };
  }

  if (trimmedServer.includes("youtube.com") && !trimmedServer.endsWith("/live2")) {
    trimmedServer = trimmedServer.replace(/\/?$/, "/live2");
  }

  return { server: trimmedServer, key: trimmedKey };
}

function buildRtmpCustomConfig(server: string, key: string): StreamServiceConfig {
  return {
    streamServiceType: "rtmp_custom",
    streamServiceSettings: {
      server,
      key,
      use_auth: false,
      bwtest: false,
    },
  };
}

function buildYoutubeRtmpsConfig(key: string): StreamServiceConfig {
  return {
    streamServiceType: "rtmp_common",
    streamServiceSettings: {
      service: "YouTube - RTMPS",
      protocol: "RTMPS",
      server: "auto",
      key,
      bwtest: false,
    },
  };
}

export async function connectObs(settings: EncoderSettings): Promise<void> {
  const obs = getClient();

  // Keep the WebSocket session alive across page navigations so live streams
  // are not interrupted when leaving and returning to the control room.
  if (obs.identified) return;

  const url = `ws://${settings.obs_host}:${settings.obs_port}`;
  const password = settings.obs_password?.trim() || undefined;

  try {
    await obs.connect(url, password);
  } catch (error) {
    throw new Error(formatObsConnectionError(error));
  }
}

export async function disconnectObs(): Promise<void> {
  const obs = getClient();
  if (obs.identified) await obs.disconnect();
}

export async function getObsStreamStatus(): Promise<{ isStreaming: boolean }> {
  const obs = getClient();
  if (!obs.identified) throw new Error("OBS not connected");
  const status = (await obs.call("GetStreamStatus")) as {
    outputActive?: boolean;
    outputState?: string;
  };
  const isStreaming =
    status.outputActive === true ||
    status.outputState === "OBS_WEBSOCKET_OUTPUT_STARTED";
  return { isStreaming };
}

async function getCurrentStreamKey(): Promise<string | null> {
  const obs = getClient();
  const response = (await obs.call("GetStreamServiceSettings")) as {
    streamServiceSettings?: { key?: string };
  };
  const key = response.streamServiceSettings?.key;
  return typeof key === "string" && key.trim() ? key.trim() : null;
}

/** True when OBS already has the expected YouTube stream key configured. */
export async function isObsConfiguredForStream(
  server: string,
  key: string,
): Promise<boolean> {
  if (!isObsConnected()) return false;
  const currentKey = await getCurrentStreamKey();
  const { key: expectedKey } = normalizeYoutubeRtmpCredentials(server, key);
  return currentKey === expectedKey;
}

async function waitForStreamStopped(maxWaitMs = 10_000): Promise<void> {
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    const { isStreaming } = await getObsStreamStatus();
    if (!isStreaming) return;
    await wait(500);
  }
  throw new Error(
    "OBS is still stopping a previous stream. Wait a moment and try Go Live again.",
  );
}

async function applyStreamServiceSettings(config: StreamServiceConfig): Promise<void> {
  const obs = getClient();
  await obs.call("SetStreamServiceSettings", config);
}

/**
 * OBS may ignore the first SetStreamServiceSettings until settings are "applied".
 * We set twice, verify the stream key, and fall back to the built-in YouTube RTMPS service.
 */
async function applyStreamServiceSettingsReliably(
  server: string,
  key: string,
): Promise<void> {
  const configs = [buildRtmpCustomConfig(server, key), buildYoutubeRtmpsConfig(key)];
  let lastError: Error | null = null;

  for (const config of configs) {
    try {
      for (let attempt = 0; attempt < 2; attempt++) {
        await applyStreamServiceSettings(config);
        await wait(attempt === 0 ? 800 : 400);
      }

      const currentKey = await getCurrentStreamKey();
      if (currentKey === key) return;

      lastError = new Error(
        `OBS did not persist stream key (got ${currentKey ?? "empty"})`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (
        message.toLowerCase().includes("cannot change stream service settings while streaming")
      ) {
        throw new Error(
          "OBS is still streaming. Stop the stream in OBS, wait a moment, then try Go Live again.",
        );
      }
      lastError = error instanceof Error ? error : new Error(message);
    }
  }

  throw (
    lastError ??
    new Error(
      "OBS did not accept stream settings. In OBS go to Settings → Stream, choose Custom, click Apply once, then try Go Live again.",
    )
  );
}

export async function pushRtmpToObs(server: string, key: string): Promise<void> {
  const obs = getClient();
  if (!obs.identified) throw new Error("OBS not connected");

  const { server: rtmpServer, key: streamKey } = normalizeYoutubeRtmpCredentials(
    server,
    key,
  );

  const currentKey = await getCurrentStreamKey();
  if (currentKey === streamKey) {
    // Already configured — never stop an active broadcast when revisiting the page.
    return;
  }

  const { isStreaming } = await getObsStreamStatus();
  if (isStreaming) {
    await obs.call("StopStream");
    await waitForStreamStopped();
  }

  await applyStreamServiceSettingsReliably(rtmpServer, streamKey);
}

export async function startObsStream(expectedKey?: string): Promise<void> {
  const obs = getClient();
  if (!obs.identified) throw new Error("OBS not connected");

  const currentKey = await getCurrentStreamKey();
  if (!currentKey) {
    throw new Error(
      "OBS has no broadcast configured. Use Go Live in the Control Room to apply YouTube stream settings automatically.",
    );
  }

  if (expectedKey && currentKey !== expectedKey.trim()) {
    throw new Error("OBS stream key is out of date. Click Go Live again to refresh settings.");
  }

  const { isStreaming } = await getObsStreamStatus();
  if (!isStreaming) await obs.call("StartStream");
}

export async function stopObsStream(): Promise<void> {
  const obs = getClient();
  if (!obs.identified) throw new Error("OBS not connected");
  const { isStreaming } = await getObsStreamStatus();
  if (isStreaming) {
    await obs.call("StopStream");
    await waitForStreamStopped();
  }
}

export function isObsConnected(): boolean {
  return getClient().identified;
}

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
