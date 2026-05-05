"use client";

import { Badge } from "@/components/ui/badge";

type Status = "draft" | "published" | "archived";

const statusConfig: Record<Status, { label: string; variant: "default" | "secondary" | "outline" }> = {
  published: { label: "Published", variant: "default" },
  draft: { label: "Draft", variant: "secondary" },
  archived: { label: "Archived", variant: "outline" },
};

export function StatusBadge({ status }: { status: Status }) {
  const config = statusConfig[status] || statusConfig.draft;
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
