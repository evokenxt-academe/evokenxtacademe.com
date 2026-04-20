"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconCheck, IconLoader2 } from "@tabler/icons-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

interface MarkLectureCompleteButtonProps {
  lectureId: string;
  isCompleted: boolean;
  watchedSeconds?: number;
}

export function MarkLectureCompleteButton({
  lectureId,
  isCompleted,
  watchedSeconds = 0,
}: MarkLectureCompleteButtonProps) {
  const router = useRouter();
  const [completed, setCompleted] = useState(isCompleted);
  const [isPending, startTransition] = useTransition();

  const handleMarkComplete = () => {
    if (completed || isPending) {
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/student/lectures/${lectureId}/progress`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              isCompleted: true,
              watchedSeconds: Math.max(1, Math.round(watchedSeconds)),
            }),
          },
        );

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;

          toast.error(payload?.error ?? "Could not update lecture progress");
          return;
        }

        setCompleted(true);
        toast.success("Lecture marked as complete");
        router.refresh();
      } catch {
        toast.error("Could not update lecture progress");
      }
    });
  };

  return (
    <Button
      onClick={handleMarkComplete}
      disabled={completed || isPending}
      className="h-12 rounded-xl px-7 font-black text-black"
      variant={completed ? "outline" : "default"}
    >
      {isPending ? (
        <IconLoader2 className="mr-2 size-4 animate-spin" />
      ) : (
        <IconCheck className="mr-2 size-4" />
      )}
      {completed ? "Completed" : "Mark As Complete"}
    </Button>
  );
}
