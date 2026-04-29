"use client";

import type { Instructor } from "@/features/courses/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { IconBook, IconUsers } from "@tabler/icons-react";

interface InstructorCardProps {
  instructor: Instructor | null | undefined;
  studentCount: number;
  courseCount: number;
}

function getInitials(name: string | null) {
  if (!name) return "IN";
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function InstructorCard({
  instructor,
  studentCount,
  courseCount,
}: InstructorCardProps) {
  if (!instructor) return null;

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle>Instructor</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="size-14">
            <AvatarImage src={instructor.avatar ?? ""} />
            <AvatarFallback>{getInitials(instructor.name)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-base font-semibold text-foreground">
              {instructor.name || "Instructor"}
            </span>
            <span className="text-sm text-muted-foreground">
              {instructor.email || ""}
            </span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          {instructor.bio ||
            "Experienced educator focused on clear explanations and practical outcomes."}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary">Instructor</Badge>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <IconUsers />
            <span>{studentCount} students</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <IconBook />
            <span>{courseCount} courses</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
