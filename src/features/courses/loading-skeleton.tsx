"use client";

/**
 * 🎓 Loading Skeleton Components
 * Displayed while fetching course data from Supabase
 * Matches the structure of the actual course detail page
 */

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";

export function CourseDetailSkeleton() {
  return (
    <main className="flex flex-col gap-8 p-4 pb-12 lg:p-6">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Hero skeleton */}
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-5/6" />
        <div className="flex gap-4 pt-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Progress card (mobile) */}
      <div className="lg:hidden">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-4 w-32" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* Main content */}
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          {/* About section */}
          <Card>
            <CardHeader>
              <CardTitle>
                <Skeleton className="h-6 w-20" />
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>

          {/* Curriculum section */}
          <Card>
            <CardHeader>
              <CardTitle>
                <Skeleton className="h-6 w-24" />
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex flex-col gap-2 border-b pb-3 last:border-b-0"
                >
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-6" />
                    <Skeleton className="h-5 w-40" />
                  </div>
                  <div className="ml-8 flex flex-col gap-2">
                    {[1, 2].map((j) => (
                      <Skeleton key={j} className="h-4 w-48" />
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Instructor section */}
          <Card>
            <CardHeader>
              <CardTitle>
                <Skeleton className="h-6 w-28" />
              </CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="flex-1 flex flex-col gap-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-36" />
              </div>
            </CardContent>
          </Card>

          {/* Reviews section */}
          <Card>
            <CardHeader>
              <CardTitle>
                <Skeleton className="h-6 w-20" />
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-16" />
                <Skeleton className="h-4 w-32" />
              </div>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-2 flex-1" />
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar (hidden on mobile) */}
        <aside className="hidden w-[320px] shrink-0 lg:block">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>
                <Skeleton className="h-6 w-20" />
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Separator className="my-2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        </aside>
      </div>

      <Separator />

      {/* Related courses */}
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <div className="p-4">
                <Skeleton className="h-40 w-full rounded-md" />
                <div className="mt-4 flex flex-col gap-2">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}

export function CourseDetailLoadingSkeleton() {
  return <CourseDetailSkeleton />;
}
