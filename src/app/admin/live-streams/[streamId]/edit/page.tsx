import { redirectLegacyStreamRoute } from "@/lib/live-stream/redirect-legacy-stream";

export default async function LegacyStreamEditPage({
  params,
}: {
  params: Promise<{ streamId: string }>;
}) {
  const { streamId } = await params;
  await redirectLegacyStreamRoute(streamId, "edit");
}
