"use client";

import { useState } from "react";
import { IconCheck, IconCopy } from "@tabler/icons-react";

export function CodeBlock({ code, lang = "bash" }: { code: string; lang?: string }): React.JSX.Element {
  const [copied, setCopied] = useState(false);

  return (
    <div className="group relative rounded-lg border bg-card overflow-hidden my-4">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
        <span className="text-xs text-muted-foreground font-mono">{lang}</span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Copy code"
        >
          {copied ? (
            <IconCheck className="size-3.5" />
          ) : (
            <IconCopy className="size-3.5" />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}
