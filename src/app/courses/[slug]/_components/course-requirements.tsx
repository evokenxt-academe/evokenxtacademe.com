"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircleDot } from "lucide-react";

interface CourseRequirementsProps {
  requirements: string[];
}

export function CourseRequirements({ requirements }: CourseRequirementsProps) {
  if (!requirements || requirements.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Requirements</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2.5">
          {requirements.map((req, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <CircleDot className="h-3.5 w-3.5 text-muted-foreground/60 mt-1 shrink-0" />
              <span className="text-foreground/80 leading-relaxed">{req}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
