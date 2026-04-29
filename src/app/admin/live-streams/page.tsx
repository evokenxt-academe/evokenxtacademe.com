"use client"

import { AdminPageShell } from "@/features/admin/components/admin-page-shell"
import { LiveStreamAdminPanel } from "@/features/live-stream/components/live-stream-admin-panel"

export default function LiveStreamsPage() {
  return (
    <AdminPageShell
      title="Live Streams"
      description="Manage course-based live classes with YouTube embeds and real-time chat."
    >
      <LiveStreamAdminPanel />
    </AdminPageShell>
  )
}
