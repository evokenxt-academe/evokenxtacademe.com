type GoLiveSteps = {
  onStep?: (step: string) => void;
};

export async function ensureYouTubeBroadcast(streamId: string): Promise<{
  rtmpUrl: string;
  streamKey: string;
}> {
  const res = await fetch("/api/youtube/broadcasts/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ streamId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to create YouTube broadcast");

  const rtmpUrl = data.rtmpUrl as string | undefined;
  const streamKey = data.streamKey as string | undefined;
  if (!rtmpUrl || !streamKey) {
    throw new Error("YouTube broadcast created but RTMP credentials are missing");
  }
  return { rtmpUrl, streamKey };
}

export async function transitionYouTubeLive(streamId: string): Promise<void> {
  const res = await fetch("/api/youtube/broadcasts/go-live", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ streamId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to go live on YouTube");
}

export async function endYouTubeStream(streamId: string): Promise<void> {
  const res = await fetch("/api/youtube/broadcasts/end", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ streamId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Failed to end YouTube stream");
  }
}

export type ObsEncoderActions = {
  startStreaming: () => Promise<void>;
  stopStreaming: () => Promise<void>;
  pushRtmp: (url: string, key: string) => Promise<void>;
  ensureConnected: () => Promise<void>;
};

export async function runGoLiveSequence(
  streamId: string,
  obs: ObsEncoderActions,
  { onStep }: GoLiveSteps = {},
): Promise<void> {
  onStep?.("Preparing YouTube broadcast…");
  const { rtmpUrl, streamKey } = await ensureYouTubeBroadcast(streamId);

  onStep?.("Connecting to OBS…");
  await obs.ensureConnected();

  onStep?.("Preparing OBS encoder…");
  try {
    await obs.stopStreaming();
  } catch {
    /* OBS may already be stopped */
  }

  onStep?.("Configuring OBS stream…");
  await obs.pushRtmp(rtmpUrl, streamKey);

  onStep?.("Starting OBS encoder…");
  await obs.startStreaming();

  onStep?.("Waiting for YouTube to receive encoder signal…");
  await transitionYouTubeLive(streamId);
}

export async function runEndStreamSequence(
  streamId: string,
  obs: Pick<ObsEncoderActions, "stopStreaming">,
  { onStep }: GoLiveSteps = {},
): Promise<void> {
  onStep?.("Stopping OBS…");
  try {
    await obs.stopStreaming();
  } catch {
    /* OBS may already be stopped */
  }

  onStep?.("Ending YouTube broadcast…");
  await endYouTubeStream(streamId);
  onStep?.("Clearing chat and polls…");
}
