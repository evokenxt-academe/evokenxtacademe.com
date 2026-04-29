import Link from "next/link";
import { IconStar, IconUsers, IconClock } from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RelatedCourse } from "@/features/student/types/course-detail";

interface RelatedCoursesProps {
  courses: RelatedCourse[];
}

export function RelatedCourses({ courses }: RelatedCoursesProps) {
  if (courses.length === 0) return null;

  return (
    <section aria-label="Related courses" className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Related Courses</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Link
            key={course.id}
            href={`/dashboard/courses/${course.id}`}
            className="group block"
          >
            <Card className="transition-colors group-hover:bg-muted/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{course.level}</Badge>
                </div>
                <CardTitle className="line-clamp-2 text-sm">
                  {course.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-muted-foreground">
                    {course.instructor}
                  </span>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <IconStar className="size-3 fill-amber-400 text-amber-400" />
                      {course.rating}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <IconUsers className="size-3" />
                      {course.studentsCount.toLocaleString()}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <IconClock className="size-3" />
                      {course.duration}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
