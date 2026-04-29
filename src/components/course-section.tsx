"use client";

import { useState, useMemo, useEffect, ReactNode } from "react";
import Link from "next/link";
import { BookOpen, ArrowRight, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Course {
  id: string;
  name: string;
  code?: string;
  description: string;
  level: "P-Level" | "Knowledge Level" | "Skill Level" | "Other";
  image: string;
  duration: string;
  students: string;
  badge?: "Bestseller" | "New" | "Top Rated" | "Updated";
}

// ─── Data ───────────────────────────────────────────────────────────────────

const COURSES_DATA: Course[] = [
  {
    id: "sbr",
    name: "Strategic Business Reporting",
    code: "SBR",
    description:
      "Master complex financial reporting standards, ethical frameworks, and professional judgment at the strategic level.",
    level: "P-Level",
    image:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=800&h=600&fit=crop",
    duration: "120 hrs",
    students: "2.4k",
    badge: "Bestseller",
  },
  {
    id: "apm",
    name: "Advanced Performance Management",
    code: "APM",
    description:
      "Apply strategic planning, performance measurement, and risk management techniques to real-world business scenarios.",
    level: "P-Level",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&h=600&fit=crop",
    duration: "110 hrs",
    students: "1.8k",
  },
  {
    id: "aaa",
    name: "Advanced Audit & Assurance",
    code: "AAA",
    description:
      "Analyze, evaluate and report on the assurance engagement and other audit and assurance issues.",
    level: "P-Level",
    image:
      "https://images.unsplash.com/photo-1554200876-0f8a37daec06?q=80&w=800&h=600&fit=crop",
    duration: "115 hrs",
    students: "1.5k",
    badge: "New",
  },
  {
    id: "afm",
    name: "Advanced Financial Management",
    code: "AFM",
    description:
      "Apply relevant knowledge, skills and exercise professional judgment as expected of a senior financial executive.",
    level: "P-Level",
    image:
      "https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?q=80&w=800&h=600&fit=crop",
    duration: "118 hrs",
    students: "1.9k",
  },
  {
    id: "fa",
    name: "Financial Accounting",
    code: "FA",
    description:
      "Build a solid foundation in double-entry bookkeeping, financial statements, and accounting principles.",
    level: "Knowledge Level",
    image:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=800&h=600&fit=crop",
    duration: "80 hrs",
    students: "5.1k",
    badge: "Bestseller",
  },
  {
    id: "bt",
    name: "Business & Technology",
    code: "BT",
    description:
      "Understand the business environment, governance, organisational structures, and IT systems in accounting.",
    level: "Knowledge Level",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&h=600&fit=crop",
    duration: "75 hrs",
    students: "4.7k",
  },
  {
    id: "ma",
    name: "Management Accounting",
    code: "MA",
    description:
      "Learn cost classification, budgeting, variance analysis, and decision-making techniques for management.",
    level: "Knowledge Level",
    image:
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=800&h=600&fit=crop",
    duration: "78 hrs",
    students: "3.9k",
    badge: "Top Rated",
  },
  {
    id: "lw",
    name: "Corporate & Business Law",
    code: "LW",
    description:
      "Develop knowledge and skills in the understanding of the general legal framework, and of specific legal areas.",
    level: "Skill Level",
    image:
      "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=800&h=600&fit=crop",
    duration: "85 hrs",
    students: "2.3k",
  },
  {
    id: "pm",
    name: "Performance Management",
    code: "PM",
    description:
      "Apply management accounting techniques for planning, analysis, and performance evaluation.",
    level: "Skill Level",
    image:
      "https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?q=80&w=800&h=600&fit=crop",
    duration: "90 hrs",
    students: "3.2k",
  },
  {
    id: "fm",
    name: "Financial Management",
    code: "FM",
    description:
      "Develop competency in investment appraisal, business finance, working capital, and risk management.",
    level: "Skill Level",
    image:
      "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=800&h=600&fit=crop",
    duration: "95 hrs",
    students: "2.8k",
  },
  {
    id: "fr",
    name: "Financial Reporting",
    code: "FR",
    description:
      "Prepare and interpret financial statements for single entities and groups using IFRS standards.",
    level: "Skill Level",
    image:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=800&h=600&fit=crop",
    duration: "100 hrs",
    students: "3.5k",
    badge: "Bestseller",
  },
  {
    id: "aa",
    name: "Audit & Assurance",
    code: "AA",
    description:
      "Understand the audit process, risk assessment, internal controls, and professional ethics in assurance.",
    level: "Skill Level",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&h=600&fit=crop",
    duration: "88 hrs",
    students: "2.6k",
  },
  {
    id: "tx",
    name: "UK Taxation",
    code: "TX",
    description:
      "Compute income tax, corporation tax, CGT, VAT, and national insurance for individuals and businesses.",
    level: "Skill Level",
    image:
      "https://images.unsplash.com/photo-1554200876-0f8a37daec06?q=80&w=800&h=600&fit=crop",
    duration: "85 hrs",
    students: "2.1k",
    badge: "Updated",
  },
  {
    id: "aptitude",
    name: "Aptitude Test Prep",
    code: "ACCA / CFA",
    description:
      "Prepare for competitive aptitude assessments across ACCA, CFA, and CMA US certification pathways.",
    level: "Other",
    image:
      "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800&h=600&fit=crop",
    duration: "40 hrs",
    students: "6.2k",
    badge: "Bestseller",
  },
  {
    id: "basics",
    name: "Accounting Fundamentals",
    description:
      "An introductory course covering accounting fundamentals, the accounting equation, and basic journal entries.",
    level: "Other",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&h=600&fit=crop",
    duration: "30 hrs",
    students: "8.5k",
  },
  {
    id: "excel",
    name: "Advanced Excel for Finance",
    description:
      "Master financial modeling, pivot tables, macros, and advanced formulas tailored for finance professionals.",
    level: "Other",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&h=600&fit=crop",
    duration: "45 hrs",
    students: "10.2k",
    badge: "Top Rated",
  },
];

const LEVEL_TABS = [
  { key: "P-Level", label: "Professional" },
  { key: "Knowledge Level", label: "Knowledge" },
  { key: "Skill Level", label: "Skills" },
];

// ─── Sub-components ─────────────────────────────────────────────────────────

function CourseCard({ course }: { course: Course }) {
  return (
    <>
      {/* Image */}
      <div className="h-40 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={course.image}
          alt={course.name}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          width={100}
          height={100}
        />
      </div>

      <div className="flex grow flex-col p-5">
        <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {course.duration}
          </span>
          <span className="flex items-center gap-1">
            <Users className="size-3" />
            {course.students}
          </span>
        </div>
        <h3 className="mb-2 line-clamp-2 text-sm font-semibold leading-snug">
          {course.name}
        </h3>
        <p className="mb-4 line-clamp-2 grow text-xs leading-relaxed text-muted-foreground">
          {course.description}
        </p>

        <div className="mt-auto flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 text-xs" asChild>
            <Link href={`/courses/${course.id}`}>Details</Link>
          </Button>
          <Button size="sm" className="flex-1 text-xs">
            Enroll
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      </div>
    </>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <FeatureCard key={i}>
          <Skeleton className="h-40 w-full rounded-none" />
          <div className="flex flex-col gap-3 p-5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 flex-1" />
            </div>
          </div>
        </FeatureCard>
      ))}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function CourseSection() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("P-Level");

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const filteredCourses = useMemo(() => {
    let courses = COURSES_DATA;

    // Filter by level
    if (activeTab !== "all") {
      courses = courses.filter((c) => c.level === activeTab);
    }

    return courses;
  }, [activeTab]);

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
            className="w-full max-w-lg"
          >
            <TabsList className="grid h-14 w-full grid-cols-3 gap-1.5 rounded-full border border-border/60 bg-muted/50 p-0.5 shadow-sm shadow-black/5 backdrop-blur-sm">
              {LEVEL_TABS.map((tab) => (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  className="rounded-full px-4 text-sm font-medium tracking-[-0.01em] text-muted-foreground transition-all duration-200 hover:text-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-[0_1px_2px_rgba(15,23,42,0.08)] md:px-6 md:text-[15px]"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Course grid */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : filteredCourses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-xl bg-muted">
              <BookOpen className="size-6 text-muted-foreground" />
            </div>
            <h3 className="mb-2 font-semibold text-foreground">
              No courses found
            </h3>
            <p className="mb-6 max-w-sm text-sm text-muted-foreground">
              We couldn&apos;t find any courses in this category. Try another
              tab.
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
                  <FeatureCard className="h-full">
                    <CourseCard course={course} />
                  </FeatureCard>
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


const FeatureCard = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "group relative flex flex-col rounded-none bg-card border border-border/50 transition-all duration-300 hover:border-foreground/20 hover:shadow-lg",
      className
    )}
  >
    <CardDecorator />
    {children}
  </div>
);

const CardDecorator = () => (
  <div className="pointer-events-none absolute inset-0 z-10">
    <span className="absolute -left-px -top-px block size-2 border-l-2 border-t-2 border-primary transition-all group-hover:size-3 group-active:size-3"></span>
    <span className="absolute -right-px -top-px block size-2 border-r-2 border-t-2 border-primary transition-all group-hover:size-3 group-active:size-3"></span>
    <span className="absolute -bottom-px -left-px block size-2 border-b-2 border-l-2 border-primary transition-all group-hover:size-3 group-active:size-3"></span>
    <span className="absolute -bottom-px -right-px block size-2 border-b-2 border-r-2 border-primary transition-all group-hover:size-3 group-active:size-3"></span>
  </div>
);
