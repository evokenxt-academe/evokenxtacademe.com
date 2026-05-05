"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { IconCheck, IconX, IconLoader2 } from "@tabler/icons-react";
import { generateSlug } from "@/lib/utils/slug";
import { checkSlugUnique } from "@/lib/supabase/queries/courses-admin";
import type { UseFormReturn } from "react-hook-form";
import type { CourseFormValues } from "@/lib/validators/course";

interface StepDetailsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<CourseFormValues, any, any>;
}

export function StepDetails({ form }: StepDetailsProps) {
  const [userEditedSlug, setUserEditedSlug] = React.useState(false);
  const [slugStatus, setSlugStatus] = React.useState<"idle" | "checking" | "unique" | "taken">("idle");
  const slugTimeout = React.useRef<NodeJS.Timeout | null>(null);

  const title = form.watch("title");
  const slug = form.watch("slug");
  const shortDesc = form.watch("short_description") || "";
  const status = form.watch("status");
  const isFeatured = form.watch("is_featured");

  // Auto-generate slug from title
  React.useEffect(() => {
    if (!userEditedSlug && title) {
      const generated = generateSlug(title);
      form.setValue("slug", generated, { shouldValidate: true });
    }
  }, [title, userEditedSlug, form]);

  // Debounced slug uniqueness check
  React.useEffect(() => {
    if (!slug || slug.length < 3) {
      setSlugStatus("idle");
      return;
    }
    setSlugStatus("checking");
    if (slugTimeout.current) clearTimeout(slugTimeout.current);
    slugTimeout.current = setTimeout(async () => {
      try {
        const isUnique = await checkSlugUnique(slug);
        setSlugStatus(isUnique ? "unique" : "taken");
      } catch {
        setSlugStatus("idle");
      }
    }, 500);
  }, [slug]);

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">Course Title</Label>
        <Input
          {...form.register("title")}
          placeholder="e.g. ACCA Business & Technology Complete Course"
          maxLength={150}
        />
        <div className="flex items-center justify-between">
          {form.formState.errors.title ? (
            <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
          ) : (
            <span />
          )}
          <span className="text-xs text-muted-foreground tabular-nums">
            {(title || "").length}/150
          </span>
        </div>
      </div>

      {/* Slug */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">URL Slug</Label>
        <div className="flex items-center gap-2">
          <span className="rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">
            /courses/
          </span>
          <div className="relative flex-1">
            <Input
              {...form.register("slug", {
                onChange: () => setUserEditedSlug(true),
              })}
              placeholder="course-slug"
              className="pr-8"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
              {slugStatus === "checking" && (
                <IconLoader2 className="size-4 animate-spin text-muted-foreground" />
              )}
              {slugStatus === "unique" && (
                <IconCheck className="size-4 text-green-500" />
              )}
              {slugStatus === "taken" && (
                <IconX className="size-4 text-destructive" />
              )}
            </div>
          </div>
        </div>
        {form.formState.errors.slug && (
          <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p>
        )}
        {slugStatus === "taken" && (
          <p className="text-xs text-destructive">This slug is already taken</p>
        )}
        {slugStatus === "unique" && (
          <p className="text-xs text-green-600">Slug is available</p>
        )}
      </div>

      {/* Short Description */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">Short Description</Label>
        <Textarea
          {...form.register("short_description")}
          placeholder="Brief description shown on course cards"
          rows={2}
          maxLength={200}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Shown on course cards and search results</p>
          <span className="text-xs text-muted-foreground tabular-nums">
            {shortDesc.length}/200
          </span>
        </div>
      </div>

      {/* Full Description */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">Full Description</Label>
        <Textarea
          {...form.register("description")}
          placeholder="Detailed description of the course content and structure"
          rows={6}
        />
      </div>

      {/* Language */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">Language</Label>
        <Select
          value={form.watch("language") || "en"}
          onValueChange={(val) => form.setValue("language", val as "en" | "hi" | "hi-en")}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="hi">Hindi</SelectItem>
              <SelectItem value="hi-en">Hinglish</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Status */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">Course Status</Label>
        <RadioGroup
          value={status}
          onValueChange={(val) => form.setValue("status", val as "draft" | "published" | "archived")}
          className="flex gap-3"
        >
          <label className={`flex flex-1 cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${status === "draft" ? "border-primary bg-primary/5" : ""}`}>
            <RadioGroupItem value="draft" />
            <div>
              <p className="text-sm font-medium">Draft</p>
              <p className="text-xs text-muted-foreground">Save without publishing</p>
            </div>
          </label>
          <label className={`flex flex-1 cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${status === "published" ? "border-primary bg-primary/5" : ""}`}>
            <RadioGroupItem value="published" />
            <div>
              <p className="text-sm font-medium">Published</p>
              <p className="text-xs text-muted-foreground">Make visible to students</p>
            </div>
          </label>
        </RadioGroup>
      </div>

      {/* Featured */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <Label className="text-sm font-medium">Featured Course</Label>
          <p className="text-xs text-muted-foreground">
            Show this course in featured sections
          </p>
        </div>
        <Switch
          checked={isFeatured}
          onCheckedChange={(val) => form.setValue("is_featured", val)}
        />
      </div>
    </div>
  );
}
