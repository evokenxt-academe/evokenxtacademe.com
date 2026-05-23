"use client";

import { useState, useMemo } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { usePublishedCatalogCourses } from "@/features/courses";
import { CourseFilters } from "./course-filters";
import { CourseCard } from "@/components/course-card";
import { CourseCardSkeleton } from "./course-card-skeleton";
import { CourseEmptyState } from "./course-empty-state";
import { BookOpen, GraduationCap, Briefcase } from "lucide-react";

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
      {/* ── Beautiful Premium Stat Cards (Fully Responsive Dual-Layout) ── */}
      
      {/* Mobile View: Single Unified Compact Stats Bar (Prevents any horizontal overflow/clipping) */}
      <div className="flex w-full items-center justify-around rounded-xl border border-border/60 bg-gradient-to-b from-card to-card/50 py-3.5 px-2 shadow-sm sm:hidden">
        <div className="flex flex-1 flex-col items-center text-center">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground">Published</span>
          <span className="text-base font-black tracking-tight text-foreground mt-0.5">{safeCourses.length}</span>
        </div>
        <div className="h-6 w-px bg-border/60" />
        <div className="flex flex-1 flex-col items-center text-center">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground">Knowledge</span>
          <span className="text-base font-black tracking-tight text-foreground mt-0.5">
            {safeCourses.filter((course) => course.level === "knowledge").length}
          </span>
        </div>
        <div className="h-6 w-px bg-border/60" />
        <div className="flex flex-1 flex-col items-center text-center">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground">Professional</span>
          <span className="text-base font-black tracking-tight text-foreground mt-0.5">
            {safeCourses.filter((course) => course.level === "professional").length}
          </span>
        </div>
      </div>

      {/* Desktop/Tablet View: Gorgeous Bento Cards Grid with Icons */}
      <div className="hidden sm:grid grid-cols-3 gap-4">
        {/* Card 1 - Published Courses */}
        <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-card to-card/50 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/[0.02]">
          <div className="absolute -right-6 -top-6 -z-10 size-20 rounded-full bg-primary/10 blur-xl transition-all group-hover:bg-primary/20" />
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Published Courses</span>
              <span className="text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
                {safeCourses.length}
              </span>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BookOpen className="size-5" />
            </div>
          </div>
        </div>

        {/* Card 2 - Knowledge Level */}
        <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-card to-card/50 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-500/20 hover:shadow-lg hover:shadow-violet-500/[0.02]">
          <div className="absolute -right-6 -top-6 -z-10 size-20 rounded-full bg-violet-500/10 blur-xl transition-all group-hover:bg-violet-500/20" />
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Knowledge Level</span>
              <span className="text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
                {safeCourses.filter((course) => course.level === "knowledge").length}
              </span>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
              <GraduationCap className="size-5" />
            </div>
          </div>
        </div>

        {/* Card 3 - Professional Level */}
        <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-card to-card/50 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/[0.02]">
          <div className="absolute -right-6 -top-6 -z-10 size-20 rounded-full bg-emerald-500/10 blur-xl transition-all group-hover:bg-emerald-500/20" />
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Professional Level</span>
              <span className="text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
                {safeCourses.filter((course) => course.level === "professional").length}
              </span>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <Briefcase className="size-5" />
            </div>
          </div>
        </div>
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
