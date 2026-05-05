"use client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/admin/courses/status-badge";
import { IconCheck, IconX } from "@tabler/icons-react";
import type { UseFormReturn } from "react-hook-form";
import type { CourseFormValues } from "@/lib/validators/course";

interface StepReviewProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<CourseFormValues, any, any>;
  onGoToStep: (step: number) => void;
}

const langLabels: Record<string, string> = {
  en: "English",
  hi: "Hindi",
  "hi-en": "Hinglish",
};

export function StepReview({ form, onGoToStep }: StepReviewProps) {
  const values = form.getValues();

  return (
    <div className="flex flex-col gap-6">
      {/* Program & Subject */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Program & Subject
          </p>
          <button
            type="button"
            onClick={() => onGoToStep(0)}
            className="text-xs text-primary hover:underline"
          >
            Edit
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {values.subject_id ? (
            <Badge variant="outline">Subject selected ✓</Badge>
          ) : (
            <Badge variant="destructive">Subject not selected</Badge>
          )}
          {values.instructor_id ? (
            <Badge variant="outline">Instructor selected ✓</Badge>
          ) : (
            <Badge variant="destructive">Instructor not selected</Badge>
          )}
        </div>
      </div>

      <Separator />

      {/* Course Info */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Course Info
          </p>
          <button
            type="button"
            onClick={() => onGoToStep(1)}
            className="text-xs text-primary hover:underline"
          >
            Edit
          </button>
        </div>
        <div className="flex flex-col gap-2 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium">{values.title || "Untitled"}</span>
            <StatusBadge status={values.status} />
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            /courses/{values.slug || "—"}
          </span>
          {values.short_description && (
            <p className="mt-1 text-sm text-muted-foreground">{values.short_description}</p>
          )}
          <div className="mt-2 flex gap-2">
            <Badge variant="secondary">{langLabels[values.language] || values.language}</Badge>
            {values.is_featured && <Badge variant="default">Featured</Badge>}
          </div>
        </div>
      </div>

      <Separator />

      {/* Media */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Media
          </p>
          <button
            type="button"
            onClick={() => onGoToStep(2)}
            className="text-xs text-primary hover:underline"
          >
            Edit
          </button>
        </div>
        <div className="flex gap-4">
          {values.thumbnail_url ? (
            <img
              src={values.thumbnail_url}
              alt="Thumbnail"
              className="h-20 w-36 rounded-md object-cover"
            />
          ) : (
            <div className="flex h-20 w-36 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
              No thumbnail
            </div>
          )}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              {values.thumbnail_url ? (
                <IconCheck className="size-4 text-green-500" />
              ) : (
                <IconX className="size-4 text-muted-foreground" />
              )}
              <span className="text-sm">Thumbnail</span>
            </div>
            <div className="flex items-center gap-2">
              {values.preview_video_url ? (
                <IconCheck className="size-4 text-green-500" />
              ) : (
                <IconX className="size-4 text-muted-foreground" />
              )}
              <span className="text-sm">Preview video</span>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Outcomes */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Learning Outcomes
          </p>
          <button
            type="button"
            onClick={() => onGoToStep(3)}
            className="text-xs text-primary hover:underline"
          >
            Edit
          </button>
        </div>
        {values.what_you_learn?.length > 0 ? (
          <ul className="flex flex-col gap-1">
            {values.what_you_learn.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <IconCheck className="mt-0.5 size-4 shrink-0 text-green-500" />
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No outcomes added</p>
        )}
        {values.requirements?.length > 0 && (
          <>
            <p className="mt-2 text-xs font-medium text-muted-foreground">Prerequisites:</p>
            <ul className="flex flex-col gap-1">
              {values.requirements.map((item, idx) => (
                <li key={idx} className="text-sm text-muted-foreground">
                  • {item}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
