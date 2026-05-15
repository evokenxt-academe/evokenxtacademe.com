"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function CoursePreviewSkeleton() {
  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10">
        <div className="flex flex-col lg:flex-row lg:gap-8 xl:gap-10">

          {/* Left column */}
          <div className="flex-1 min-w-0 space-y-5">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-4 w-2" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-2" />
              <Skeleton className="h-4 w-36" />
            </div>

            {/* Badges */}
            <div className="flex gap-2">
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-5 w-28 rounded-full" />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Skeleton className="h-8 w-full max-w-md" />
              <Skeleton className="h-8 w-3/5" />
            </div>

            {/* Short description */}
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-4/5" />
            </div>

            {/* Rating row */}
            <div className="flex items-center gap-5">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>

            {/* Instructor */}
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-7 w-7 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>

            {/* Mobile enrollment card */}
            <div className="lg:hidden pt-3">
              <EnrollmentCardSkeleton />
            </div>

            {/* Content sections */}
            <div className="pt-5 space-y-8">
              {/* What You'll Learn */}
              <Card className="border-dashed">
                <CardHeader className="pb-4">
                  <Skeleton className="h-6 w-44" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <Skeleton className="h-[18px] w-[18px] rounded-full shrink-0" />
                        <Skeleton className="h-4 flex-1" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Curriculum */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="border rounded-lg p-3.5">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-52" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Separator />

              {/* Reviews */}
              <div className="space-y-6">
                <Skeleton className="h-6 w-36" />
                <div className="flex gap-8">
                  <div className="flex flex-col items-center gap-1.5 min-w-[90px]">
                    <Skeleton className="h-14 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="flex-1 space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <Skeleton className="h-3 w-6" />
                        <Skeleton className="h-2 flex-1" />
                        <Skeleton className="h-3 w-6" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Instructor */}
              <div className="space-y-4">
                <Skeleton className="h-6 w-24" />
                <div className="flex items-start gap-5">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="space-y-2 pt-0.5">
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-52" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <aside className="hidden lg:block w-[380px] xl:w-[400px] shrink-0">
            <EnrollmentCardSkeleton />
          </aside>
        </div>
      </div>
    </div>
  );
}

function EnrollmentCardSkeleton() {
  return (
    <Card className="overflow-hidden border shadow-sm">
      <Skeleton className="w-full aspect-video" />
      <CardContent className="p-6 space-y-5">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-11 w-full" />
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-44" />
          </div>
        </div>
        <Separator />
        <div className="flex justify-center gap-3">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}
