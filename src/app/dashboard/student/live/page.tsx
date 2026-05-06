import { LiveStreamListClient } from "./_components/LiveStreamListClient";

interface LiveStreamsPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function LiveStreamsPage({ searchParams }: LiveStreamsPageProps) {
  const params = await searchParams;
  const tab = typeof params.tab === "string" ? params.tab : "all";

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-8 px-1 pb-10 pt-1 sm:px-2">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.65rem]">Live Classes</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Live sessions, upcoming classes, and recordings
        </p>
      </div>

      <LiveStreamListClient initialTab={tab} />
    </div>
  );
}
