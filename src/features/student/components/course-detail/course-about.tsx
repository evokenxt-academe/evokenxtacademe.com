import { IconCircleCheck } from "@tabler/icons-react";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";

interface CourseAboutProps {
  about: string;
  learningOutcomes: string[];
}

export function CourseAbout({ about, learningOutcomes }: CourseAboutProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>About this course</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {about}
          </p>
        </CardContent>
      </Card>

      {/* Learning outcomes */}
      <Card>
        <CardHeader>
          <CardTitle>What you&apos;ll learn</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 sm:grid-cols-2" role="list">
            {learningOutcomes.map((outcome) => (
              <li
                key={outcome}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <IconCircleCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{outcome}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
