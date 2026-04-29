"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function CourseCardSkeleton() {
  return (
    <Card className="flex h-full flex-col overflow-hidden bg-card border-muted">
      {/* Thumbnail */}
      <Skeleton className="aspect-video w-full rounded-none" />
      
      {/* Content */}
      <CardHeader className="p-5 pb-3">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6 mt-1" />
      </CardHeader>
      
      <CardContent className="p-5 py-0 flex-1 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Skeleton className="size-4 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center gap-4 mt-auto pt-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-14" />
        </div>
      </CardContent>

      <Separator className="mt-4" />
      
      {/* Footer */}
      <CardFooter className="p-5 flex items-center justify-between">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-9 w-24 rounded-md" />
      </CardFooter>
    </Card>
  );
}
