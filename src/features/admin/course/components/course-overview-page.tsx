"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  IconArchive,
  IconBolt,
  IconCash,
  IconDotsVertical,
  IconEdit,
  IconEye,
  IconFileText,
  IconGripVertical,
  IconLayersIntersect,
  IconPlus,
  IconReceipt,
  IconRocket,
  IconSchool,
  IconSearch,
  IconStar,
  IconTrash,
  IconUpload,
  IconUsers,
  IconVideo,
  IconX,
  IconCheck,
  IconClock,
  IconBook,
  IconAlertTriangle,
} from "@tabler/icons-react";

import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { adminApi } from "@/features/admin/lib/admin-api";
import {
  currencyFormatter,
  formatDate,
  formatDateTime,
} from "@/features/admin/lib/formatters";
import type { AdminCoursePreview } from "@/features/admin/course/types/course-preview";
import { AdminResourceTable } from "@/features/admin/components/admin-resource-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";

// ─── Types ────────────────────────────────────────────────────────────────────

type CourseOverviewProps = {
  courseId: string;
};

type PreviewSection = AdminCoursePreview["sections"][number];
type PreviewLecture = PreviewSection["lectures"][number];

// ─── Pure utilities ───────────────────────────────────────────────────────────

function cloneCourse(course: AdminCoursePreview): AdminCoursePreview {
  return JSON.parse(JSON.stringify(course)) as AdminCoursePreview;
}

function toUpdatePayload(course: AdminCoursePreview) {
  return {
    name: course.name,
    slug: course.slug,
    description: course.description,
    level: course.level,
    thumbnailUrl: course.thumbnailUrl,
    instructorId: course.instructor.id,
    price: course.price,
    discountPrice: course.discountPrice,
    status: course.status,
    sections: course.sections.map((section, sectionIndex) => ({
      title: section.title,
      position: sectionIndex,
      lectures: section.lectures.map((lecture, lectureIndex) => ({
        title: lecture.title,
        videoUrl: lecture.videoUrl,
        description: lecture.description,
        durationSec: lecture.durationSec,
        position: lectureIndex,
        isPreview: lecture.isPreview,
        resources: lecture.resources.map((resource) => ({
          title: resource.title,
          fileUrl: resource.fileUrl,
        })),
      })),
    })),
  };
}

function recalcStats(course: AdminCoursePreview) {
  const totalLectures = course.sections.reduce(
    (sum, s) => sum + s.lectures.length,
    0,
  );
  const totalResources = course.sections.reduce(
    (sum, s) =>
      sum + s.lectures.reduce((acc, l) => acc + l.resources.length, 0),
    0,
  );
  const totalDurationSec = course.sections.reduce(
    (sum, s) => sum + s.lectures.reduce((acc, l) => acc + l.durationSec, 0),
    0,
  );
  course.stats = {
    totalSections: course.sections.length,
    totalLectures,
    totalResources,
    totalDurationSec,
  };
}

function formatDuration(totalSec: number) {
  const safe = Math.max(0, Math.round(totalSec));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function createId() {
  return crypto.randomUUID();
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<
    string,
    {
      label: string;
      variant: "default" | "secondary" | "outline" | "destructive";
    }
  > = {
    published: { label: "Published", variant: "default" },
    draft: { label: "Draft", variant: "outline" },
    archived: { label: "Archived", variant: "secondary" },
  };
  const { label, variant } = map[status] ?? {
    label: status,
    variant: "outline",
  };
  return (
    <Badge variant={variant} className="capitalize">
      {label}
    </Badge>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-transform duration-200 hover:-translate-y-0.5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <span className="text-[11px] font-medium uppercase tracking-[0.22em]">
          {label}
        </span>
      </div>
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function CourseOverviewSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24" />
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-125 rounded-2xl" />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CourseOverviewPage({ courseId }: CourseOverviewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [selectedSections, setSelectedSections] = React.useState<string[]>([]);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [dragOverSection, setDragOverSection] = React.useState<string | null>(
    null,
  );

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data, isLoading, isError } = useQuery<{ course: AdminCoursePreview }>(
    {
      queryKey: ["admin-course-overview", courseId],
      queryFn: () => adminApi.getCoursePreview(courseId),
    },
  );
  const { data: enrollmentsData } = useQuery({
    queryKey: ["admin-enrollments-all"],
    queryFn: adminApi.getEnrollments,
  });
  const { data: paymentsData } = useQuery({
    queryKey: ["admin-payments-all"],
    queryFn: adminApi.getPayments,
  });
  const { data: reviewsData } = useQuery({
    queryKey: ["admin-reviews-all"],
    queryFn: adminApi.getReviews,
  });
  const { data: quizzesData } = useQuery({
    queryKey: ["admin-quizzes-all"],
    queryFn: adminApi.getQuizzes,
  });

  // ── Mutations ──────────────────────────────────────────────────────────────

  const updateCourseMutation = useMutation({
    mutationFn: (nextCourse: AdminCoursePreview) =>
      adminApi.updateCourse(courseId, toUpdatePayload(nextCourse)),
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update course",
      );
      queryClient.invalidateQueries({
        queryKey: ["admin-course-overview", courseId],
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: "draft" | "published" | "archived") =>
      adminApi.updateCourseStatus(courseId, status),
    onSuccess: (_, status) => {
      queryClient.setQueryData<{ course: AdminCoursePreview }>(
        ["admin-course-overview", courseId],
        (old) => (old ? { course: { ...old.course, status } } : old),
      );
      toast.success(`Course status updated to "${status}"`);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update status",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteCourse(courseId),
    onSuccess: () => {
      toast.success("Course deleted successfully");
      router.push("/admin/course");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete course",
      );
    },
  });

  // ── Optimistic cache updater ───────────────────────────────────────────────

  const updateCourseInCache = React.useCallback(
    (updater: (draft: AdminCoursePreview) => void) => {
      const previous = queryClient.getQueryData<{ course: AdminCoursePreview }>(
        ["admin-course-overview", courseId],
      );
      if (!previous?.course) return;

      const next = cloneCourse(previous.course);
      updater(next);
      recalcStats(next);

      queryClient.setQueryData(["admin-course-overview", courseId], {
        course: next,
      });
      updateCourseMutation.mutate(next, {
        onError: () => {
          queryClient.setQueryData(
            ["admin-course-overview", courseId],
            previous,
          );
        },
      });
    },
    [courseId, queryClient, updateCourseMutation],
  );

  // ── Derived data ───────────────────────────────────────────────────────────

  const course = data?.course;

  const filteredSections = React.useMemo<PreviewSection[]>(() => {
    if (!course) return [];
    const courseSections: PreviewSection[] = course.sections ?? [];
    const query = search.trim().toLowerCase();
    if (!query) return courseSections;
    return courseSections
      .map((section: PreviewSection) => ({
        ...section,
        lectures: section.lectures.filter((lecture: PreviewLecture) =>
          lecture.title.toLowerCase().includes(query),
        ),
      }))
      .filter(
        (section: PreviewSection) =>
          section.title.toLowerCase().includes(query) ||
          section.lectures.length > 0,
      );
  }, [course, search]);

  const enrollments = React.useMemo(() => {
    if (!course) return [];
    return (enrollmentsData?.enrollments ?? []).filter(
      (item) => item.course === course.name,
    );
  }, [course, enrollmentsData?.enrollments]);

  const reviews = React.useMemo(() => {
    if (!course) return [];
    return (reviewsData?.reviews ?? []).filter(
      (item) => item.course === course.name,
    );
  }, [course, reviewsData?.reviews]);

  const payments = React.useMemo(() => {
    if (!course) return [];
    return (paymentsData?.payments ?? []).filter(
      (item) => item.course === course.name,
    );
  }, [course, paymentsData?.payments]);

  const quizzes = React.useMemo(
    () => quizzesData?.quizzes ?? [],
    [quizzesData?.quizzes],
  );

  const revenue = React.useMemo(
    () =>
      payments
        .filter((p) => p.status === "paid")
        .reduce((sum, p) => sum + p.amount, 0),
    [payments],
  );

  const completionRate = React.useMemo(() => {
    if (enrollments.length === 0) return 0;
    const completed = enrollments.filter((e) => e.status === "expired").length;
    return Math.round((completed / enrollments.length) * 100);
  }, [enrollments]);

  const discountPct = React.useMemo(() => {
    if (!course || !course.price || !course.discountPrice) return 0;
    return Math.round(
      ((course.price - course.discountPrice) / course.price) * 100,
    );
  }, [course]);

  // ── Table columns ──────────────────────────────────────────────────────────

  const enrollmentColumns = React.useMemo<
    ColumnDef<(typeof enrollments)[number]>[]
  >(
    () => [
      { accessorKey: "user", header: "Student" },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant={row.original.status === "active" ? "default" : "secondary"}
            className="capitalize"
          >
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: "expiresAt",
        header: "Expires",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {formatDate(row.original.expiresAt)}
          </span>
        ),
      },
    ],
    [],
  );

  const reviewColumns = React.useMemo<ColumnDef<(typeof reviews)[number]>[]>(
    () => [
      { accessorKey: "user", header: "Student" },
      {
        accessorKey: "rating",
        header: "Rating",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <IconStar className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="font-medium">{row.original.rating}</span>
            <span className="text-muted-foreground">/5</span>
          </div>
        ),
      },
      {
        accessorKey: "comment",
        header: "Comment",
        cell: ({ row }) => (
          <span className="line-clamp-1 max-w-xs text-sm text-muted-foreground">
            {row.original.comment}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Date",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
    ],
    [],
  );

  const paymentColumns = React.useMemo<ColumnDef<(typeof payments)[number]>[]>(
    () => [
      { accessorKey: "user", header: "Student" },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => (
          <span className="font-medium tabular-nums">
            {currencyFormatter.format(row.original.amount)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant={row.original.status === "paid" ? "default" : "secondary"}
            className="capitalize"
          >
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Date",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
    ],
    [],
  );

  const quizColumns = React.useMemo<ColumnDef<(typeof quizzes)[number]>[]>(
    () => [
      { accessorKey: "title", header: "Quiz Title" },
      { accessorKey: "type", header: "Type" },
      {
        accessorKey: "totalMarks",
        header: "Marks",
        cell: ({ row }) => (
          <span className="font-medium tabular-nums">
            {row.original.totalMarks}
          </span>
        ),
      },
      {
        accessorKey: "published",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.published ? "default" : "outline"}>
            {row.original.published ? "Published" : "Draft"}
          </Badge>
        ),
      },
    ],
    [],
  );

  // ── Early returns ──────────────────────────────────────────────────────────

  if (isLoading) return <CourseOverviewSkeleton />;

  if (isError || !course) {
    return (
      <div className="flex min-h-100 items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md rounded-2xl border-border/60 shadow-sm">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
              <IconAlertTriangle className="size-6 text-destructive" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-semibold">Failed to load course</p>
              <p className="text-sm text-muted-foreground">
                The course could not be fetched. Check your connection and try
                again.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() =>
                queryClient.invalidateQueries({
                  queryKey: ["admin-course-overview", courseId],
                })
              }
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <TooltipProvider delayDuration={300}>
      <AdminPageShell
        title={course.name}
        description="Manage curriculum, pricing, enrollments, and publishing."
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/course/${course.slug}/edit`}>
                <IconEdit className="size-4" />
                Edit
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/courses/${course.slug}`} target="_blank">
                <IconEye className="size-4" />
                Preview
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={statusMutation.isPending}
              onClick={() =>
                statusMutation.mutate(
                  course.status === "published" ? "archived" : "published",
                )
              }
            >
              {course.status === "published" ? (
                <>
                  <IconArchive className="size-4" />
                  Archive
                </>
              ) : (
                <>
                  <IconRocket className="size-4" />
                  Publish
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <IconTrash className="size-4" />
              Delete
            </Button>
          </div>
        }
      >
        {/* ── Metadata strip ─────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 text-sm">
          <Badge variant="secondary" className="capitalize">
            {course.level}
          </Badge>
          <StatusBadge status={course.status} />
          <Separator orientation="vertical" className="h-4" />
          <span className="text-muted-foreground">
            Instructor:{" "}
            <span className="font-medium text-foreground">
              {course.instructor.name}
            </span>
          </span>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-muted-foreground">
            Created {formatDateTime(course.createdAt)}
          </span>
        </div>

        {/* ── Stat cards ──────────────────────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={IconUsers}
            label="Enrollments"
            value={enrollments.length}
            sub="Total enrolled students"
          />
          <StatCard
            icon={IconCash}
            label="Revenue"
            value={currencyFormatter.format(revenue)}
            sub="From completed payments"
          />
          <StatCard
            icon={IconBolt}
            label="Completion"
            value={`${completionRate}%`}
            sub={`${enrollments.filter((e) => e.status === "expired").length} of ${enrollments.length} students`}
          />
          <StatCard
            icon={IconClock}
            label="Total Duration"
            value={formatDuration(course.stats.totalDurationSec)}
            sub={`${course.stats.totalLectures} lectures across ${course.stats.totalSections} sections`}
          />
        </div>

        {/* ── Main grid ───────────────────────────────────────────────────── */}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          {/* Left column */}
          <div className="min-w-0 space-y-6">
            {/* Course info card */}
            <Card className="rounded-2xl border-border/60 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Course Details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px]">
                <div className="flex flex-col gap-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {course.description || (
                      <span className="italic">No description added yet.</span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      <IconBook className="mr-1 size-3" />
                      {course.stats.totalSections} sections
                    </Badge>
                    <Badge variant="secondary">
                      <IconVideo className="mr-1 size-3" />
                      {course.stats.totalLectures} lectures
                    </Badge>
                    <Badge variant="secondary">
                      <IconFileText className="mr-1 size-3" />
                      {course.stats.totalResources} resources
                    </Badge>
                    <Badge variant="secondary">
                      <IconClock className="mr-1 size-3" />
                      {formatDuration(course.stats.totalDurationSec)}
                    </Badge>
                  </div>
                  {/* Completion bar */}
                  {enrollments.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Student completion rate
                        </span>
                        <span className="font-medium">{completionRate}%</span>
                      </div>
                      <Progress value={completionRate} className="h-1.5" />
                    </div>
                  )}
                </div>
                <div className="overflow-hidden rounded-xl border bg-muted/30">
                  {course.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={course.thumbnailUrl}
                      alt={course.name}
                      className="h-full w-full object-cover"
                      style={{ minHeight: 120, maxHeight: 140 }}
                    />
                  ) : (
                    <div className="flex h-36 flex-col items-center justify-center gap-2 text-muted-foreground">
                      <IconUpload className="h-5 w-5" />
                      <span className="text-xs">No thumbnail</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Curriculum manager */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-base">Curriculum</CardTitle>
                    <CardDescription className="mt-0.5">
                      Drag sections and lectures to reorder. Edits save
                      automatically.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search lectures…"
                        className="h-8 w-48 pl-8 text-sm"
                      />
                      {search && (
                        <button
                          onClick={() => setSearch("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <IconX className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() =>
                        updateCourseInCache((draft) => {
                          draft.sections.push({
                            id: createId(),
                            title: "Untitled Section",
                            position: draft.sections.length,
                            lectures: [],
                          });
                        })
                      }
                    >
                      <IconPlus className="h-4 w-4" />
                      Add Section
                    </Button>
                  </div>
                </div>

                {/* Bulk actions bar */}
                {selectedSections.length > 0 && (
                  <div className="flex items-center gap-3 rounded-md border bg-muted/50 px-3 py-2">
                    <span className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {selectedSections.length}
                      </span>{" "}
                      section{selectedSections.length > 1 ? "s" : ""} selected
                    </span>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 text-xs"
                      onClick={() =>
                        updateCourseInCache((draft) => {
                          draft.sections = draft.sections.filter(
                            (s) => !selectedSections.includes(String(s.id)),
                          );
                          setSelectedSections([]);
                        })
                      }
                    >
                      <IconTrash className="h-3.5 w-3.5" />
                      Delete selected
                    </Button>
                    <button
                      onClick={() => setSelectedSections([])}
                      className="ml-auto text-muted-foreground hover:text-foreground"
                    >
                      <IconX className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </CardHeader>

              <CardContent>
                {filteredSections.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-12 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <IconBook className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {search ? "No matching lectures" : "No sections yet"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {search
                          ? "Try a different search term."
                          : "Add your first section to start building the curriculum."}
                      </p>
                    </div>
                    {!search && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateCourseInCache((draft) => {
                            draft.sections.push({
                              id: createId(),
                              title: "Untitled Section",
                              position: draft.sections.length,
                              lectures: [],
                            });
                          })
                        }
                      >
                        <IconPlus className="h-4 w-4" />
                        Add Section
                      </Button>
                    )}
                  </div>
                ) : (
                  <Accordion type="multiple" className="space-y-2">
                    {filteredSections.map(
                      (section: PreviewSection, sectionIndex: number) => {
                        const isSelected = selectedSections.includes(
                          String(section.id),
                        );
                        const isDragOver =
                          dragOverSection === String(section.id);

                        return (
                          <AccordionItem
                            key={String(section.id)}
                            value={String(section.id)}
                            className={[
                              "rounded-lg border px-0 transition-colors",
                              isSelected
                                ? "border-primary bg-primary/5"
                                : "border-border",
                              isDragOver ? "border-primary/50 bg-muted/50" : "",
                            ].join(" ")}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData(
                                "section-index",
                                String(sectionIndex),
                              );
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              setDragOverSection(String(section.id));
                            }}
                            onDragLeave={() => setDragOverSection(null)}
                            onDrop={(e) => {
                              setDragOverSection(null);
                              const from = Number(
                                e.dataTransfer.getData("section-index"),
                              );
                              if (Number.isNaN(from) || from === sectionIndex)
                                return;
                              updateCourseInCache((draft) => {
                                const [moved] = draft.sections.splice(from, 1);
                                draft.sections.splice(sectionIndex, 0, moved);
                              });
                            }}
                          >
                            {/* Section header row */}
                            <div className="flex items-center gap-1.5 px-3 py-2.5">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    className={[
                                      "flex h-6 w-6 shrink-0 items-center justify-center rounded transition-colors",
                                      isSelected
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:bg-muted",
                                    ].join(" ")}
                                    onClick={() =>
                                      setSelectedSections((prev) =>
                                        prev.includes(String(section.id))
                                          ? prev.filter(
                                              (id) => id !== String(section.id),
                                            )
                                          : [...prev, String(section.id)],
                                      )
                                    }
                                  >
                                    {isSelected ? (
                                      <IconCheck className="h-3.5 w-3.5" />
                                    ) : (
                                      <IconLayersIntersect className="h-3.5 w-3.5" />
                                    )}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {isSelected ? "Deselect" : "Select"} section
                                </TooltipContent>
                              </Tooltip>

                              <IconGripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground/50" />

                              <Input
                                value={section.title}
                                onChange={(e) =>
                                  updateCourseInCache((draft) => {
                                    const target = draft.sections.find(
                                      (s) =>
                                        String(s.id) === String(section.id),
                                    );
                                    if (target) target.title = e.target.value;
                                  })
                                }
                                className="h-7 flex-1 border-transparent bg-transparent px-1 text-sm font-medium shadow-none focus-visible:border-border focus-visible:bg-background"
                              />

                              <Badge
                                variant="secondary"
                                className="shrink-0 text-xs"
                              >
                                {section.lectures.length}{" "}
                                {section.lectures.length === 1
                                  ? "lecture"
                                  : "lectures"}
                              </Badge>

                              <AccordionTrigger className="ml-1 py-0 [&>svg]:h-3.5 [&>svg]:w-3.5" />
                            </div>

                            <AccordionContent className="px-3 pb-3">
                              <Separator className="mb-3" />

                              {/* Lectures list */}
                              <div className="space-y-2">
                                {section.lectures.map(
                                  (
                                    lecture: PreviewLecture,
                                    lectureIndex: number,
                                  ) => (
                                    <div
                                      key={String(lecture.id)}
                                      className="rounded-md border bg-muted/20 p-3 transition-colors hover:bg-muted/40"
                                      draggable
                                      onDragStart={(e) => {
                                        e.dataTransfer.setData(
                                          "lecture-index",
                                          `${section.id}:${lectureIndex}`,
                                        );
                                      }}
                                      onDragOver={(e) => e.preventDefault()}
                                      onDrop={(e) => {
                                        const [srcSectionId, srcIdx] =
                                          e.dataTransfer
                                            .getData("lecture-index")
                                            .split(":");
                                        if (
                                          String(srcSectionId) !==
                                          String(section.id)
                                        )
                                          return;
                                        const from = Number(srcIdx);
                                        if (
                                          Number.isNaN(from) ||
                                          from === lectureIndex
                                        )
                                          return;
                                        updateCourseInCache((draft) => {
                                          const sec = draft.sections.find(
                                            (s) =>
                                              String(s.id) ===
                                              String(section.id),
                                          );
                                          if (!sec) return;
                                          const [moved] = sec.lectures.splice(
                                            from,
                                            1,
                                          );
                                          sec.lectures.splice(
                                            lectureIndex,
                                            0,
                                            moved,
                                          );
                                        });
                                      }}
                                    >
                                      {/* Lecture title row */}
                                      <div className="flex flex-wrap items-center gap-2">
                                        <IconGripVertical className="h-3.5 w-3.5 shrink-0 cursor-grab text-muted-foreground/50" />
                                        <IconVideo className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />

                                        <Input
                                          value={lecture.title}
                                          onChange={(e) =>
                                            updateCourseInCache((draft) => {
                                              const sec = draft.sections.find(
                                                (s) =>
                                                  String(s.id) ===
                                                  String(section.id),
                                              );
                                              const lec = sec?.lectures.find(
                                                (l) =>
                                                  String(l.id) ===
                                                  String(lecture.id),
                                              );
                                              if (lec)
                                                lec.title = e.target.value;
                                            })
                                          }
                                          className="h-7 min-w-32 flex-1 border-transparent bg-transparent px-1 text-sm shadow-none focus-visible:border-border focus-visible:bg-background"
                                        />

                                        <div className="flex shrink-0 items-center gap-1.5">
                                          <Badge
                                            variant="outline"
                                            className="text-xs tabular-nums"
                                          >
                                            {formatDuration(
                                              lecture.durationSec,
                                            )}
                                          </Badge>
                                          <Badge
                                            variant={
                                              lecture.videoUrl
                                                ? "secondary"
                                                : "outline"
                                            }
                                            className="text-xs"
                                          >
                                            {lecture.videoUrl
                                              ? "Video ready"
                                              : "No video"}
                                          </Badge>
                                          <Button
                                            size="sm"
                                            variant={
                                              lecture.isPreview
                                                ? "default"
                                                : "outline"
                                            }
                                            className="h-6 px-2 text-xs"
                                            onClick={() =>
                                              updateCourseInCache((draft) => {
                                                const sec = draft.sections.find(
                                                  (s) =>
                                                    String(s.id) ===
                                                    String(section.id),
                                                );
                                                const lec = sec?.lectures.find(
                                                  (l) =>
                                                    String(l.id) ===
                                                    String(lecture.id),
                                                );
                                                if (lec)
                                                  lec.isPreview =
                                                    !lec.isPreview;
                                              })
                                            }
                                          >
                                            Preview
                                          </Button>

                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                              >
                                                <IconDotsVertical className="h-3.5 w-3.5" />
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent
                                              align="end"
                                              className="w-44"
                                            >
                                              <DropdownMenuLabel className="text-xs">
                                                Lecture actions
                                              </DropdownMenuLabel>
                                              <DropdownMenuSeparator />
                                              <DropdownMenuItem
                                                className="text-destructive focus:text-destructive"
                                                onClick={() =>
                                                  updateCourseInCache(
                                                    (draft) => {
                                                      const sec =
                                                        draft.sections.find(
                                                          (s) =>
                                                            String(s.id) ===
                                                            String(section.id),
                                                        );
                                                      if (!sec) return;
                                                      sec.lectures =
                                                        sec.lectures.filter(
                                                          (l) =>
                                                            String(l.id) !==
                                                            String(lecture.id),
                                                        );
                                                    },
                                                  )
                                                }
                                              >
                                                <IconTrash className="h-3.5 w-3.5" />
                                                Delete lecture
                                              </DropdownMenuItem>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        </div>
                                      </div>

                                      {/* Resources */}
                                      {(lecture.resources.length > 0 ||
                                        true) /* always show upload */ && (
                                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                          {lecture.resources.map(
                                            (
                                              resource: PreviewLecture["resources"][number],
                                            ) => (
                                              <Badge
                                                key={String(resource.id)}
                                                variant="secondary"
                                                className="gap-1 text-xs"
                                              >
                                                <IconFileText className="h-3 w-3" />
                                                {resource.title}
                                              </Badge>
                                            ),
                                          )}
                                          <label className="cursor-pointer">
                                            <input
                                              type="file"
                                              className="hidden"
                                              onChange={async (e) => {
                                                const file =
                                                  e.target.files?.[0];
                                                if (!file) return;
                                                const form = new FormData();
                                                form.append("file", file);
                                                form.append("title", file.name);
                                                const res = await fetch(
                                                  "/api/admin/courses/upload-resource",
                                                  {
                                                    method: "POST",
                                                    body: form,
                                                  },
                                                );
                                                const result =
                                                  (await res.json()) as {
                                                    success: boolean;
                                                    fileUrl?: string;
                                                    fileName?: string;
                                                    error?: string;
                                                  };
                                                if (
                                                  !result.success ||
                                                  !result.fileUrl
                                                ) {
                                                  toast.error(
                                                    result.error ||
                                                      "Upload failed",
                                                  );
                                                  return;
                                                }
                                                updateCourseInCache((draft) => {
                                                  const sec =
                                                    draft.sections.find(
                                                      (s) =>
                                                        String(s.id) ===
                                                        String(section.id),
                                                    );
                                                  const lec =
                                                    sec?.lectures.find(
                                                      (l) =>
                                                        String(l.id) ===
                                                        String(lecture.id),
                                                    );
                                                  if (!lec) return;
                                                  lec.resources.push({
                                                    id: createId(),
                                                    title:
                                                      result.fileName ||
                                                      file.name,
                                                    fileUrl: result.fileUrl!,
                                                  });
                                                });
                                              }}
                                            />
                                            <span className="inline-flex h-6 cursor-pointer items-center gap-1 rounded-md border border-dashed px-2 text-xs text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground">
                                              <IconUpload className="h-3 w-3" />
                                              Attach resource
                                            </span>
                                          </label>
                                        </div>
                                      )}
                                    </div>
                                  ),
                                )}
                              </div>

                              {/* Section footer actions */}
                              <div className="mt-3 flex items-center justify-between">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-xs"
                                  onClick={() =>
                                    updateCourseInCache((draft) => {
                                      const sec = draft.sections.find(
                                        (s) =>
                                          String(s.id) === String(section.id),
                                      );
                                      if (!sec) return;
                                      sec.lectures.push({
                                        id: createId(),
                                        title: "Untitled Lecture",
                                        description: "",
                                        videoUrl: "",
                                        durationSec: 0,
                                        position: sec.lectures.length,
                                        isPreview: false,
                                        resources: [],
                                      });
                                    })
                                  }
                                >
                                  <IconPlus className="h-3.5 w-3.5" />
                                  Add Lecture
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 text-xs text-destructive hover:text-destructive"
                                  onClick={() =>
                                    updateCourseInCache((draft) => {
                                      draft.sections = draft.sections.filter(
                                        (s) =>
                                          String(s.id) !== String(section.id),
                                      );
                                    })
                                  }
                                >
                                  <IconTrash className="h-3.5 w-3.5" />
                                  Delete Section
                                </Button>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      },
                    )}
                  </Accordion>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column — sticky sidebar */}
          <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
            {/* Pricing card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Full Price
                    </label>
                    <Input
                      type="number"
                      min={0}
                      value={course.price}
                      onChange={(e) =>
                        updateCourseInCache((draft) => {
                          draft.price = Number(e.target.value) || 0;
                        })
                      }
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Discounted
                    </label>
                    <Input
                      type="number"
                      min={0}
                      value={course.discountPrice ?? 0}
                      onChange={(e) =>
                        updateCourseInCache((draft) => {
                          draft.discountPrice = Number(e.target.value) || 0;
                        })
                      }
                      className="h-9"
                    />
                  </div>
                </div>
                {discountPct > 0 && (
                  <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">
                      Discount applied
                    </span>
                    <Badge variant="secondary">{discountPct}% off</Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Status</CardTitle>
                <CardDescription>
                  Control course visibility for students.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {(["draft", "published", "archived"] as const).map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={course.status === s ? "default" : "outline"}
                      className="w-full capitalize"
                      disabled={statusMutation.isPending}
                      onClick={() => statusMutation.mutate(s)}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick actions card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() =>
                    updateCourseInCache((draft) => {
                      draft.sections.push({
                        id: createId(),
                        title: "Untitled Section",
                        position: draft.sections.length,
                        lectures: [],
                      });
                    })
                  }
                >
                  <IconLayersIntersect className="h-4 w-4" />
                  Add Section
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  <IconUpload className="h-4 w-4" />
                  Upload Lecture
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  <IconSchool className="h-4 w-4" />
                  Create Quiz
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── Operations tabs ──────────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Operations</CardTitle>
            <CardDescription>
              Monitor student enrollments, reviews, payments, and quizzes for
              this course.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="students">
              <ScrollArea className="pb-1">
                <TabsList className="w-full justify-start sm:w-auto">
                  <TabsTrigger value="students" className="gap-1.5">
                    <IconUsers className="h-3.5 w-3.5" />
                    Students
                    {enrollments.length > 0 && (
                      <Badge variant="secondary" className="h-4 px-1.5 text-xs">
                        {enrollments.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="reviews" className="gap-1.5">
                    <IconStar className="h-3.5 w-3.5" />
                    Reviews
                    {reviews.length > 0 && (
                      <Badge variant="secondary" className="h-4 px-1.5 text-xs">
                        {reviews.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="payments" className="gap-1.5">
                    <IconReceipt className="h-3.5 w-3.5" />
                    Payments
                    {payments.length > 0 && (
                      <Badge variant="secondary" className="h-4 px-1.5 text-xs">
                        {payments.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="quiz" className="gap-1.5">
                    <IconSchool className="h-3.5 w-3.5" />
                    Quizzes
                    {quizzes.length > 0 && (
                      <Badge variant="secondary" className="h-4 px-1.5 text-xs">
                        {quizzes.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </ScrollArea>

              <TabsContent value="students" className="mt-4">
                <AdminResourceTable
                  columns={enrollmentColumns}
                  data={enrollments}
                  isLoading={!enrollmentsData}
                  enableSelection={false}
                  emptyTitle="No enrollments yet"
                  emptyDescription="Students who enroll in this course will appear here."
                />
              </TabsContent>
              <TabsContent value="reviews" className="mt-4">
                <AdminResourceTable
                  columns={reviewColumns}
                  data={reviews}
                  isLoading={!reviewsData}
                  enableSelection={false}
                  emptyTitle="No reviews yet"
                  emptyDescription="Student reviews for this course will appear here."
                />
              </TabsContent>
              <TabsContent value="payments" className="mt-4">
                <AdminResourceTable
                  columns={paymentColumns}
                  data={payments}
                  isLoading={!paymentsData}
                  enableSelection={false}
                  emptyTitle="No payments yet"
                  emptyDescription="Payment transactions for this course will appear here."
                />
              </TabsContent>
              <TabsContent value="quiz" className="mt-4">
                <AdminResourceTable
                  columns={quizColumns}
                  data={quizzes}
                  isLoading={!quizzesData}
                  enableSelection={false}
                  emptyTitle="No quizzes yet"
                  emptyDescription="Create quizzes to test and reinforce student learning."
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* ── Delete confirmation dialog ───────────────────────────────────── */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete &quot;{course.name}&quot;?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action is permanent. The course and all associated
                curriculum, enrollment records, and analytics will be removed
                and cannot be recovered.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? "Deleting…" : "Delete course"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AdminPageShell>
    </TooltipProvider>
  );
}
