"use client";

import { useState, useMemo } from "react";
import { BookOpen } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { usePublishedCatalogCourses } from "@/features/courses";
import { CourseCard, CourseCardSkeleton } from "@/components/course-card";

// ─── Constants ──────────────────────────────────────────────────────────────

const LEVEL_TABS = [
  { key: "knowledge", label: "Knowledge" },
  { key: "skills", label: "Skills" },
  { key: "professional", label: "Professional" },
];

// ─── Main Component ─────────────────────────────────────────────────────────

export function CourseSection() {
  const [activeTab, setActiveTab] = useState("knowledge");
  const { data: courses = [], isPending } = usePublishedCatalogCourses();

  const filteredCourses = useMemo(() => {
    const safeCourses = Array.isArray(courses) ? courses : [];

    // Filter for only ACCA courses and the active level tab
    return safeCourses.filter((c: any) => {
      const isAcca = c.subject?.program_level?.program?.body === "ACCA";
      const matchesTab = c.level === activeTab;
      return isAcca && matchesTab;
    });
  }, [courses, activeTab]);

  return (
    <section
      id="explore-courses"
      className="bg-background py-20 lg:py-24"
      aria-label="Course catalogue"
    >
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="mb-6 flex flex-col justify-between gap-6 lg:mb-8 lg:flex-row lg:items-end">
          <div>
            <p className="mb-3 text-sm font-medium text-muted-foreground">
              Course Catalogue
            </p>
            <h2 className="mb-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Explore Courses
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              Browse our professionally structured ACCA programmes and
              supplementary courses designed by industry experts.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex lg:mb-10">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full max-w-2xl"
          >
            <TabsList>
              {LEVEL_TABS.map((tab) => (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Course grid / carousel */}
        {isPending ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-xl bg-muted">
              <BookOpen className="size-6 text-muted-foreground" />
            </div>
            <h3 className="mb-2 font-semibold text-foreground">
              No courses found
            </h3>
            <p className="mb-6 max-w-sm text-sm text-muted-foreground">
              We couldn&apos;t find any published courses in this level category.
              Please check back later or try another tab.
            </p>
          </div>
        ) : (
          <Carousel className="w-full" opts={{ align: "start", loop: false }}>
            <CarouselContent className="-ml-2 md:-ml-4">
              {filteredCourses.map((course) => (
                <CarouselItem
                  key={course.id}
                  className="basis-full pl-2 sm:basis-1/2 md:pl-4 lg:basis-1/3 xl:basis-1/4"
                >
                  <CourseCard course={course} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden xl:inline-flex" />
            <CarouselNext className="hidden xl:inline-flex" />
          </Carousel>
        )}
      </div>
    </section>
  );
}

