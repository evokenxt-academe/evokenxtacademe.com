import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { LiveChatAdminPage } from "@/features/live-stream/components/live-chat-admin-page";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";
import { courseLiveStreamsPath } from "@/lib/live-stream/admin-paths";

type PageProps = {
  params: Promise<{ id: string; streamId: string }>;
};

export default async function CourseLiveChatRoute({ params }: PageProps) {
  const { id, streamId } = await params;

  return (
    <AdminPageShell
      title="Live Chat"
      description="Manage your live stream broadcast and monitor the real-time chat."
      actions={
        <Button variant="outline" size="sm" asChild>
          <Link href={courseLiveStreamsPath(id)}>
            <IconArrowLeft data-icon="inline-start" />
            Back to streams
          </Link>
        </Button>
      }
    >
      <LiveChatAdminPage streamId={streamId} />
    </AdminPageShell>
  );
}
