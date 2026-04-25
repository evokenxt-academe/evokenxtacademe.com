"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  BookOpen,
  ArrowUpRight,
  GraduationCap,
  Award,
  Layers,
  Sparkles,
  FileText,
  Clock,
  Users,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

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

interface CourseCategory {
  key: string;
  label: string;
  tabLabel: string;
  description: string;
  icon: React.ReactNode;
  accent: string;
  courses: Course[];
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

const CATEGORY_CONFIG = [
  {
    key: "P-Level" as const,
    label: "Professional Level",
    tabLabel: "P-Level",
    description: "Strategic Professional — the pinnacle of your ACCA journey.",
    icon: <Award className="size-[18px]" />,
    accent: "from-indigo-500 to-violet-600",
  },
  {
    key: "Knowledge Level" as const,
    label: "Knowledge Level",
    tabLabel: "Knowledge",
    description: "Applied Knowledge — foundational papers for your professional path.",
    icon: <BookOpen className="size-[18px]" />,
    accent: "from-emerald-500 to-teal-600",
  },
  {
    key: "Skill Level" as const,
    label: "Skill Level",
    tabLabel: "Skills",
    description: "Applied Skills — deepen your practical competence across core subjects.",
    icon: <Layers className="size-[18px]" />,
    accent: "from-sky-500 to-blue-600",
  },
  {
    key: "Other" as const,
    label: "Other Courses",
    tabLabel: "Other",
    description: "Supplementary courses and aptitude preparation for aspiring professionals.",
    icon: <Sparkles className="size-[18px]" />,
    accent: "from-amber-500 to-orange-600",
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildCategories(courses: Course[], query: string): CourseCategory[] {
  const filtered = courses.filter((c) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.level.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      (c.code && c.code.toLowerCase().includes(q))
    );
  });

  return CATEGORY_CONFIG.map((cfg) => ({
    ...cfg,
    courses: filtered.filter((c) => c.level === cfg.key),
  })).filter((cat) => cat.courses.length > 0);
}

function getLevelColor(level: Course["level"]) {
  switch (level) {
    case "P-Level":
      return "bg-indigo-500";
    case "Knowledge Level":
      return "bg-emerald-500";
    case "Skill Level":
      return "bg-sky-500";
    case "Other":
      return "bg-amber-500";
    default:
      return "bg-slate-500";
  }
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function CourseCard({ course }: { course: Course }) {
  return (
    <div className="group relative flex flex-col bg-[#121b2f] border border-white/[0.06] hover:border-sky-500/30 transition-all duration-300">
      {/* Image area */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={course.image}
          alt={course.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#121b2f] via-transparent to-transparent opacity-80" />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-start justify-between z-10">
          <div className="flex flex-col gap-2">
            {/* Level indicator */}
            <div className="inline-flex items-center gap-2 bg-[#0E1628] border border-white/10 px-2.5 py-1">
              <span className={`w-1.5 h-1.5 rounded-full ${getLevelColor(course.level)}`} />
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-white">
                {course.level}
              </span>
            </div>
            {/* Badge */}
            {course.badge && (
              <span className="inline-flex w-fit px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-[#0E1628] bg-sky-400">
                {course.badge}
              </span>
            )}
          </div>
          {/* Code */}
          {course.code && (
            <span className="text-[10px] font-mono font-bold tracking-widest text-sky-400 bg-sky-400/10 border border-sky-400/20 px-2 py-1">
              {course.code}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-grow p-6">
        <div className="flex items-center gap-4 mb-4 text-[11px] font-semibold text-slate-400 tracking-wider">
          <span className="flex items-center gap-1.5"><Clock className="size-3 text-slate-500" /> {course.duration}</span>
          <span className="w-1 h-1 bg-white/10 rounded-full" />
          <span className="flex items-center gap-1.5"><Users className="size-3 text-slate-500" /> {course.students}</span>
        </div>

        <h3 className="text-[18px] font-black text-white leading-snug mb-3 group-hover:text-sky-400 transition-colors duration-300 line-clamp-2">
          {course.name}
        </h3>
        <p className="text-[13px] leading-[1.7] text-slate-400 mb-8 line-clamp-2 flex-grow">
          {course.description}
        </p>

        {/* Action row */}
        <div className="flex items-center gap-3 mt-auto">
          <Link href={`/courses/${course.id}`} className="flex-1 h-11 flex items-center justify-center border border-white/10 text-[11px] font-bold uppercase tracking-widest text-slate-300 hover:bg-white/5 hover:text-white transition-all">
            View Details
          </Link>
          <button className="flex-1 h-11 flex items-center justify-center gap-2 bg-sky-600 text-[11px] font-bold uppercase tracking-widest text-white hover:bg-sky-500 transition-all">
            <span>Enroll</span>
            <ArrowUpRight className="size-4 opacity-50 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CategorySection({ category }: { category: CourseCategory }) {
  return (
    <div>
      {/* Category heading */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-5">
          <div className={`size-12 rounded-none bg-gradient-to-br ${category.accent} flex items-center justify-center text-white`}>
            {category.icon}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-xl font-bold text-white tracking-tight uppercase">
                {category.label}
              </h3>
              <Badge variant="secondary" className="bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-none px-2 py-0.5 text-[10px] font-bold">
                {category.courses.length}
              </Badge>
            </div>
            <p className="text-[13px] text-slate-400 hidden sm:block font-medium">
              {category.description}
            </p>
          </div>
        </div>
      </div>

      {/* Course grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {category.courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-16">
      {[1, 2, 3].map((group) => (
        <div key={group}>
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="size-10 bg-white/[0.04] rounded-none" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-40 bg-white/[0.04] rounded-none" />
              <Skeleton className="h-3 w-64 bg-white/[0.04] rounded-none" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((card) => (
              <div key={card} className="bg-[#0f1a2e] border border-white/[0.04] overflow-hidden">
                <Skeleton className="h-52 w-full bg-white/[0.04] rounded-none" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-4 w-3/4 bg-white/[0.04] rounded-none" />
                  <Skeleton className="h-3 w-full bg-white/[0.04] rounded-none" />
                  <Skeleton className="h-3 w-2/3 bg-white/[0.04] rounded-none" />
                  <div className="pt-4 border-t border-white/[0.04]">
                    <div className="flex gap-3">
                      <Skeleton className="h-10 flex-1 bg-white/[0.04] rounded-none" />
                      <Skeleton className="h-10 flex-1 bg-white/[0.04] rounded-none" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 px-6 border border-white/[0.04] bg-white/[0.01]">
      <div className="size-20 bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-6">
        <FileText className="size-8 text-slate-600" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2 tracking-tight">
        No courses found
      </h3>
      <p className="text-[13px] text-slate-500 text-center max-w-sm mb-8 leading-relaxed">
        We couldn&apos;t find any courses matching your search. Try a different
        keyword or clear the filter.
      </p>
      <button
        className="h-10 px-8 text-[11px] font-bold uppercase tracking-[0.1em] border border-white/[0.08] text-slate-300 hover:bg-white/[0.04] hover:text-white transition-all duration-300"
        onClick={onReset}
      >
        Clear search
      </button>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function CourseSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const categories = useMemo(
    () => buildCategories(COURSES_DATA, searchQuery),
    [searchQuery]
  );

  const filteredCategories = useMemo(() => {
    if (activeTab === "all") return categories;
    return categories.filter((cat) => cat.key === activeTab);
  }, [categories, activeTab]);

  const totalCourses = useMemo(
    () => categories.reduce((sum, cat) => sum + cat.courses.length, 0),
    [categories]
  );

  return (
    <section
      id="explore-courses"
      className="py-24 md:py-32 bg-[#0E1628] relative overflow-hidden border-t border-white/5"
      aria-label="Course catalogue"
    >
      {/* Ambient glow effects */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-sky-500/[0.04] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/[0.03] rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-5 sm:px-6 max-w-7xl relative z-10">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="mb-16">
          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-6">
            <span className="w-10 h-[1.5px] bg-gradient-to-r from-sky-400 to-sky-400/0" />
            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-sky-400">
              Course Catalogue
            </span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            {/* Left */}
            <div className="max-w-xl">
              <h2 className="text-4xl md:text-[3.25rem] font-[900] tracking-tight text-white leading-[1.08] mb-5">
                Explore Courses
              </h2>
              <p className="text-[15px] text-slate-400 leading-relaxed">
                Browse our professionally structured ACCA programmes and
                supplementary courses designed by industry experts.
              </p>

              {/* Stats row */}
              <div className="flex items-center gap-6 mt-6">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 bg-sky-500/10 flex items-center justify-center">
                    <GraduationCap className="size-4 text-sky-400" />
                  </div>
                  <div>
                    <span className="block text-[13px] font-bold text-white">{totalCourses} Courses</span>
                    <span className="block text-[10px] text-slate-500 uppercase tracking-wider">Available</span>
                  </div>
                </div>
                <div className="w-px h-8 bg-white/[0.06]" />
                <div className="flex items-center gap-2.5">
                  <div className="size-8 bg-emerald-500/10 flex items-center justify-center">
                    <TrendingUp className="size-4 text-emerald-400" />
                  </div>
                  <div>
                    <span className="block text-[13px] font-bold text-white">95%</span>
                    <span className="block text-[10px] text-slate-500 uppercase tracking-wider">Pass Rate</span>
                  </div>
                </div>
                <div className="w-px h-8 bg-white/[0.06] hidden sm:block" />
                <div className="items-center gap-2.5 hidden sm:flex">
                  <div className="size-8 bg-amber-500/10 flex items-center justify-center">
                    <Users className="size-4 text-amber-400" />
                  </div>
                  <div>
                    <span className="block text-[13px] font-bold text-white">12,000+</span>
                    <span className="block text-[10px] text-slate-500 uppercase tracking-wider">Students</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="w-full lg:w-80 flex-shrink-0">
              <label htmlFor="course-search" className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 mb-2 block">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-500 pointer-events-none" />
                <Input
                  id="course-search"
                  placeholder="Course name, code, or keyword…"
                  className="pl-11 h-12 rounded-none bg-[#0f1a2e] border-white/[0.06] text-white text-sm placeholder:text-slate-600 focus-visible:border-sky-500/40 focus-visible:ring-1 focus-visible:ring-sky-500/20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search courses"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Separator ─────────────────────────────────────────── */}
        <Separator className="bg-white/[0.04] mb-10" />

        {/* ── Tabs ──────────────────────────────────────────────── */}
        <div className="mb-12 w-full overflow-x-auto scrollbar-hide pb-4">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full min-w-max flex justify-center"
          >
            <TabsList className="flex w-full max-w-5xl h-14 bg-[#0b1221] border border-white/10 rounded-none p-1.5">
              <TabsTrigger
                value="all"
                className="flex-1 h-full px-8 rounded-none text-[12px] font-bold uppercase tracking-widest text-slate-400 hover:!text-white data-[state=active]:!bg-sky-600 data-[state=active]:!text-white transition-all whitespace-nowrap"
              >
                All Courses
              </TabsTrigger>
              {CATEGORY_CONFIG.map((cfg) => (
                <TabsTrigger
                  key={cfg.key}
                  value={cfg.key}
                  className="flex-1 h-full px-8 rounded-none text-[12px] font-bold uppercase tracking-widest text-slate-400 hover:!text-white data-[state=active]:!bg-sky-600 data-[state=active]:!text-white transition-all whitespace-nowrap"
                >
                  {cfg.tabLabel}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* ── Tab Content ───────────────────────────────────────── */}
        <Tabs value={activeTab} className="w-full">

          {/* Content for all tabs */}
          {["all", ...CATEGORY_CONFIG.map((c) => c.key)].map((tabKey) => (
            <TabsContent key={tabKey} value={tabKey} className="mt-0">
              {isLoading ? (
                <LoadingSkeleton />
              ) : filteredCategories.length === 0 ? (
                <EmptyState
                  onReset={() => {
                    setSearchQuery("");
                    setActiveTab("all");
                  }}
                />
              ) : (
                <div className="space-y-20">
                  {filteredCategories.map((category) => (
                    <CategorySection
                      key={category.key}
                      category={category}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
