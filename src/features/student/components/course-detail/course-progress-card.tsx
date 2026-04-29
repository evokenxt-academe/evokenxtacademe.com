"use client";

import {
  IconBook,
  IconClipboardCheck,
  IconFileText,
  IconCertificate,
  IconLayoutGrid,
} from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { CourseDetail } from "@/features/student/types/course-detail";

interface CourseProgressCardProps {
  course: CourseDetail;
}

const certificateLabel: Record<CourseDetail["certificateStatus"], string> = {
  not_started: "Not started",
  in_progress: "In progress",
  earned: "Earned",
};

export function CourseProgressCard({ course }: CourseProgressCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress Overview</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Progress bar */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Completion</span>
            <span className="font-medium">{course.progress}%</span>
          </div>
          <Progress value={course.progress} className="h-2" />
        </div>

        {/* Last lesson */}
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Last lesson</span>
          <span className="text-sm font-medium">{course.lastLesson}</span>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatItem
            icon={<IconLayoutGrid className="size-3.5" />}
            label="Modules"
            value={course.modulesCount}
          />
          <StatItem
            icon={<IconBook className="size-3.5" />}
            label="Lessons"
            value={course.lessonsCount}
          />
          <StatItem
            icon={<IconClipboardCheck className="size-3.5" />}
            label="Assignments"
            value={course.assignmentsCount}
          />
          <StatItem
            icon={<IconFileText className="size-3.5" />}
            label="Resources"
            value={course.resourcesCount}
          />
        </div>

        {/* Certificate */}
        <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
          <IconCertificate className="size-4 text-muted-foreground" />
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Certificate</span>
            <span className="text-sm font-medium">
              {certificateLabel[course.certificateStatus]}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2">
      <span className="text-muted-foreground">{icon}</span>
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm font-medium">{value}</span>
      </div>
    </div>
  );
}
