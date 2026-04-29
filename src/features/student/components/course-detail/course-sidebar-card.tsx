"use client";

import Link from "next/link";
import {
  IconPlayerPlay,
  IconClock,
  IconWorld,
  IconBarrierBlock,
  IconCheck,
} from "@tabler/icons-react";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import type { CourseDetail } from "@/features/student/types/course-detail";

interface CourseSidebarCardProps {
  course: CourseDetail;
}

export function CourseSidebarCard({ course }: CourseSidebarCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Course Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Your progress</span>
            <span className="font-medium">{course.progress}%</span>
          </div>
          <Progress value={course.progress} className="h-2" />
        </div>

        <Button className="w-full" size="lg" asChild>
          <Link href={`/dashboard/courses/${course.id}/learn`}>
            <IconPlayerPlay data-icon="inline-start" />
            Continue Learning
          </Link>
        </Button>

        <Separator />

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Course includes</span>
          <ul className="flex flex-col gap-1.5" role="list">
            {course.courseIncludes.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                <IconCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <Separator />

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <IconClock className="size-3.5" /> Access
            </span>
            <span className="font-medium">{course.accessInfo}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <IconBarrierBlock className="size-3.5" /> Level
            </span>
            <span className="font-medium">{course.level}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <IconWorld className="size-3.5" /> Language
            </span>
            <span className="font-medium">{course.language}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
