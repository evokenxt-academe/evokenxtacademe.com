import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Users } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import type { CourseDetailData } from "@/lib/supabase/queries/course-detail";

interface CourseHeroProps {
  course: CourseDetailData;
  price: { display: string; original: string | null; hasDiscount: boolean };
  onPreviewClick: () => void;
  enrollButton: React.ReactNode;
}

export function CourseHero({
  course,
  price,
  onPreviewClick,
  enrollButton,
}: CourseHeroProps) {
  return (
    <section className="relative w-full bg-[#0a1628] overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/40 via-transparent to-cyan-950/20 pointer-events-none" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/[0.04] rounded-full blur-[120px] pointer-events-none" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
        <div className="max-w-3xl space-y-5">
          {/* Program body badge */}
          {course.program_body && (
            <div className="flex items-center gap-2.5">
              <span className="h-px w-6 bg-cyan-400/60" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
                {course.program_body}
              </span>
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-white leading-[1.15] tracking-tight">
            {course.title}
          </h1>

          {/* Short description */}
          {course.short_description && (
            <p className="text-[15px] sm:text-base leading-relaxed text-slate-300/90 max-w-2xl">
              {course.short_description}
            </p>
          )}

          {/* Instructor + Rating row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 pt-1">
            {/* Instructor */}
            <div className="flex items-center gap-2.5">
              <Avatar className="h-8 w-8 ring-2 ring-cyan-500/30">
                {course.instructor_avatar && (
                  <AvatarImage
                    src={course.instructor_avatar}
                    alt={course.instructor_name}
                  />
                )}
                <AvatarFallback className="bg-cyan-600 text-white text-xs font-bold">
                  {course.instructor_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2) || "IN"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white leading-tight">
                  {course.instructor_name}
                </span>
                <span className="text-[11px] text-slate-400">
                  Lead Instructor
                </span>
              </div>
            </div>

            <Separator
              orientation="vertical"
              className="h-6 bg-white/10 hidden sm:block"
            />

            {/* Star rating */}
            <div className="flex items-center gap-1.5">
              <div className="flex gap-px">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${i < Math.round(course.avg_rating)
                        ? "fill-amber-400 text-amber-400"
                        : "fill-none text-slate-500"
                      }`}
                  />
                ))}
              </div>
              <span className="text-sm font-bold text-amber-400 tabular-nums">
                {course.avg_rating > 0
                  ? course.avg_rating.toFixed(1)
                  : "New"}
              </span>
            </div>

            <Separator
              orientation="vertical"
              className="h-6 bg-white/10 hidden sm:block"
            />

            {/* Students */}
            <div className="flex items-center gap-1.5 text-slate-400">
              <Users className="h-3.5 w-3.5" />
              <span className="text-sm">
                {course.total_students >= 1000
                  ? `${(course.total_students / 1000).toFixed(1)}k`
                  : course.total_students.toLocaleString()}{" "}
                students
              </span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {enrollButton}
            <button
              type="button"
              onClick={onPreviewClick}
              className="h-11 px-6 rounded-md border border-white/20 bg-transparent text-white text-sm font-semibold uppercase tracking-wide hover:bg-white/5 hover:border-white/30 transition-all duration-200 cursor-pointer"
            >
              Preview Course
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
