import type { EncoderSettings } from "./obs-client";

const STORAGE_KEY = "evoke:encoder-settings:v1";

export function readLocalEncoderSettings(): EncoderSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<EncoderSettings>;
    return {
      obs_host: parsed.obs_host || "localhost",
      obs_port: parsed.obs_port || 4455,
      obs_password: parsed.obs_password ?? "",
    };
  } catch {
    return null;
  }
}

export function writeLocalEncoderSettings(settings: EncoderSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* quota / private browsing */
  }
}

export function mergeEncoderSettings(
  remote: EncoderSettings,
  local: EncoderSettings | null,
): EncoderSettings {
  if (!local) return remote;

  return {
    obs_host: remote.obs_host || local.obs_host,
    obs_port: remote.obs_port || local.obs_port,
    // Prefer saved password from either source; local wins when remote is empty
    obs_password: remote.obs_password || local.obs_password,
  };
}
