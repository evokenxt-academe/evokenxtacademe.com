"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconLoader2, IconCheck, IconX, IconPlus } from "@tabler/icons-react";
import { generateSlug } from "@/lib/utils/slug";

import { StepProgram } from "./step-program";
import { CoursePreviewCard } from "./course-preview-card";
import {
  courseBaseSchema,
  type CourseFormValues,
} from "@/lib/validators/course";
import {
  createCourse,
  checkSlugUnique,
} from "@/lib/supabase/queries/courses-admin";

export function CreateCourseForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [userEditedSlug, setUserEditedSlug] = React.useState(false);
  const [slugStatus, setSlugStatus] = React.useState<"idle" | "checking" | "unique" | "taken">("idle");
  const slugTimeout = React.useRef<NodeJS.Timeout | null>(null);

  const form = useForm<CourseFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(courseBaseSchema) as any,
    defaultValues: {
      subject_id: "",
      instructor_id: "",
      title: "",
      slug: "",
      short_description: "",
      description: "",
      language: "en",
      status: "draft",
      is_featured: false,
      thumbnail_url: "",
      preview_video_url: "",
      what_you_learn: [],
      requirements: [],
    },
    mode: "onChange",
  });

  const title = form.watch("title");
  const slug = form.watch("slug");

  // Auto-generate slug from title
  React.useEffect(() => {
    if (!userEditedSlug) {
      const generated = title ? generateSlug(title) : "";
      form.setValue("slug", generated, { shouldValidate: true, shouldDirty: true });
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

  const handleSubmit = async () => {
    const isValid = await form.trigger(["title", "slug", "subject_id", "instructor_id"]);
    if (!isValid || slugStatus === "taken") {
      toast.error("Please fill in all required fields and ensure the slug is unique.");
      return;
    }

    setSubmitting(true);
    try {
      const vals = form.getValues();
      const courseData: Record<string, unknown> = {
        subject_id: vals.subject_id,
        instructor_id: vals.instructor_id,
        title: vals.title,
        slug: vals.slug,
        short_description: vals.short_description || null,
        description: vals.description || null,
        language: vals.language,
        status: "draft",
        is_featured: vals.is_featured,
        thumbnail_url: vals.thumbnail_url || null,
        preview_video_url: vals.preview_video_url || null,
        what_you_learn: vals.what_you_learn,
        requirements: vals.requirements,
      };

      const result = await createCourse(courseData);
      toast.success("Course created successfully!");
      router.push(`/admin/courses/${result.id}/edit`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create course";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-6">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Course Details</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Provide the basic information to create this course. You can add content, pricing, and media later.
          </p>
        </div>

        <Separator className="mb-6" />

        <div className="flex flex-col gap-6">
          {/* Title */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium">Course Title <span className="text-destructive">*</span></Label>
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
            <Label className="text-sm font-medium">URL Slug <span className="text-destructive">*</span></Label>
            <div className="flex items-center gap-2">
              <span className="rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">
                /course/
              </span>
              <div className="relative flex-1">
                <Input
                  {...form.register("slug")}
                  value={slug || ""}
                  onChange={(e) => {
                    form.setValue("slug", e.target.value, { shouldValidate: true, shouldDirty: true });
                    setUserEditedSlug(true);
                  }}
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
          </div>

          <Separator className="my-2" />
          
          <StepProgram form={form} />
        </div>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-end">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || slugStatus === "taken" || slugStatus === "checking"}
            className="w-full sm:w-auto"
          >
            {submitting ? (
              <Spinner className="mr-2" />
            ) : (
              <IconPlus className="mr-2 size-4" />
            )}
            {submitting ? "Creating..." : "Create Course"}
          </Button>
        </div>
      </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="sticky top-6">
          <CoursePreviewCard values={form.watch()} />
        </div>
      </div>
    </div>
  );
}
