"use client";

import { Check, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PipelineStepStatus } from "@/types/live-stream";

type Step = {
  id: number;
  label: string;
  status: PipelineStepStatus;
};

type PipelineStatusProps = {
  steps: Step[];
};

function StepIcon({ status }: { status: PipelineStepStatus }) {
  if (status === "done") {
    return (
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
        <Check className="size-3" strokeWidth={2.5} />
      </span>
    );
  }
  if (status === "in_progress") {
    return (
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400">
        <Loader2 className="size-3 animate-spin" />
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive">
        <Circle className="size-2 fill-current" />
      </span>
    );
  }
  return (
    <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-border/80 bg-muted/40">
      <Circle className="size-2 text-muted-foreground/50" />
    </span>
  );
}

export function PipelineStatus({ steps }: PipelineStatusProps) {
  const doneCount = steps.filter((s) => s.status === "done").length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Setup progress
        </p>
        <span className="text-xs tabular-nums text-muted-foreground">
          {doneCount}/{steps.length}
        </span>
      </div>

      <div className="h-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>

      <ol className="flex flex-col gap-2">
        {steps.map((step) => (
          <li key={step.id} className="flex items-center gap-2.5">
            <StepIcon status={step.status} />
            <span
              className={cn(
                "text-sm",
                step.status === "done" && "text-muted-foreground",
                step.status === "in_progress" && "font-medium text-foreground",
                step.status === "pending" && "text-muted-foreground/70",
                step.status === "error" && "font-medium text-destructive",
              )}
            >
              {step.label}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
