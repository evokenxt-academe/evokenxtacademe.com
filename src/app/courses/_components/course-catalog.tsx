"use client";

import { useState, useMemo } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { usePublishedCatalogCourses } from "@/features/courses";
import { CourseFilters } from "./course-filters";
import { CourseCard } from "@/components/course-card";
import { CourseCardSkeleton } from "./course-card-skeleton";
import { CourseEmptyState } from "./course-empty-state";

export function CourseCatalog() {
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("all");
  const [sort, setSort] = useState("latest");
  const { data: courses = [], isPending, isError, error } =
    usePublishedCatalogCourses();
  const safeCourses = Array.isArray(courses) ? courses : [];

  const filtered = useMemo(() => {
    let result = [...safeCourses];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.description ?? "").toLowerCase().includes(q) ||
          (c.instructor?.name ?? "").toLowerCase().includes(q)
      );
    }

    // Level filter
    if (level !== "all") {
      result = result.filter((c) => c.level === level);
    }

    // Sort
    if (sort === "latest") {
      result.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (sort === "price-low") {
      result.sort((a, b) => a.price - b.price);
    } else if (sort === "price-high") {
      result.sort((a, b) => b.price - a.price);
    } else if (sort === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === "popular") {
      // Sort by review count descending
      result.sort(
        (a, b) => (b.reviews?.length ?? 0) - (a.reviews?.length ?? 0)
      );
    }

    return result;
  }, [safeCourses, search, level, sort]);

  const hasFilters = search.trim() !== "" || level !== "all";

  function handleReset() {
    setSearch("");
    setLevel("all");
    setSort("latest");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="flex flex-col gap-1 py-4">
            <p className="text-xs text-muted-foreground">Published courses</p>
            <p className="text-2xl font-semibold tabular-nums">{safeCourses.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 py-4">
            <p className="text-xs text-muted-foreground">Knowledge level</p>
            <p className="text-2xl font-semibold tabular-nums">
              {safeCourses.filter((course) => course.level === "knowledge").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 py-4">
            <p className="text-xs text-muted-foreground">Professional level</p>
            <p className="text-2xl font-semibold tabular-nums">
              {safeCourses.filter((course) => course.level === "professional").length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <CourseFilters
        search={search}
        onSearchChange={setSearch}
        level={level}
        onLevelChange={setLevel}
        sort={sort}
        onSortChange={setSort}
        totalResults={filtered.length}
      />

      {isError ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to sync course catalog</AlertTitle>
          <AlertDescription>
            {error?.message ??
              "Please refresh the page. If this issue persists, contact support."}
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Grid */}
      {isPending ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <CourseCardSkeleton key={index} />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <CourseEmptyState
          hasFilters={hasFilters}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
