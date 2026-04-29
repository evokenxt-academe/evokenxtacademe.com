"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";

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
  const queryClient = useQueryClient();
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

  const submitMutation = useMutation({
    mutationFn: ({ payload, currentCourseId }: { payload: CourseFormData; currentCourseId?: string }) =>
      submitCourse(payload, currentCourseId),
    onSuccess: async (result, variables) => {
      if (!result.success) {
        setSubmitError(result.error || "Failed to save course");
        return;
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-courses"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-course-editor", variables.currentCourseId] }),
      ]);

      toast.success(
        variables.payload.status === "published"
          ? "Course published successfully"
          : "Course draft saved successfully"
      );
      router.push("/admin/course");
    },
    onError: () => {
      setSubmitError("An unexpected error occurred");
    },
  });

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
      // Use the actual UUID if available from the loaded data, otherwise fallback to the URL param
      const actualCourseId = editData?.course?.id || courseId;
      await submitMutation.mutateAsync({
        payload: form.formData,
        currentCourseId: actualCourseId,
      });
    } catch (err) {
      console.error("Failed to submit course:", err);
      setSubmitError("An unexpected error occurred");
    } finally {
      form.setIsSubmitting(false);
    }
  }, [courseId, editData?.course?.id, form, submitMutation]);

  const handleSaveDraft = useCallback(async () => {
    form.updateField("status", "draft");
    form.setIsSubmitting(true);
    setSubmitError("");

    try {
      const actualCourseId = editData?.course?.id || courseId;
      await submitMutation.mutateAsync({
        payload: { ...form.formData, status: "draft" },
        currentCourseId: actualCourseId,
      });
    } catch (err) {
      console.error("Failed to save draft:", err);
      setSubmitError("An unexpected error occurred");
    } finally {
      form.setIsSubmitting(false);
    }
  }, [courseId, editData?.course?.id, form, submitMutation]);

  const isLastStep = form.currentStepIndex === STEPS.length - 1;
  const isFirstStep = form.currentStepIndex === 0;
  const activeStepMeta = STEPS[form.currentStepIndex];
  const ActiveStepIcon = activeStepMeta.icon;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-1 sm:px-2">
      {/* ── Page Header ─────────────────────────────── */}
      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">ACCA Course Studio</Badge>
                <Badge variant="secondary">
                  Step {form.currentStepIndex + 1} of {STEPS.length}
                </Badge>
              </div>
              <CardTitle className="text-2xl">
                {isEditMode ? "Edit Course" : "Create New Course"}
              </CardTitle>
              <CardDescription>
                {isEditMode
                  ? "Update your curriculum, pricing, and publish settings."
                  : "Build your course with enterprise-grade structure for ACCA learners."}
              </CardDescription>
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
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Workflow progress</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-1.5" />
          </div>
        </CardHeader>
      </Card>

      {/* Mobile current step pill */}
      <div className="flex items-center gap-2 lg:hidden">
        <ActiveStepIcon className="size-4 text-primary" />
        <p className="text-sm font-medium">{activeStepMeta.label}</p>
        <Badge variant="outline" className="ml-auto">
          {form.currentStepIndex + 1}/{STEPS.length}
        </Badge>
      </div>

      {/* ── Step Navigation + Content ─────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <Card className="h-fit lg:sticky lg:top-24">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Course Workflow</CardTitle>
            <CardDescription>Navigate each stage and complete required fields.</CardDescription>
          </CardHeader>
          <CardContent>
            <nav
              className="flex gap-1 overflow-x-auto lg:flex-col"
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
                      "group flex min-w-fit items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all",
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
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Step {index + 1}</span>
                      <span className="text-sm leading-tight">{step.shortLabel}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </CardContent>
        </Card>

        <div className="min-w-0">
          <Card>
            <CardContent className="p-5 sm:p-8">
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
            </CardContent>
          </Card>

          {/* ── Error Banner ─────────────────────── */}
          {submitError && (
            <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {submitError}
            </div>
          )}

          {/* ── Footer Navigation ───────────────── */}
          <Separator className="my-6" />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                className="w-full sm:w-auto"
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
                className="w-full sm:w-auto"
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
