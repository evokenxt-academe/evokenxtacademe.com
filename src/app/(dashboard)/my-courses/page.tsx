import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import {
  IconBook2,
  IconClock,
  IconFilter,
  IconPlayerPlay,
  IconSearch,
  IconTargetArrow,
} from "@tabler/icons-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  fetchStudentLearningOverview,
  formatDurationCompact,
} from "@/features/student/lib/lms-data";

export default async function MyCoursesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const overview = await fetchStudentLearningOverview(supabase, user.id);

  const overallProgressPercent =
    overview.totalLectures > 0
      ? Math.round((overview.completedLectures / overview.totalLectures) * 100)
      : 0;

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
            My Courses
          </h1>
          <p className="text-zinc-500 text-sm font-medium">
            Active enrollments with live lecture-level progress from Supabase
          </p>
        </div>

        <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-zinc-900 px-4 py-2">
          <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Overall Progress</span>
          <span className="text-lg font-black text-white">{overallProgressPercent}%</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
          <Input
            placeholder="Search your courses..."
            className="bg-zinc-900 border-white/5 pl-9 h-12 rounded-2xl focus:ring-primary/20"
          />
        </div>
        <Button
          variant="outline"
          className="rounded-2xl bg-zinc-900 border-white/5 h-12 gap-2 text-zinc-400"
        >
          <IconFilter className="size-4" />
          Filter
        </Button>
      </div>

      {overview.enrolledCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {overview.enrolledCourses.map((enrollment) => {
            const course = enrollment.course;
            const continueLectureId = enrollment.progress.continueLectureId;
            const continueHref = continueLectureId
              ? `/learn/${course.slug}/${continueLectureId}`
              : `/learn/${course.slug}`;

            return (
              <Link href={continueHref} key={course.id} className="group">
                <Card className="bg-zinc-900 border-white/5 hover:border-primary/20 transition-all duration-500 rounded-3xl overflow-hidden h-full flex flex-col group/card shadow-xl">
                  <div className="relative aspect-video">
                    {course.thumbnailUrl ? (
                      <img
                        src={course.thumbnailUrl}
                        alt={course.name}
                        className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center">
                        <IconBook2 className="size-10 text-white/5" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <div className="bg-white text-black rounded-full p-4 transform scale-50 group-hover/card:scale-100 transition-all duration-300 shadow-xl">
                        <IconPlayerPlay className="size-6 fill-current" />
                      </div>
                    </div>

                    <div className="absolute left-3 top-3">
                      <Badge
                        variant={enrollment.progress.isCompleted ? "default" : "outline"}
                        className="text-[10px] uppercase tracking-widest font-black"
                      >
                        {enrollment.progress.isCompleted ? "Completed" : "In Progress"}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-5 flex-1 space-y-4">
                    <div className="space-y-2">
                      <Badge
                        variant="outline"
                        className="text-[10px] border-white/10 text-zinc-500 font-bold uppercase rounded-md tracking-widest"
                      >
                        {course.level || "professional"}
                      </Badge>
                      <h4 className="font-bold text-base text-white group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                        {course.name}
                      </h4>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-primary">{enrollment.progress.progressPercent}% Progress</span>
                        <span className="text-zinc-500">
                          {formatDurationCompact(enrollment.progress.totalDurationSec)}
                        </span>
                      </div>
                      <Progress value={enrollment.progress.progressPercent} className="h-1.5 bg-zinc-800" />
                    </div>

                    <div className="space-y-1">
                      <p className="text-[11px] text-zinc-500 font-semibold">
                        {enrollment.progress.completedLectures}/{enrollment.progress.totalLectures} lessons complete
                      </p>
                      <p className="text-[11px] text-zinc-500 font-semibold flex items-center gap-1 truncate">
                        <IconTargetArrow className="size-3" />
                        {enrollment.progress.continueLectureTitle || "Start this course"}
                      </p>
                      <p className="text-[11px] text-zinc-500 font-semibold flex items-center gap-1">
                        <IconClock className="size-3" />
                        {formatDurationCompact(enrollment.progress.watchedSeconds)} watched
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[2.5rem] bg-zinc-900/20 max-w-2xl mx-auto">
          <div className="size-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
            <IconBook2 className="size-10 text-zinc-700" />
          </div>
          <h4 className="text-white font-bold text-2xl mb-2">No courses yet</h4>
          <p className="text-zinc-500 text-sm mb-8 px-8">
            You have not enrolled in any courses yet. Explore the catalog and start your journey.
          </p>
          <Link href="/courses">
            <Button className="rounded-2xl h-12 px-8 font-bold text-black shadow-lg shadow-primary/20">
              Explore Catalog
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
