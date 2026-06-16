"use client";

import { Button } from "@/components/ui/button";
import { IconTrash, IconUpload, IconArchive } from "@tabler/icons-react";

interface BulkActionsBarProps {
  count: number;
  onPublish: () => void;
  onArchive: () => void;
  onDelete: () => void;
  loading?: boolean;
}

export function BulkActionsBar({
  count,
  onPublish,
  onArchive,
  onDelete,
  loading,
}: BulkActionsBarProps) {
  if (count === 0) return null;

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card px-4 py-3 sm:flex-row sm:items-center">
      <span className="text-sm font-medium">
        {count} course{count !== 1 ? "s" : ""} selected
      </span>
      <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={onPublish}
          disabled={loading}
        >
          <IconUpload data-icon="inline-start" />
          Publish
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onArchive}
          disabled={loading}
        >
          <IconArchive data-icon="inline-start" />
          Archive
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          disabled={loading}
        >
          <IconTrash data-icon="inline-start" />
          Delete
        </Button>
      </div>
    </div>
  );
}
