import { redirectLegacyStreamRoute } from "@/lib/live-stream/redirect-legacy-stream";

export default async function LegacyStreamPage({
  params,
}: {
  params: Promise<{ streamId: string }>;
}) {
  const { streamId } = await params;
  await redirectLegacyStreamRoute(streamId, "control");
}
