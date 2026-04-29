"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function EmptyState() {
  return (
    <Card className="rounded-xl border border-border/60">
      <CardHeader>
        <CardTitle>No courses yet</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          You haven&apos;t enrolled in any courses.
        </p>
        <Button asChild className="w-fit">
          <Link href="/courses">Browse Courses</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
