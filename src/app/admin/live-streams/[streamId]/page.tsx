import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { LiveStreamAdminPanel } from "@/features/live-stream/components/live-stream-admin-panel";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";

type PageProps = {
  params: Promise<{ streamId: string }>;
};

/**
 * Admin Live Stream Detail Page
 * Route: /admin/live-streams/[streamId]
 *
 * Shows stream details and provides navigation to the chat monitor
 */
export default async function AdminLiveStreamDetailPage({ params }: PageProps) {
  const { streamId } = await params;

  return (
    <AdminPageShell
      title="Live Stream Details"
      description="Manage stream settings and monitor the broadcast."
      headerAction={
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/live-streams">
            <IconArrowLeft data-icon="inline-start" />
            Back to streams
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Stream management panel */}
        <LiveStreamAdminPanel />

        {/* Link to chat monitor */}
        <div className="rounded-lg border border-border/60 bg-muted/20 p-6">
          <h3 className="mb-2 font-semibold">Chat Management</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Monitor and manage live chat messages in real-time.
          </p>
          <Button asChild>
            <Link href={`/admin/live-streams/${streamId}/chat`}>
              Go to Chat Monitor
            </Link>
          </Button>
        </div>
      </div>
    </AdminPageShell>
  );
}
