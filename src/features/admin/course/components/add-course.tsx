"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  IconInfoCircle,
  IconLayersIntersect,
  IconTag,
  IconRocket,
  IconCheck,
  IconArrowLeft,
  IconArrowRight,
  IconDeviceFloppy,
  IconSend,
  IconTemplate,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { adminApi } from "@/features/admin/lib/admin-api";
import { useCourseForm } from "../hooks/use-course-form";
import { submitCourse } from "../services/course-api";
import type { CourseFormData, StepId } from "../types/course";
import { BasicInfoStep } from "./steps/basic-info-step";
import { CurriculumStep } from "./steps/curriculum-step";
import { PricingStep } from "./steps/pricing-step";
import { PublishStep } from "./steps/publish-step";
import { getACCACourseData } from "../data/acca-course";

// ─────────────────────────────────────────────────────────────
// Step configuration
// ─────────────────────────────────────────────────────────────

const STEPS: {
  id: StepId;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: "basic-info",
    label: "Basic Information",
    shortLabel: "Basics",
    icon: IconInfoCircle,
  },
  {
    id: "curriculum",
    label: "Curriculum Builder",
    shortLabel: "Curriculum",
    icon: IconLayersIntersect,
  },
  {
    id: "pricing",
    label: "Pricing",
    shortLabel: "Pricing",
    icon: IconTag,
  },
  {
    id: "publish",
    label: "Publish Settings",
    shortLabel: "Publish",
    icon: IconRocket,
  },
];

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

function buildEditableCourseFormData(
  preview: Awaited<ReturnType<typeof adminApi.getCoursePreview>>["course"],
): CourseFormData {
  return {
    name: preview.name,
    slug: preview.slug,
    description: preview.description,
    level: preview.level as CourseFormData["level"],
    thumbnailUrl: preview.thumbnailUrl,
    thumbnailFile: null,
    instructorId: preview.instructor.id,
    sections: preview.sections.map((section: any) => ({
      id: String(section.id),
      courseId: String(preview.id),
      title: section.title,
      position: section.position,
      isCollapsed: false,
      lectures: section.lectures.map((lecture: any) => ({
        id: String(lecture.id),
        sectionId: String(section.id),
        title: lecture.title,
        videoUrl: lecture.videoUrl,
        description: lecture.description,
        durationSec: lecture.durationSec,
        position: lecture.position,
        isPreview: lecture.isPreview,
        resources: lecture.resources.map((resource: any) => ({
          id: String(resource.id),
          lectureId: String(lecture.id),
          title: resource.title,
          fileUrl: resource.fileUrl,
          file: null,
        })),
      })),
    })),
    price: preview.price,
    discountPrice: preview.discountPrice ?? 0,
    status: preview.status as CourseFormData["status"],
  };
}

export function AddCourse({ courseId }: { courseId?: string }) {
  const form = useCourseForm();
  const router = useRouter();
  const [submitError, setSubmitError] = useState("");
  const isEditMode = typeof courseId === "string";
  const { loadCourseData } = form;
  const { data: editData, isLoading: isLoadingEditCourse } = useQuery({
    queryKey: ["admin-course-editor", courseId],
    queryFn: () => adminApi.getCoursePreview(courseId as string),
    enabled: isEditMode,
  });

  useEffect(() => {
    if (editData?.course) {
      loadCourseData(buildEditableCourseFormData(editData.course));
    }
  }, [editData?.course, loadCourseData]);

  const progressPercent = ((form.currentStepIndex + 1) / STEPS.length) * 100;

  const handleNext = useCallback(() => {
    if (form.validateStep(form.currentStep)) {
      form.goNext();
    }
  }, [form]);

  const handleSubmit = useCallback(async () => {
    if (!form.validateStep(form.currentStep)) return;

    form.setIsSubmitting(true);
    setSubmitError("");

    try {
      const result = await submitCourse(form.formData, courseId);

      if (result.success) {
        router.push("/admin/course");
      } else {
        setSubmitError(result.error || "Failed to save course");
      }
    } catch (err) {
      console.error("Failed to submit course:", err);
      setSubmitError("An unexpected error occurred");
    } finally {
      form.setIsSubmitting(false);
    }
  }, [courseId, form, router]);

  const handleSaveDraft = useCallback(async () => {
    form.updateField("status", "draft");
    form.setIsSubmitting(true);
    setSubmitError("");

    try {
      const result = await submitCourse(
        { ...form.formData, status: "draft" },
        courseId,
      );

      if (result.success) {
        router.push("/admin/course");
      } else {
        setSubmitError(result.error || "Failed to save draft");
      }
    } catch (err) {
      console.error("Failed to save draft:", err);
      setSubmitError("An unexpected error occurred");
    } finally {
      form.setIsSubmitting(false);
    }
  }, [courseId, form, router]);

  const isLastStep = form.currentStepIndex === STEPS.length - 1;
  const isFirstStep = form.currentStepIndex === 0;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      {/* ── Page Header ─────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditMode ? "Edit Course" : "Create New Course"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEditMode
              ? "Update your curriculum, pricing, and publish settings."
              : "Build your course step by step — save as draft anytime"}
          </p>
        </div>
        {!isEditMode ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => form.loadCourseData(getACCACourseData())}
            className="shrink-0"
          >
            <IconTemplate data-icon="inline-start" />
            Load ACCA Template
          </Button>
        ) : null}
      </div>

      {/* ── Progress Bar ────────────────────────────── */}
      <Progress value={progressPercent} className="h-1.5" />

      {/* ── Step Navigation ─────────────────────────── */}
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar Steps (desktop) / Horizontal Steps (mobile) */}
        <nav
          className="flex shrink-0 gap-1 overflow-x-auto lg:w-56 lg:flex-col"
          aria-label="Course creation steps"
        >
          {STEPS.map((step, index) => {
            const isActive = form.currentStep === step.id;
            const isCompleted = index < form.currentStepIndex;
            const StepIcon = step.icon;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => form.goToStep(step.id)}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all",
                  "hover:bg-accent",
                  isActive && "bg-primary/10 font-medium text-primary",
                  !isActive && !isCompleted && "text-muted-foreground",
                  isCompleted && !isActive && "text-foreground",
                )}
              >
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg border transition-colors",
                    isActive && "border-primary/30 bg-primary/15 text-primary",
                    isCompleted &&
                      !isActive &&
                      "border-primary/20 bg-primary/10 text-primary",
                    !isActive &&
                      !isCompleted &&
                      "border-border bg-muted/50 text-muted-foreground",
                  )}
                >
                  {isCompleted && !isActive ? (
                    <IconCheck className="size-4" />
                  ) : (
                    <StepIcon className="size-4" />
                  )}
                </div>
                <div className="hidden flex-col lg:flex">
                  <span className="text-xs text-muted-foreground">
                    Step {index + 1}
                  </span>
                  <span className="text-sm leading-tight">
                    {step.shortLabel}
                  </span>
                </div>
                {/* Mobile label */}
                <span className="text-xs lg:hidden">{step.shortLabel}</span>
              </button>
            );
          })}
        </nav>

        {/* ── Step Content ─────────────────────────── */}
        <div className="min-w-0 flex-1">
          <div className="rounded-xl border bg-card p-6 ring-1 ring-foreground/5 sm:p-8">
            {isLoadingEditCourse ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner />
                Loading course details...
              </div>
            ) : null}
            {form.currentStep === "basic-info" && (
              <BasicInfoStep
                formData={form.formData}
                errors={form.errors}
                updateField={form.updateField}
                updateName={form.updateName}
              />
            )}

            {form.currentStep === "curriculum" && (
              <CurriculumStep
                formData={form.formData}
                errors={form.errors}
                addSection={form.addSection}
                updateSection={form.updateSection}
                deleteSection={form.deleteSection}
                toggleSectionCollapse={form.toggleSectionCollapse}
                reorderSections={form.reorderSections}
                addLecture={form.addLecture}
                updateLecture={form.updateLecture}
                deleteLecture={form.deleteLecture}
                reorderLectures={form.reorderLectures}
                addResource={form.addResource}
                updateResource={form.updateResource}
                deleteResource={form.deleteResource}
                stats={form.stats}
              />
            )}

            {form.currentStep === "pricing" && (
              <PricingStep
                formData={form.formData}
                errors={form.errors}
                stats={form.stats}
                updateField={form.updateField}
              />
            )}

            {form.currentStep === "publish" && (
              <PublishStep
                formData={form.formData}
                updateField={form.updateField}
                stats={form.stats}
              />
            )}
          </div>

          {/* ── Error Banner ─────────────────────── */}
          {submitError && (
            <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {submitError}
            </div>
          )}

          {/* ── Footer Navigation ───────────────── */}
          <Separator className="my-6" />

          <div className="flex items-center justify-between gap-3">
            {/* Left: Back + Save Draft */}
            <div className="flex items-center gap-2">
              {!isFirstStep && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={form.goPrev}
                  disabled={form.isSubmitting}
                >
                  <IconArrowLeft data-icon="inline-start" />
                  Back
                </Button>
              )}

              <Button
                type="button"
                variant="ghost"
                onClick={handleSaveDraft}
                disabled={form.isSubmitting}
              >
                {form.isSubmitting ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <IconDeviceFloppy data-icon="inline-start" />
                )}
                Save Draft
              </Button>
            </div>

            {/* Right: Next / Submit */}
            {isLastStep ? (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={form.isSubmitting}
              >
                {form.isSubmitting ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <IconSend data-icon="inline-start" />
                )}
                {form.formData.status === "published"
                  ? "Publish Course"
                  : "Save as Draft"}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleNext}
                disabled={form.isSubmitting}
              >
                Continue
                <IconArrowRight data-icon="inline-end" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
