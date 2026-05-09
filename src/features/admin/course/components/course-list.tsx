"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  IconArchive,
  IconClock,
  IconDotsVertical,
  IconEye,
  IconFileText,
  IconFilter,
  IconPencil,
  IconLayersIntersect,
  IconNotebook,
  IconPlus,
  IconPlayerPlay,
  IconSearch,
  IconTrash,
} from "@tabler/icons-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { AdminResourceTable } from "@/features/admin/components/admin-resource-table";
import { type AdminCourse } from "@/features/admin/data/admin-sample-data";
import { adminApi } from "@/features/admin/lib/admin-api";
import {
  currencyFormatter,
  formatDate,
  formatDateTime,
} from "@/features/admin/lib/formatters";
import type {
  AdminCoursePreviewLecture,
  AdminCoursePreviewResource,
  AdminCoursePreviewSection,
} from "@/features/admin/course/types/course-preview";

const courseStyles: Record<AdminCourse["status"], string> = {
  draft:
    "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  published:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  archived: "border-muted-foreground/20 bg-muted text-muted-foreground",
};

function formatDuration(seconds: number): string {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function formatLevel(level: string) {
  switch (level) {
    case "knowledge":
      return "Knowledge track";
    case "skills":
      return "Skills track";
    case "professional":
      return "Professional track";
    default:
      return level || "Professional track";
  }
}

function getInitials(name?: string) {
  if (!name) return "??";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function CourseMetric({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div
          className={`flex size-10 items-center justify-center rounded-xl border border-white/10 ${accent || "bg-white/10"}`}
        >
          {icon}
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/55">
            {label}
          </p>
          <p className="mt-1 text-lg font-semibold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

function CoursePreviewSheet({
  courseId,
  open,
  onClose,
}: {
  courseId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-course-preview", courseId],
    queryFn: () => adminApi.getCoursePreview(courseId as string),
    enabled: open && courseId !== null,
  });

  React.useEffect(() => {
    if (error instanceof Error) {
      toast.error(error.message || "Failed to load course preview");
    }
  }, [error]);

  const course = data?.course;

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full overflow-hidden border-l border-border/70 bg-background p-0 sm:max-w-6xl"
      >
        <div className="flex h-full flex-col">
          <div className="relative overflow-hidden border-b border-white/10 bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
            <div className="absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.16),transparent_28%)]" />
            <SheetHeader className="relative gap-4 p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <Badge className="w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/85">
                    Curriculum preview
                  </Badge>
                  <SheetTitle className="max-w-3xl text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                    {course?.name || "Loading course preview"}
                  </SheetTitle>
                  <SheetDescription className="max-w-2xl text-sm text-white/70">
                    Review the course like a student would see it, with
                    sections, lectures, resources, and publish-ready details.
                  </SheetDescription>
                </div>
                <SheetClose asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="rounded-full border border-white/10 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  >
                    <IconEye />
                    <span className="sr-only">Close preview</span>
                  </Button>
                </SheetClose>
              </div>

              {course ? (
                <div className="grid gap-3 md:grid-cols-4">
                  <CourseMetric
                    label="Sections"
                    value={course.stats.totalSections.toString()}
                    icon={<IconLayersIntersect className="size-5 text-white" />}
                  />
                  <CourseMetric
                    label="Lectures"
                    value={course.stats.totalLectures.toString()}
                    icon={<IconNotebook className="size-5 text-white" />}
                    accent="bg-cyan-500/15"
                  />
                  <CourseMetric
                    label="Resources"
                    value={course.stats.totalResources.toString()}
                    icon={<IconFileText className="size-5 text-white" />}
                    accent="bg-emerald-500/15"
                  />
                  <CourseMetric
                    label="Duration"
                    value={formatDuration(course.stats.totalDurationSec)}
                    icon={<IconClock className="size-5 text-white" />}
                    accent="bg-amber-500/15"
                  />
                </div>
              ) : null}
            </SheetHeader>
          </div>

          <div className="flex-1 overflow-y-auto p-6 sm:p-8">
            {isLoading ? (
              <div className="space-y-6">
                <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                  <div className="h-64 animate-pulse rounded-3xl border border-border/60 bg-muted/30" />
                  <div className="h-64 animate-pulse rounded-3xl border border-border/60 bg-muted/30" />
                </div>
                <div className="space-y-3">
                  <div className="h-12 animate-pulse rounded-2xl border border-border/60 bg-muted/30" />
                  <div className="h-12 animate-pulse rounded-2xl border border-border/60 bg-muted/30" />
                  <div className="h-12 animate-pulse rounded-2xl border border-border/60 bg-muted/30" />
                </div>
              </div>
            ) : course ? (
              <div className="space-y-8">
                <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                  <div className="space-y-4 rounded-3xl border border-border/70 bg-card p-5 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        className={`rounded-full border px-3 py-1 capitalize ${courseStyles[course.status as AdminCourse["status"]] ?? courseStyles.draft}`}
                      >
                        {course.status}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="rounded-full px-3 py-1 capitalize"
                      >
                        {formatLevel(course.level)}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="rounded-full px-3 py-1"
                      >
                        {course.instructor.name}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {course.slug
                          ? `/courses/${course.slug}`
                          : `Course #${course.id}`}
                      </p>
                      <p className="text-sm leading-6 text-foreground/80">
                        {course.description ||
                          "No course description has been added yet. Add a compelling outline so students understand the learning outcome at a glance."}
                      </p>
                    </div>

                    <Separator />

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          Pricing
                        </p>
                        <div className="mt-2 flex items-end gap-3">
                          <p className="text-2xl font-semibold">
                            {currencyFormatter.format(course.price)}
                          </p>
                          {course.discountPrice !== null ? (
                            <p className="pb-0.5 text-sm text-muted-foreground line-through">
                              {currencyFormatter.format(course.discountPrice)}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          Published
                        </p>
                        <p className="mt-2 text-sm font-medium">
                          {formatDateTime(course.createdAt)}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Instructor:{" "}
                          {course.instructor.email || course.instructor.name}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">
                            Learning signals
                          </p>
                          <p className="text-sm text-muted-foreground">
                            The preview mirrors the learner experience and
                            surfaces structure, pace, and resources.
                          </p>
                        </div>
                        <IconPlayerPlay className="size-5 text-primary" />
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
                    {course.thumbnailUrl ? (
                      <div
                        className="relative flex min-h-80 items-end bg-cover bg-center p-5"
                        style={{
                          backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0.08) 0%, rgba(15,23,42,0.82) 100%), url(${course.thumbnailUrl})`,
                        }}
                      >
                        <div className="space-y-3 text-white">
                          <Badge className="w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/85">
                            Course cover
                          </Badge>
                          <div>
                            <p className="text-2xl font-semibold tracking-tight">
                              {getInitials(course.name)}
                            </p>
                            <p className="mt-1 max-w-sm text-sm text-white/80">
                              Visual identity shown to learners before they
                              enter the curriculum.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex min-h-80 items-center justify-center bg-linear-to-br from-slate-950 via-slate-900 to-cyan-900 p-8 text-white">
                        <div className="text-center">
                          <div className="mx-auto flex size-20 items-center justify-center rounded-3xl border border-white/10 bg-white/10 text-2xl font-semibold">
                            {getInitials(course.name)}
                          </div>
                          <p className="mt-4 text-lg font-medium">
                            No course cover uploaded
                          </p>
                          <p className="mt-2 max-w-sm text-sm text-white/70">
                            Add a clean thumbnail to make the course feel
                            publish-ready in the catalog and preview views.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
                        Curriculum
                      </p>
                      <h3 className="text-xl font-semibold tracking-tight">
                        Section-by-section course map
                      </h3>
                    </div>
                    <Badge
                      variant="secondary"
                      className="rounded-full px-3 py-1"
                    >
                      {course.sections.length} sections
                    </Badge>
                  </div>

                  {course.sections.length ? (
                    <Accordion
                      type="single"
                      collapsible
                      defaultValue={String(course.sections[0]?.id)}
                      className="gap-3"
                    >
                      {course.sections.map(
                        (section: AdminCoursePreviewSection) => {
                          const sectionDuration = section.lectures.reduce(
                            (sum: number, lecture: AdminCoursePreviewLecture) =>
                              sum + lecture.durationSec,
                            0,
                          );

                          return (
                            <AccordionItem
                              key={section.id}
                              value={String(section.id)}
                              className="mb-3 overflow-hidden rounded-3xl border border-border/70 bg-card px-5 shadow-sm last:mb-0"
                            >
                              <AccordionTrigger className="py-0 no-underline hover:no-underline [&>svg]:hidden">
                                <div className="flex w-full items-start gap-4 py-5 text-left">
                                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                    <IconLayersIntersect className="size-5" />
                                  </div>
                                  <div className="min-w-0 flex-1 space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="truncate text-base font-semibold">
                                        {section.title}
                                      </p>
                                      <Badge
                                        variant="secondary"
                                        className="rounded-full px-2.5 py-0.5 text-[11px]"
                                      >
                                        {section.lectures.length} lectures
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      Section {section.position + 1} •{" "}
                                      {formatDuration(sectionDuration)} of
                                      instruction
                                    </p>
                                  </div>
                                  <div className="text-right text-xs text-muted-foreground">
                                    <p>Structure</p>
                                    <p className="mt-1 font-medium text-foreground">
                                      {formatDuration(sectionDuration)}
                                    </p>
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="pb-5">
                                <div className="space-y-3">
                                  {section.lectures.map(
                                    (lecture: AdminCoursePreviewLecture) => (
                                      <div
                                        key={lecture.id}
                                        className="rounded-2xl border border-border/70 bg-muted/20 p-4"
                                      >
                                        <div className="flex items-start gap-3">
                                          <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                            <IconPlayerPlay className="size-4" />
                                          </div>
                                          <div className="min-w-0 flex-1 space-y-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                              <p className="font-medium">
                                                {lecture.title}
                                              </p>
                                              {lecture.isPreview ? (
                                                <Badge className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] text-emerald-700 dark:text-emerald-300">
                                                  Preview lecture
                                                </Badge>
                                              ) : null}
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                              {lecture.description ||
                                                "No lecture description added yet."}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                              <Badge
                                                variant="outline"
                                                className="rounded-full px-2.5 py-0.5"
                                              >
                                                {formatDuration(
                                                  lecture.durationSec,
                                                )}
                                              </Badge>
                                              <Badge
                                                variant="outline"
                                                className="rounded-full px-2.5 py-0.5"
                                              >
                                                {lecture.resources.length}{" "}
                                                resources
                                              </Badge>
                                              {lecture.videoUrl ? (
                                                <Badge
                                                  variant="outline"
                                                  className="rounded-full px-2.5 py-0.5 capitalize"
                                                >
                                                  {lecture.videoUrl.includes(
                                                    "youtube",
                                                  )
                                                    ? "YouTube"
                                                    : "Video link"}
                                                </Badge>
                                              ) : null}
                                            </div>
                                            {lecture.resources.length ? (
                                              <div className="flex flex-wrap gap-2 pt-1">
                                                {lecture.resources
                                                  .slice(0, 3)
                                                  .map(
                                                    (
                                                      resource: AdminCoursePreviewResource,
                                                    ) => (
                                                      <Badge
                                                        key={resource.id}
                                                        variant="secondary"
                                                        className="rounded-full px-2.5 py-0.5 text-[11px]"
                                                      >
                                                        {resource.title}
                                                      </Badge>
                                                    ),
                                                  )}
                                                {lecture.resources.length >
                                                  3 ? (
                                                  <Badge
                                                    variant="secondary"
                                                    className="rounded-full px-2.5 py-0.5 text-[11px]"
                                                  >
                                                    +
                                                    {lecture.resources.length -
                                                      3}{" "}
                                                    more
                                                  </Badge>
                                                ) : null}
                                              </div>
                                            ) : null}
                                          </div>
                                        </div>
                                      </div>
                                    ),
                                  )}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        },
                      )}
                    </Accordion>
                  ) : (
                    <div className="rounded-3xl border border-dashed border-border/70 bg-muted/20 p-8 text-center">
                      <p className="text-lg font-medium">
                        No sections added yet
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Add sections and lectures in the course builder to make
                        this preview feel like a complete LMS experience.
                      </p>
                      <Button asChild className="mt-5 rounded-xl">
                        <Link href="/admin/course/new">
                          <IconPlus />
                          Build curriculum
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-border/70 bg-muted/20 p-8 text-center text-muted-foreground">
                Failed to load course preview.
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CoursePageContent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: adminApi.getCourses,
  });

  const courses = React.useMemo(() => data?.courses ?? [], [data?.courses]);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | AdminCourse["status"]
  >("all");
  const [sortBy, setSortBy] = React.useState<
    "newest" | "oldest" | "price-high" | "price-low"
  >("newest");
  const [previewCourseId, setPreviewCourseId] = React.useState<string | null>(
    null,
  );
  const [deleteCourse, setDeleteCourse] = React.useState<AdminCourse | null>(
    null,
  );
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: (payload: {
      courseId: string;
      status: AdminCourse["status"];
    }) => adminApi.updateCourseStatus(payload.courseId, payload.status),
    onMutate: async ({ courseId, status }) => {
      await queryClient.cancelQueries({ queryKey: ["admin-courses"] });
      const previous = queryClient.getQueryData<{ courses: AdminCourse[] }>([
        "admin-courses",
      ]);
      queryClient.setQueryData<{ courses: AdminCourse[] }>(
        ["admin-courses"],
        (old) => {
          if (!old) return old;
          return {
            courses: old.courses.map((course) =>
              course.id === courseId ? { ...course, status } : course,
            ),
          };
        },
      );
      return { previous };
    },
    onError: (err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["admin-courses"], context.previous);
      }
      toast.error(
        err instanceof Error ? err.message : "Failed to update status",
      );
    },
    onSuccess: (_, variables) => {
      toast.success(`Course moved to ${variables.status}`);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: (courseId: string) => adminApi.deleteCourse(courseId),
    onMutate: async (courseId) => {
      await queryClient.cancelQueries({ queryKey: ["admin-courses"] });
      const previous = queryClient.getQueryData<{ courses: AdminCourse[] }>([
        "admin-courses",
      ]);
      queryClient.setQueryData<{ courses: AdminCourse[] }>(
        ["admin-courses"],
        (old) => {
          if (!old) return old;
          return {
            courses: old.courses.filter((course) => course.id !== courseId),
          };
        },
      );
      return { previous };
    },
    onError: (err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["admin-courses"], context.previous);
      }
      toast.error(
        err instanceof Error ? err.message : "Failed to delete course",
      );
    },
    onSuccess: () => {
      toast.success("Course deleted");
      setDeleteCourse(null);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
    },
  });

  const filteredCourses = React.useMemo(() => {
    const query = search.trim().toLowerCase();

    const next = courses.filter((course) => {
      const matchesQuery =
        !query ||
        (course.name || "").toLowerCase().includes(query) ||
        (course.title || "").toLowerCase().includes(query) ||
        (course.instructor || "").toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" || course.status === statusFilter;

      return matchesQuery && matchesStatus;
    });

    next.sort((a, b) => {
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "oldest") {
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return next;
  }, [courses, search, sortBy, statusFilter]);

  const metrics = React.useMemo(() => {
    const published = courses.filter(
      (course) => course.status === "published",
    ).length;
    const drafts = courses.filter((course) => course.status === "draft").length;
    const archived = courses.filter(
      (course) => course.status === "archived",
    ).length;
    const averagePrice = courses.length
      ? Math.round(
        courses.reduce((sum, course) => sum + course.price, 0) /
        courses.length,
      )
      : 0;

    return {
      published,
      drafts,
      archived,
      averagePrice,
    };
  }, [courses]);

  React.useEffect(() => {
    if (error instanceof Error) {
      toast.error(error.message || "Failed to load courses");
    }
  }, [error]);

  const columns = React.useMemo<ColumnDef<AdminCourse>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Course",
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="font-medium tracking-tight">{row.original.name}</p>
            <p className="text-sm text-muted-foreground">
              ID #{row.original.id}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "instructor",
        header: "Instructor",
      },
      {
        accessorKey: "price",
        header: "Price",
        cell: ({ row }) => (
          <span className="font-medium">
            {currencyFormatter.format(row.original.price)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Badge
              className={`rounded-full border px-2.5 py-1 capitalize ${courseStyles[status]}`}
            >
              {status}
            </Badge>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const course = row.original;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-lg"
                >
                  <IconDotsVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setPreviewCourseId(course.id)}>
                  <IconEye />
                  Preview curriculum
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/admin/course/${course.slug}`}>
                    <IconLayersIntersect />
                    Course overview
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/admin/course/${course.slug}/edit`}>
                    <IconPencil />
                    Edit course
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    updateStatusMutation.mutate({
                      courseId: course.id,
                      status: "published",
                    })
                  }
                >
                  <IconPlayerPlay />
                  Publish
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    updateStatusMutation.mutate({
                      courseId: course.id,
                      status: "archived",
                    })
                  }
                >
                  <IconArchive />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleteCourse(course)}
                >
                  <IconTrash />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [updateStatusMutation],
  );

  const visibleSummary =
    filteredCourses.length === courses.length
      ? `${courses.length} courses in the catalog`
      : `${filteredCourses.length} of ${courses.length} courses visible`;

  return (
    <AdminPageShell
      title="Course Studio"
      description="Inspect curriculum, preview sections, and manage publishing states from one refined LMS workspace."
      actions={
        <Button asChild className="rounded-xl">
          <Link href="/admin/course/new">
            <IconPlus />
            New course
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-linear-to-br from-slate-950 via-slate-900 to-cyan-950 p-6 text-white shadow-sm">
          <div className="absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.15),transparent_28%)]" />
          <div className="relative grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/85">
                  LMS course catalog
                </Badge>
                <Badge className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/85">
                  {visibleSummary}
                </Badge>
              </div>
              <div className="max-w-3xl space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Design courses that feel structured, premium, and ready to
                  launch.
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-white/72 sm:text-base">
                  Preview sections, review lecture pacing, and inspect resources
                  from a section-first view that mirrors the learner experience.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  asChild
                  className="rounded-xl bg-white text-slate-950 hover:bg-white/90"
                >
                  <Link href="/admin/course/new">
                    <IconPlus />
                    Create course
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                    setSortBy("newest");
                  }}
                >
                  <IconFilter />
                  Reset filters
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <CourseMetric
                label="Published"
                value={metrics.published.toString()}
                icon={<IconNotebook className="size-5 text-white" />}
                accent="bg-emerald-500/15"
              />
              <CourseMetric
                label="Drafts"
                value={metrics.drafts.toString()}
                icon={<IconLayersIntersect className="size-5 text-white" />}
                accent="bg-amber-500/15"
              />
              <CourseMetric
                label="Archived"
                value={metrics.archived.toString()}
                icon={<IconArchive className="size-5 text-white" />}
                accent="bg-white/10"
              />
              <CourseMetric
                label="Avg price"
                value={currencyFormatter.format(metrics.averagePrice)}
                icon={<IconClock className="size-5 text-white" />}
                accent="bg-cyan-500/15"
              />
            </div>
          </div>
        </section>

        <AdminResourceTable
          columns={columns}
          data={filteredCourses}
          emptyTitle="No courses found"
          emptyDescription="Try removing the status filter or adjusting the search term to reveal courses in the catalog."
          isLoading={isLoading}
          enableSelection={false}
          toolbar={
            <>
              <div className="flex flex-1 flex-wrap items-center gap-3">
                <div className="relative w-full flex-1 md:max-w-md">
                  <IconSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="h-10 rounded-xl pl-9"
                    placeholder="Search courses or instructors"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={(value) =>
                    setStatusFilter(value as typeof statusFilter)
                  }
                >
                  <SelectTrigger className="h-10 rounded-xl md:w-44">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={sortBy}
                  onValueChange={(value) => setSortBy(value as typeof sortBy)}
                >
                  <SelectTrigger className="h-10 rounded-xl md:w-44">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="oldest">Oldest first</SelectItem>
                    <SelectItem value="price-high">Price high-low</SelectItem>
                    <SelectItem value="price-low">Price low-high</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setSortBy("newest");
                }}
              >
                <IconFilter />
                Clear filters
              </Button>
            </>
          }
          emptyAction={
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/course/new">
                <IconPlus />
                Create course
              </Link>
            </Button>
          }
        />
      </div>

      <CoursePreviewSheet
        courseId={previewCourseId}
        open={previewCourseId !== null}
        onClose={() => setPreviewCourseId(null)}
      />

      <AlertDialog
        open={!!deleteCourse}
        onOpenChange={(open) => !open && setDeleteCourse(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete course?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {deleteCourse?.name} from the catalog and its
              related content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteCourse) {
                  deleteCourseMutation.mutate(deleteCourse.id);
                }
              }}
            >
              Delete course
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageShell>
  );
}

export function CourseList() {
  return <CoursePageContent />;
}
