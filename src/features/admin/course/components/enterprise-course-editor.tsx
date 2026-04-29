"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IconArrowLeft,
  IconCheck,
  IconClock,
  IconDeviceFloppy,
  IconExternalLink,
  IconFileText,
  IconInfoCircle,
  IconLayersIntersect,
  IconPhoto,
  IconRocket,
  IconTag,
} from "@tabler/icons-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { cn } from "@/lib/utils";
import { adminApi } from "@/features/admin/lib/admin-api";
import { useCourseForm } from "../hooks/use-course-form";
import { submitCourse } from "../services/course-api";
import type { CourseFormData, StepId } from "../types/course";
import type { AdminCoursePreview } from "../types/course-preview";
import { BasicInfoStep } from "./steps/basic-info-step";
import { CurriculumStep } from "./steps/curriculum-step";
import { PricingStep } from "./steps/pricing-step";
import { PublishStep } from "./steps/publish-step";
import { toast } from "sonner";

type EnterpriseCourseEditorProps = {
  courseId: string;
};

type StepMeta = {
  id: StepId;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const STEP_META: StepMeta[] = [
  { id: "basic-info", label: "Basics", icon: IconInfoCircle },
  { id: "curriculum", label: "Curriculum", icon: IconLayersIntersect },
  { id: "pricing", label: "Pricing", icon: IconTag },
  { id: "publish", label: "Publish", icon: IconRocket },
];

function formatDuration(seconds: number): string {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `< 1m`;
}

function formatDate(value?: string | null): string {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function buildEditableCourseFormData(
  preview: AdminCoursePreview,
): CourseFormData {
  return {
    name: preview.name,
    slug: preview.slug,
    description: preview.description,
    level: preview.level as CourseFormData["level"],
    thumbnailUrl: preview.thumbnailUrl,
    thumbnailFile: null,
    instructorId: preview.instructor.id,
    sections: preview.sections.map((section) => ({
      id: String(section.id),
      courseId: String(preview.id),
      title: section.title,
      position: section.position,
      isCollapsed: false,
      lectures: section.lectures.map((lecture) => ({
        id: String(lecture.id),
        sectionId: String(section.id),
        title: lecture.title,
        videoUrl: lecture.videoUrl,
        description: lecture.description,
        durationSec: lecture.durationSec,
        position: lecture.position,
        isPreview: lecture.isPreview,
        resources: lecture.resources.map((resource) => ({
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

export function EnterpriseCourseEditor({
  courseId,
}: EnterpriseCourseEditorProps) {
  const form = useCourseForm();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState("");
  const [hasLoadedCourse, setHasLoadedCourse] = useState(false);

  const {
    data: editData,
    isLoading: isLoadingCourse,
    error: courseError,
  } = useQuery({
    queryKey: ["admin-course-editor", courseId],
    queryFn: () => adminApi.getCoursePreview(courseId),
    enabled: !!courseId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const coursePreview = editData?.course;

  useEffect(() => {
    if (!hasLoadedCourse && coursePreview) {
      form.loadCourseData(buildEditableCourseFormData(coursePreview));
      setHasLoadedCourse(true);
    }
  }, [coursePreview, form, hasLoadedCourse]);

  const submitMutation = useMutation({
    mutationFn: ({
      payload,
      currentCourseId,
    }: {
      payload: CourseFormData;
      currentCourseId?: string;
    }) => submitCourse(payload, currentCourseId),
    onSuccess: async (result, variables) => {
      if (!result.success) {
        setSubmitError(result.error || "Failed to save course");
        return;
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-courses"] }),
        queryClient.invalidateQueries({
          queryKey: ["admin-course-editor", variables.currentCourseId],
        }),
      ]);

      toast.success(
        variables.payload.status === "published"
          ? "Course published successfully"
          : "Course saved successfully",
      );
      router.push("/admin/course");
    },
    onError: () => {
      setSubmitError("An unexpected error occurred");
    },
  });

  const currentStepMeta = STEP_META[form.currentStepIndex] ?? STEP_META[0];
  const viewCourseHref = coursePreview?.slug
    ? `/admin/course/${coursePreview.slug}`
    : `/admin/course/${courseId}`;

  const publishChecks = useMemo(
    () => [
      { label: "Course title", ok: !!form.formData.name.trim() },
      { label: "Description", ok: !!form.formData.description.trim() },
      { label: "Thumbnail", ok: !!form.formData.thumbnailUrl.trim() },
      {
        label: "Curriculum",
        ok: form.stats.totalSections > 0 && form.stats.totalLectures > 0,
      },
      {
        label: "Pricing",
        ok:
          form.formData.price === 0 ||
          form.formData.discountPrice === 0 ||
          form.formData.discountPrice <= form.formData.price,
      },
    ],
    [form.formData, form.stats.totalLectures, form.stats.totalSections],
  );

  const readyCount = publishChecks.filter((check) => check.ok).length;
  const readinessPercent = Math.round(
    (readyCount / publishChecks.length) * 100,
  );

  const handleSaveChanges = useCallback(async () => {
    if (!form.validateStep(form.currentStep)) return;

    form.setIsSubmitting(true);
    setSubmitError("");

    try {
      const actualCourseId = coursePreview?.id || courseId;
      await submitMutation.mutateAsync({
        payload: form.formData,
        currentCourseId: actualCourseId,
      });
    } catch (error) {
      console.error("Failed to save course:", error);
      setSubmitError("An unexpected error occurred");
    } finally {
      form.setIsSubmitting(false);
    }
  }, [courseId, coursePreview?.id, form, submitMutation]);

  const handleSaveDraft = useCallback(async () => {
    form.setIsSubmitting(true);
    setSubmitError("");

    try {
      const actualCourseId = coursePreview?.id || courseId;
      await submitMutation.mutateAsync({
        payload: { ...form.formData, status: "draft" },
        currentCourseId: actualCourseId,
      });
    } catch (error) {
      console.error("Failed to save draft:", error);
      setSubmitError("An unexpected error occurred");
    } finally {
      form.setIsSubmitting(false);
    }
  }, [courseId, coursePreview?.id, form, submitMutation]);

  if (courseError) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 lg:py-8">
        <Alert variant="destructive">
          <AlertDescription>
            {(courseError as Error).message || "Failed to load course editor"}
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline" className="w-fit">
          <Link href="/admin/course">
            <IconArrowLeft data-icon="inline-start" />
            Back to courses
          </Link>
        </Button>
      </div>
    );
  }

  if (isLoadingCourse && !hasLoadedCourse) {
    return <CourseEditorSkeleton />;
  }

  const thumbnailUrl =
    form.formData.thumbnailUrl || coursePreview?.thumbnailUrl || "";

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 lg:py-8">
      <Card className="overflow-hidden border-border/70 shadow-sm">
        <CardHeader className="gap-5 border-b bg-muted/20 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">Enterprise editor</Badge>
                <Badge
                  variant={
                    form.formData.status === "published"
                      ? "default"
                      : "secondary"
                  }
                  className="capitalize"
                >
                  {form.formData.status}
                </Badge>
                <Badge variant="secondary">
                  Step {form.currentStepIndex + 1} of {STEP_META.length}
                </Badge>
              </div>
              <div className="space-y-1">
                <CardTitle className="text-2xl sm:text-3xl">
                  {form.formData.name || coursePreview?.name || "Edit course"}
                </CardTitle>
                <CardDescription className="max-w-2xl">
                  A focused workspace for course metadata, curriculum, pricing,
                  and publish state. Built for fast, low-friction admin updates.
                </CardDescription>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="outline">
                <Link href="/admin/course">
                  <IconArrowLeft data-icon="inline-start" />
                  Back to courses
                </Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href={viewCourseHref}>
                  <IconExternalLink data-icon="inline-start" />
                  Open course
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={IconLayersIntersect}
              label="Sections"
              value={String(form.stats.totalSections)}
            />
            <MetricCard
              icon={IconFileText}
              label="Lectures"
              value={String(form.stats.totalLectures)}
            />
            <MetricCard
              icon={IconPhoto}
              label="Resources"
              value={String(form.stats.totalResources)}
            />
            <MetricCard
              icon={IconClock}
              label="Duration"
              value={formatDuration(form.stats.totalDuration)}
            />
          </div>

          <div className="rounded-2xl border bg-background/80 p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Publish readiness</span>
              <span>
                {readyCount}/{publishChecks.length} complete
              </span>
            </div>
            <Progress value={readinessPercent} className="mt-3 h-1.5" />
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {publishChecks.map((check) => (
                <ChecklistRow
                  key={check.label}
                  label={check.label}
                  ok={check.ok}
                />
              ))}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 flex flex-col gap-6">
          <Tabs
            value={form.currentStep}
            onValueChange={(value) => form.goToStep(value as StepId)}
            className="gap-0"
          >
            <Card className="overflow-hidden border-border/70 shadow-sm">
              <CardHeader className="gap-4 border-b bg-muted/10 p-5 sm:p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {currentStepMeta.label}
                    </CardTitle>
                    <CardDescription>
                      Switch between steps without losing context. Each tab
                      keeps the editor focused and predictable.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="w-fit">
                    {currentStepMeta.label}
                  </Badge>
                </div>

                <TabsList
                  variant="line"
                  className="w-full justify-start gap-1 overflow-x-auto rounded-none border-b border-border/70 bg-transparent p-0 pb-1"
                >
                  {STEP_META.map((step) => {
                    const StepIcon = step.icon;

                    return (
                      <TabsTrigger
                        key={step.id}
                        value={step.id}
                        className="flex-none justify-start gap-2 px-4 py-2.5"
                      >
                        <StepIcon />
                        {step.label}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </CardHeader>

              <CardContent className="p-0">
                <TabsContent value="basic-info" className="m-0 p-5 sm:p-6">
                  <BasicInfoStep
                    formData={form.formData}
                    errors={form.errors}
                    updateField={form.updateField}
                    updateName={form.updateName}
                  />
                </TabsContent>

                <TabsContent value="curriculum" className="m-0 p-5 sm:p-6">
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
                </TabsContent>

                <TabsContent value="pricing" className="m-0 p-5 sm:p-6">
                  <PricingStep
                    formData={form.formData}
                    errors={form.errors}
                    stats={form.stats}
                    updateField={form.updateField}
                  />
                </TabsContent>

                <TabsContent value="publish" className="m-0 p-5 sm:p-6">
                  <PublishStep
                    formData={form.formData}
                    updateField={form.updateField}
                    stats={form.stats}
                  />
                </TabsContent>
              </CardContent>
            </Card>
          </Tabs>

          {submitError ? (
            <Alert variant="destructive">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          ) : null}

          <Card className="border-border/70 shadow-sm">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Save changes</p>
                <p className="text-sm text-muted-foreground">
                  Drafts can be saved at any time. Publishing keeps the current
                  course status intact.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChild variant="outline">
                  <Link href="/admin/course">Back to courses</Link>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleSaveDraft}
                  disabled={form.isSubmitting}
                >
                  {form.isSubmitting ? (
                    <IconDeviceFloppy
                      data-icon="inline-start"
                      className="animate-pulse"
                    />
                  ) : (
                    <IconDeviceFloppy data-icon="inline-start" />
                  )}
                  Save draft
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveChanges}
                  disabled={form.isSubmitting}
                >
                  <IconCheck data-icon="inline-start" />
                  {form.formData.status === "published"
                    ? "Update published course"
                    : "Save changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6 xl:sticky xl:top-6 xl:self-start">
          <Card className="overflow-hidden border-border/70 shadow-sm">
            <CardHeader className="border-b bg-background/80 p-4">
              <CardTitle className="text-base">Course snapshot</CardTitle>
              <CardDescription>
                A concise view of the course while you edit.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 p-4">
              <AspectRatio
                ratio={4 / 5}
                className="overflow-hidden rounded-2xl border bg-muted"
              >
                {thumbnailUrl ? (
                  <Image
                    src={thumbnailUrl}
                    alt={
                      form.formData.name ||
                      coursePreview?.name ||
                      "Course thumbnail"
                    }
                    fill
                    unoptimized
                    className="object-cover object-center"
                    sizes="(max-width: 1280px) 100vw, 360px"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    <IconPhoto className="size-9" />
                  </div>
                )}
              </AspectRatio>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="capitalize">
                  {form.formData.status}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {form.formData.level}
                </Badge>
              </div>

              <div className="space-y-1">
                <p className="truncate font-medium">
                  {form.formData.name ||
                    coursePreview?.name ||
                    "Untitled course"}
                </p>
                <p className="truncate font-mono text-xs text-muted-foreground">
                  {form.formData.slug || coursePreview?.slug || "—"}
                </p>
              </div>

              <Separator />

              <dl className="flex flex-col gap-3 text-sm">
                <FactRow
                  label="Instructor"
                  value={coursePreview?.instructor.name || "Not assigned"}
                />
                <FactRow
                  label="Email"
                  value={coursePreview?.instructor.email || "—"}
                  mono
                />
                <FactRow
                  label="Created"
                  value={formatDate(coursePreview?.createdAt)}
                />
                <FactRow
                  label="Course ID"
                  value={coursePreview?.id || courseId}
                  mono
                />
              </dl>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-border/70 shadow-sm">
            <CardHeader className="border-b bg-background/80 p-4">
              <CardTitle className="text-base">Editing checklist</CardTitle>
              <CardDescription>
                Lightweight guidance before saving.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 p-4">
              {publishChecks.map((check) => (
                <ChecklistRow
                  key={check.label}
                  label={check.label}
                  ok={check.ok}
                />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border bg-background/80 p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="size-4 text-primary" />
        <span>{label}</span>
      </div>
      <p className="mt-2 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function ChecklistRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm",
        ok
          ? "bg-primary/5 text-foreground"
          : "bg-muted/30 text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
          ok ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
        )}
      >
        {ok ? <IconCheck className="size-3" /> : "·"}
      </span>
      <span>{label}</span>
    </div>
  );
}

function FactRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("text-right font-medium", mono && "font-mono text-xs")}>
        {value}
      </dd>
    </div>
  );
}

function CourseEditorSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 lg:py-8">
      <Card className="overflow-hidden border-border/70 shadow-sm">
        <CardHeader className="gap-5 border-b bg-muted/20 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="flex gap-2">
                <Skeleton className="h-6 w-28 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-8 w-72" />
                <Skeleton className="h-4 w-lg max-w-full" />
                <Skeleton className="h-4 w-104 max-w-full" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-36 rounded-md" />
              <Skeleton className="h-10 w-28 rounded-md" />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-20 rounded-2xl" />
            ))}
          </div>

          <Skeleton className="h-28 rounded-2xl" />
        </CardHeader>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-6">
          <Card className="overflow-hidden border-border/70 shadow-sm">
            <CardHeader className="gap-4 border-b bg-muted/10 p-5 sm:p-6">
              <Skeleton className="h-6 w-40" />
              <div className="flex gap-2 overflow-x-auto">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-10 w-24 rounded-full" />
                ))}
              </div>
            </CardHeader>
            <CardContent className="p-5 sm:p-6">
              <Skeleton className="h-64 rounded-2xl" />
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-border/70 shadow-sm">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-88 max-w-full" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-10 w-32 rounded-md" />
                <Skeleton className="h-10 w-28 rounded-md" />
                <Skeleton className="h-10 w-28 rounded-md" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="overflow-hidden border-border/70 shadow-sm">
            <CardHeader className="border-b bg-background/80 p-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent className="flex flex-col gap-4 p-4">
              <Skeleton className="aspect-video rounded-2xl" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-36" />
              <Separator />
              <div className="flex flex-col gap-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-4 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-border/70 shadow-sm">
            <CardHeader className="border-b bg-background/80 p-4">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="flex flex-col gap-2 p-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-11 rounded-xl" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
