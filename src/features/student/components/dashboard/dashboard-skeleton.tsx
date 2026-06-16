"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * Premium shimmer skeleton for the student dashboard.
 * Mirrors the real layout so transition from skeleton → content is seamless.
 */
export function DashboardSkeleton() {
  return (
    <div className="mx-3 max-w-7xl space-y-6 px-4   py-6 md:px-6 animate-in fade-in duration-300">
      {/* ── Welcome header ────────────────────────────── */}
      <section className="flex flex-col gap-2">
        <Skeleton className="h-7 w-48 sm:w-64 rounded-lg" />
        <Skeleton className="h-4 w-64 sm:w-96 rounded-md" />
        <div className="mt-3 flex flex-wrap gap-2">
          <Skeleton className="h-9 w-36 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
      </section>

      {/* ── Stats cards ───────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-3 p-3 sm:p-4">
              <Skeleton className="size-9 sm:size-10 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-6 w-12 sm:w-16 rounded-md" />
                <Skeleton className="h-3.5 w-16 sm:w-24 rounded-sm" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Weekly activity chart ─────────────────────── */}
      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-28 sm:w-32 rounded-md" />
          <Skeleton className="h-4 w-40 sm:w-48 rounded-sm" />
        </CardHeader>
        <CardContent>
          {/* Simulated chart bars */}
          <div className="flex h-[180px] sm:h-[220px] items-end gap-2 pt-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <Skeleton
                  className="w-full rounded-t-md"
                  style={{
                    height: `${30 + Math.sin(i * 1.2) * 40 + 30}%`,
                  }}
                />
                <Skeleton className="h-3 w-6 rounded-sm" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Course progress + Quiz performance grid ──── */}
      <section className="grid gap-6 xl:grid-cols-[1fr_400px]">
        {/* Course progress */}
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-3">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-32 rounded-md" />
              <Skeleton className="h-4 w-40 rounded-sm" />
            </div>
            <Skeleton className="h-8 w-20 rounded-md" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col gap-2.5 rounded-xl border p-3 sm:p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-3/4 max-w-[200px] rounded-md" />
                    <Skeleton className="h-3 w-1/2 max-w-[160px] rounded-sm" />
                  </div>
                  <Skeleton className="h-5 w-10 shrink-0 rounded-md" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-24 sm:w-32 rounded-sm" />
                  <Skeleton className="h-7 w-20 rounded-md" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quiz + Live sidebar */}
        <div className="flex flex-col gap-6">
          {/* Quiz performance */}
          <Card>
            <CardHeader className="space-y-1.5">
              <Skeleton className="h-5 w-32 rounded-md" />
              <Skeleton className="h-4 w-44 rounded-sm" />
            </CardHeader>
            <CardContent>
              <div className="mb-4 grid grid-cols-3 gap-2 sm:gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-1 rounded-lg border p-2 sm:p-2.5"
                  >
                    <Skeleton className="size-3.5 rounded-full" />
                    <Skeleton className="h-5 w-7 rounded-md" />
                    <Skeleton className="h-2.5 w-12 rounded-sm" />
                  </div>
                ))}
              </div>
              <Skeleton className="mb-3 h-1.5 w-full rounded-full" />
              <Skeleton className="h-[160px] sm:h-[200px] w-full rounded-lg" />
            </CardContent>
          </Card>

          {/* Live section */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-24 rounded-md" />
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="space-y-2 rounded-xl border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <Skeleton className="h-4 w-32 sm:w-40 rounded-md" />
                    <Skeleton className="h-4 w-14 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-20 rounded-sm" />
                  <Skeleton className="h-3 w-28 rounded-sm" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Activity feed ─────────────────────────────── */}
      <Card>
        <CardHeader className="space-y-1.5">
          <Skeleton className="h-5 w-28 rounded-md" />
          <Skeleton className="h-4 w-40 rounded-sm" />
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg p-2 sm:p-2.5"
            >
              <Skeleton className="size-7 sm:size-8 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32 sm:w-40 rounded-md" />
                <Skeleton className="h-3 w-24 sm:w-28 rounded-sm" />
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Skeleton className="h-4 w-12 rounded-full" />
                <Skeleton className="h-3 w-10 rounded-sm" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
