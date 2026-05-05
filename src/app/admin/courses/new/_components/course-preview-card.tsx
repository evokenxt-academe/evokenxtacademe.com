"use client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/admin/courses/status-badge";
import type { CourseFormValues } from "@/lib/validators/course";

interface CoursePreviewCardProps {
  values: Partial<CourseFormValues>;
}

const langLabels: Record<string, string> = {
  en: "English",
  hi: "Hindi",
  "hi-en": "Hinglish",
};

export function CoursePreviewCard({ values }: CoursePreviewCardProps) {
  return (
    <div className="flex flex-col gap-0 overflow-hidden rounded-lg border bg-card">
      {/* Header label */}
      <div className="px-4 py-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Live Preview
        </span>
      </div>
      <Separator />

      {/* Thumbnail */}
      {values.thumbnail_url ? (
        <img
          src={values.thumbnail_url}
          alt="Course thumbnail"
          className="aspect-video w-full object-cover"
        />
      ) : (
        <div className="flex aspect-video w-full items-center justify-center bg-muted">
          <span className="text-3xl font-bold text-muted-foreground/30">
            {values.title?.charAt(0)?.toUpperCase() || "?"}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-3 p-4">
        {/* Title */}
        <h3 className="text-base font-semibold leading-tight">
          {values.title || "Course Title"}
        </h3>

        {/* Short description */}
        {values.short_description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {values.short_description}
          </p>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5">
          {values.status && <StatusBadge status={values.status} />}
          {values.language && (
            <Badge variant="secondary">
              {langLabels[values.language] || values.language}
            </Badge>
          )}
          {values.is_featured && (
            <Badge variant="outline">Featured</Badge>
          )}
        </div>

        {/* Outcomes preview */}
        {values.what_you_learn && values.what_you_learn.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {values.what_you_learn.length} learning outcome{values.what_you_learn.length !== 1 ? "s" : ""}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
