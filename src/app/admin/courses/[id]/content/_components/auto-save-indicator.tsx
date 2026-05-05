"use client";

import * as React from "react";
import { IconCheck, IconLoader2, IconAlertTriangle } from "@tabler/icons-react";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface AutoSaveIndicatorProps {
  status: SaveStatus;
  onRetry?: () => void;
}

export function AutoSaveIndicator({ status, onRetry }: AutoSaveIndicatorProps) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (status === "idle") {
      setVisible(false);
      return;
    }

    setVisible(true);

    if (status === "saved") {
      const timer = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  if (!visible) return null;

  return (
    <div className="flex items-center gap-1.5">
      {status === "saving" && (
        <>
          <IconLoader2 className="size-3 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Saving...</span>
        </>
      )}
      {status === "saved" && (
        <>
          <IconCheck className="size-3 text-green-500" />
          <span className="text-xs text-green-600">Saved</span>
        </>
      )}
      {status === "error" && (
        <>
          <IconAlertTriangle className="size-3 text-destructive" />
          <span className="text-xs text-destructive">Failed</span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-xs text-destructive underline"
            >
              Retry
            </button>
          )}
        </>
      )}
    </div>
  );
}
