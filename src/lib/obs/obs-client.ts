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

export async function connectObs(settings: EncoderSettings): Promise<void> {
  const obs = getClient();
  if (obs.identified) {
    try {
      await obs.disconnect();
    } catch {
      /* ignore */
    }
  }

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
  const status = (await obs.call("GetStreamStatus")) as { outputActive: boolean };
  return { isStreaming: status.outputActive };
}

export async function pushRtmpToObs(server: string, key: string): Promise<void> {
  const obs = getClient();
  if (!obs.identified) throw new Error("OBS not connected");

  const { isStreaming } = await getObsStreamStatus();
  if (isStreaming) {
    await obs.call("StopStream");
    await wait(1500);
  }

  try {
    await obs.call("SetStreamServiceSettings", {
      streamServiceType: "rtmp_custom",
      streamServiceSettings: { server, key, use_auth: false },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.toLowerCase().includes("cannot change stream service settings while streaming")) {
      throw new Error(
        "OBS is still streaming. Stop the stream in OBS, wait a moment, then try Go Live again.",
      );
    }
    throw error instanceof Error ? error : new Error(message);
  }
}

export async function startObsStream(): Promise<void> {
  const obs = getClient();
  if (!obs.identified) throw new Error("OBS not connected");
  const { isStreaming } = await getObsStreamStatus();
  if (!isStreaming) await obs.call("StartStream");
}

export async function stopObsStream(): Promise<void> {
  const obs = getClient();
  if (!obs.identified) throw new Error("OBS not connected");
  const { isStreaming } = await getObsStreamStatus();
  if (isStreaming) await obs.call("StopStream");
}

export function isObsConnected(): boolean {
  return getClient().identified;
}

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
