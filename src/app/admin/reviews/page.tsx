"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  IconMessageX,
  IconSearch,
  IconStar,
  IconTrash,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { AdminResourceTable } from "@/features/admin/components/admin-resource-table";
import { adminApi } from "@/features/admin/lib/admin-api";
import { type AdminReview } from "@/features/admin/data/admin-sample-data";
import { formatDate } from "@/features/admin/lib/formatters";

export default function ReviewsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: adminApi.getReviews,
  });

  const reviews = data?.reviews ?? [];
  const [search, setSearch] = React.useState("");
  const [courseFilter, setCourseFilter] = React.useState("all");
  const [deleteReview, setDeleteReview] = React.useState<AdminReview | null>(
    null,
  );

  const filteredReviews = React.useMemo(() => {
    const query = search.trim().toLowerCase();

    return reviews.filter((review) => {
      const matchesQuery =
        !query ||
        review.user.toLowerCase().includes(query) ||
        review.course.toLowerCase().includes(query) ||
        review.comment.toLowerCase().includes(query);

      const matchesCourse =
        courseFilter === "all" || review.course === courseFilter;

      return matchesQuery && matchesCourse;
    });
  }, [search, courseFilter]);

  const columns = React.useMemo<ColumnDef<AdminReview>[]>(
    () => [
      {
        accessorKey: "rating",
        header: "Rating",
        cell: ({ row }) => (
          <Badge className="rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300">
            <IconStar />
            {row.original.rating}/5
          </Badge>
        ),
      },
      {
        accessorKey: "comment",
        header: "Comment",
        cell: ({ row }) => (
          <p className="max-w-xl text-sm text-muted-foreground">
            {row.original.comment}
          </p>
        ),
      },
      { accessorKey: "user", header: "User" },
      { accessorKey: "course", header: "Course" },
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
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg"
            onClick={() => setDeleteReview(row.original)}
          >
            <IconTrash />
          </Button>
        ),
      },
    ],
    [],
  );

  const averageRating = filteredReviews.length
    ? (
        filteredReviews.reduce((sum, review) => sum + review.rating, 0) /
        filteredReviews.length
      ).toFixed(1)
    : "0.0";

  const reviewCourses = React.useMemo(
    () => Array.from(new Set(reviews.map((review) => review.course))).sort(),
    [reviews],
  );

  return (
    <AdminPageShell
      title="Reviews"
      description="Keep course feedback visible while moderating low-quality or abusive comments."
      actions={
        <Button
          variant="outline"
          className="rounded-xl"
          onClick={() => toast.info("Moderation queue refreshed")}
        >
          <IconMessageX />
          Refresh queue
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border-border/70 shadow-sm">
          <CardHeader>
            <CardDescription>Average rating</CardDescription>
            <CardTitle className="text-3xl tracking-tight">
              {averageRating}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl border-border/70 shadow-sm">
          <CardHeader>
            <CardDescription>Total reviews</CardDescription>
            <CardTitle className="text-3xl tracking-tight">
              {filteredReviews.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl border-border/70 shadow-sm">
          <CardHeader>
            <CardDescription>Reviewable courses</CardDescription>
            <CardTitle className="text-3xl tracking-tight">
              {reviewCourses.length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <AdminResourceTable
        columns={columns}
        data={filteredReviews}
        emptyTitle="No reviews found"
        emptyDescription="Broaden the search or switch course filters to see more feedback."
        isLoading={isLoading}
        toolbar={
          <>
            <div className="flex flex-1 flex-wrap items-center gap-3">
              <div className="relative min-w-60 flex-1 md:max-w-md">
                <IconSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-10 rounded-xl pl-9"
                  placeholder="Search reviews"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger className="h-10 rounded-xl md:w-72">
                  <SelectValue placeholder="Filter by course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All courses</SelectItem>
                  {reviewCourses.map((course) => (
                    <SelectItem key={course} value={course}>
                      {course}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Badge variant="secondary" className="rounded-full px-3 py-1">
              {filteredReviews.length} reviews
            </Badge>
          </>
        }
      />

      <AlertDialog
        open={!!deleteReview}
        onOpenChange={(open) => !open && setDeleteReview(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete review?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the comment from {deleteReview?.user}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteReview) {
                  toast.success("Review removed");
                  setDeleteReview(null);
                }
              }}
            >
              Delete review
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageShell>
  );
}
