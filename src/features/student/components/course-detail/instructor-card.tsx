import { IconStar, IconUsers, IconBook } from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import type { Instructor } from "@/features/student/types/course-detail";

interface InstructorCardProps {
  instructor: Instructor;
}

export function InstructorCard({ instructor }: InstructorCardProps) {
  const initials = instructor.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Instructor</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Avatar size="lg">
            <AvatarImage src={instructor.avatar} alt={instructor.name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">{instructor.name}</span>
            <span className="text-xs text-muted-foreground">
              {instructor.title}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <IconStar className="size-3 fill-amber-400 text-amber-400" />
            {instructor.rating} rating
          </span>
          <span className="inline-flex items-center gap-1">
            <IconUsers className="size-3" />
            {instructor.studentsCount.toLocaleString()} students
          </span>
          <span className="inline-flex items-center gap-1">
            <IconBook className="size-3" />
            {instructor.coursesCount} courses
          </span>
        </div>

        <Separator />

        <p className="text-sm leading-relaxed text-muted-foreground">
          {instructor.bio}
        </p>
      </CardContent>
    </Card>
  );
}
