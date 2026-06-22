"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { IconPlus, IconBookOff } from "@tabler/icons-react";
import { toast } from "sonner";

import { CourseFiltersBar } from "@/components/admin/courses/course-filters";
import { getCourseColumns } from "@/components/admin/courses/course-columns";
import { CourseMobileCard } from "@/components/admin/courses/course-mobile-card";
import { BulkActionsBar } from "@/components/admin/courses/bulk-actions-bar";
import {
  fetchCourses,
  deleteCourse,
  duplicateCourse,
  toggleFeatured,
  updateCourseStatus,
  bulkUpdateStatus,
  bulkDeleteCourses,
  fetchCoursePricing,
  COURSES_PAGE_SIZE,
  type CourseListItem,
  type CourseFilters,
  type CoursePricing,
} from "@/lib/supabase/queries/courses-admin";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils/format";
import { useMediaQuery } from "@/hooks/use-media-query";

export default function CoursesListPage() {
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [courses, setCourses] = React.useState<CourseListItem[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [filters, setFilters] = React.useState<CourseFilters>({});
  const [page, setPage] = React.useState(0);
  const [rowSelection, setRowSelection] = React.useState<
    Record<string, boolean>
  >({});
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState(false);

  // Pricing sheet
  const [pricingCourse, setPricingCourse] =
    React.useState<CourseListItem | null>(null);
  const [pricingData, setPricingData] = React.useState<CoursePricing[]>([]);
  const [pricingLoading, setPricingLoading] = React.useState(false);

  const pageSize = COURSES_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const loadCourses = React.useCallback(async () => {
    setLoading(true);
    try {
      const { data, count } = await fetchCourses(filters, page, pageSize);
      setCourses(data);
      setTotalCount(count);
      setRowSelection({});
    } catch (err) {
      console.error(err);
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  React.useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  // Realtime subscription
  React.useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("courses-list")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "courses" },
        () => {
          loadCourses();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadCourses]);

  // Actions
  const handleEdit = (id: string) => router.push(`/admin/courses/${id}/edit`);
  const handleContent = (id: string) =>
    router.push(`/admin/courses/${id}/content`);
  const handleLiveStreams = (id: string) =>
    router.push(`/admin/courses/${id}/live-streams`);

  const handlePricing = async (course: CourseListItem) => {
    setPricingCourse(course);
    setPricingLoading(true);
    try {
      const data = await fetchCoursePricing(course.id);
      setPricingData(data);
    } catch {
      toast.error("Failed to load pricing");
    } finally {
      setPricingLoading(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateCourse(id);
      toast.success("Course duplicated as draft");
      loadCourses();
    } catch {
      toast.error("Failed to duplicate course");
    }
  };

  const handleStatusChange = async (
    id: string,
    status: "draft" | "published" | "archived",
  ) => {
    try {
      await updateCourseStatus(id, status);
      toast.success(`Course ${status}`);
      loadCourses();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setActionLoading(true);
    try {
      await deleteCourse(deleteId);
      toast.success("Course deleted");
      setDeleteId(null);
      loadCourses();
    } catch {
      toast.error("Failed to delete course");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleFeatured = async (id: string, value: boolean) => {
    try {
      await toggleFeatured(id, value);
      setCourses((prev) =>
        prev.map((c) => (c.id === id ? { ...c, is_featured: value } : c)),
      );
      toast.success(value ? "Course featured" : "Course unfeatured");
    } catch {
      toast.error("Failed to update");
    }
  };

  // Bulk actions
  const selectedIds = Object.keys(rowSelection).filter((k) => rowSelection[k]);
  const selectedCourseIds = selectedIds
    .map((idx) => courses[Number(idx)]?.id)
    .filter(Boolean) as string[];

  const handleBulkPublish = async () => {
    setActionLoading(true);
    try {
      await bulkUpdateStatus(selectedCourseIds, "published");
      toast.success(`${selectedCourseIds.length} courses published`);
      setRowSelection({});
      loadCourses();
    } catch {
      toast.error("Failed to publish courses");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkArchive = async () => {
    setActionLoading(true);
    try {
      await bulkUpdateStatus(selectedCourseIds, "archived");
      toast.success(`${selectedCourseIds.length} courses archived`);
      setRowSelection({});
      loadCourses();
    } catch {
      toast.error("Failed to archive courses");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    setActionLoading(true);
    try {
      await bulkDeleteCourses(selectedCourseIds);
      toast.success(`${selectedCourseIds.length} courses deleted`);
      setRowSelection({});
      setBulkDeleteOpen(false);
      loadCourses();
    } catch {
      toast.error("Failed to delete courses");
    } finally {
      setActionLoading(false);
    }
  };

  const columns = React.useMemo(
    () =>
      getCourseColumns({
        onEdit: handleEdit,
        onContent: handleContent,
        onLiveStreams: handleLiveStreams,
        onPricing: handlePricing,
        onDuplicate: handleDuplicate,
        onStatusChange: handleStatusChange,
        onDelete: (id) => setDeleteId(id),
        onToggleFeatured: handleToggleFeatured,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const table = useReactTable({
    data: courses,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    state: { rowSelection },
    manualPagination: true,
    pageCount: Math.ceil(totalCount / pageSize),
  });

  const fromRow = totalCount === 0 ? 0 : page * pageSize + 1;
  const toRow = Math.min((page + 1) * pageSize, totalCount);

  React.useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(totalCount / pageSize) - 1);
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [page, pageSize, totalCount]);

  const columnActions = React.useMemo(
    () => ({
      onEdit: handleEdit,
      onContent: handleContent,
      onLiveStreams: handleLiveStreams,
      onPricing: handlePricing,
      onDuplicate: handleDuplicate,
      onStatusChange: handleStatusChange,
      onDelete: (id: string) => setDeleteId(id),
      onToggleFeatured: handleToggleFeatured,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div className="flex flex-col gap-6 p-4 md:p-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">

          <h1 className="text-2xl font-semibold tracking-tight">Courses</h1>
        </div>
        <Button
          onClick={() => router.push("/admin/courses/new")}
          className="w-full sm:w-auto"
        >
          <IconPlus data-icon="inline-start" />
          New Course
        </Button>
      </div>

      {/* Filters */}
      <CourseFiltersBar
        filters={filters}
        onFiltersChange={(f) => {
          setPage(0);
          setRowSelection({});
          setFilters(f);
        }}
      />

      {/* Bulk actions */}
      <BulkActionsBar
        count={selectedCourseIds.length}
        onPublish={handleBulkPublish}
        onArchive={handleBulkArchive}
        onDelete={() => setBulkDeleteOpen(true)}
        loading={actionLoading}
      />

      {/* Course list */}
      <div className="rounded-lg border bg-card">
        {loading ? (
          isMobile ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          style={{ width: header.getSize() }}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {Array.from({ length: pageSize }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="size-4" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="size-10 rounded-md" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-48" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-36" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-12" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-12" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="size-4" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="size-6" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )
        ) : courses.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 px-4 text-center">
            <IconBookOff className="size-12 text-muted-foreground" />
            <div className="flex flex-col gap-1">
              <p className="text-lg font-medium">No courses found</p>
              <p className="text-sm text-muted-foreground">
                {Object.keys(filters).length > 0
                  ? "Try adjusting your filters"
                  : "Create your first course to get started"}
              </p>
            </div>
            {Object.keys(filters).length === 0 && (
              <Button onClick={() => router.push("/admin/courses/new")}>
                <IconPlus data-icon="inline-start" />
                Create Course
              </Button>
            )}
          </div>
        ) : isMobile ? (
          <div className="space-y-3 p-4">
            {courses.map((course, index) => (
              <CourseMobileCard
                key={course.id}
                course={course}
                selected={!!rowSelection[String(index)]}
                onSelect={(checked) =>
                  setRowSelection((prev) => ({
                    ...prev,
                    [String(index)]: checked,
                  }))
                }
                {...columnActions}
              />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        style={{ width: header.getSize() }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {!loading && totalCount > 0 && (
          <>
            <Separator />
            <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-center text-sm text-muted-foreground sm:text-left">
                Showing {fromRow}–{toRow} of {totalCount} courses
              </span>
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="flex-1 sm:flex-none"
                >
                  Previous
                </Button>
                <span className="min-w-24 text-center text-sm tabular-nums">
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page + 1 >= totalPages}
                  className="flex-1 sm:flex-none"
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              course and all associated content (chapters, lectures, resources).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete confirmation */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedCourseIds.length} Courses
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All selected courses and their
              content will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading ? "Deleting..." : "Delete All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pricing sheet */}
      <Sheet open={!!pricingCourse} onOpenChange={() => setPricingCourse(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Pricing — {pricingCourse?.title}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 flex flex-col gap-4">
            {pricingLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))
            ) : pricingData.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No pricing tiers set
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPricingCourse(null);
                    if (pricingCourse)
                      router.push(`/admin/courses/${pricingCourse.id}/edit`);
                  }}
                >
                  Add Pricing
                </Button>
              </div>
            ) : (
              pricingData.map((tier) => (
                <div key={tier.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{tier.label}</span>
                    <Badge variant={tier.is_active ? "default" : "secondary"}>
                      {tier.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    {tier.discounted_price ? (
                      <>
                        <span className="text-lg font-semibold">
                          {formatCurrency(tier.discounted_price, tier.currency)}
                        </span>
                        <span className="text-sm text-muted-foreground line-through">
                          {formatCurrency(tier.base_price, tier.currency)}
                        </span>
                        {tier.discount_pct && (
                          <Badge variant="secondary">
                            {Number(tier.discount_pct).toFixed(0)}% off
                          </Badge>
                        )}
                      </>
                    ) : (
                      <span className="text-lg font-semibold">
                        {formatCurrency(tier.base_price, tier.currency)}
                      </span>
                    )}
                  </div>
                  {(tier.valid_from || tier.valid_until) && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {tier.valid_from &&
                        `From ${new Date(tier.valid_from).toLocaleDateString()}`}
                      {tier.valid_from && tier.valid_until && " · "}
                      {tier.valid_until &&
                        `Until ${new Date(tier.valid_until).toLocaleDateString()}`}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
