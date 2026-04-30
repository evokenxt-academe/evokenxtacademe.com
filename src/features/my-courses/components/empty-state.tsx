"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function EmptyState() {
  return (
    <Card className="mx-auto w-full max-w-lg border-dashed">
      <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted">
          <BookOpen className="size-6 text-muted-foreground" />
        </div>
        <div className="flex flex-col gap-1">
          <h4 className="text-lg font-semibold">No courses yet</h4>
          <p className="text-sm text-muted-foreground">
            You are not enrolled in any courses.
          </p>
        </div>
        <Button asChild>
          <Link href="/courses">Browse Courses</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
