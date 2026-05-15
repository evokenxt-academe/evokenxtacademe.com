import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero skeleton */}
      <div className="w-full bg-[#0a1628] py-10 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-5">
          {/* Badge */}
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-px w-6 bg-white/10" />
            <Skeleton className="h-4 w-20 bg-white/10" />
          </div>
          {/* Title */}
          <div className="space-y-2">
            <Skeleton className="h-10 w-full max-w-lg bg-white/10" />
            <Skeleton className="h-10 w-3/5 bg-white/10" />
          </div>
          {/* Description */}
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-full max-w-2xl bg-white/10" />
            <Skeleton className="h-5 w-4/5 bg-white/10" />
          </div>
          {/* Meta row */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-8 rounded-full bg-white/10" />
            <Skeleton className="h-4 w-28 bg-white/10" />
            <Skeleton className="h-4 w-20 bg-white/10" />
            <Skeleton className="h-4 w-24 bg-white/10" />
          </div>
          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-11 w-44 rounded-md bg-white/10" />
            <Skeleton className="h-11 w-40 rounded-md bg-white/10" />
          </div>
        </div>
      </div>

      {/* Two-column content skeleton */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          {/* Left: Curriculum */}
          <div className="w-full lg:w-[38%] shrink-0 space-y-4">
            <Skeleton className="h-7 w-44" />
            <div className="rounded-xl border border-border/50 p-1 space-y-1">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          </div>
          {/* Right: Video */}
          <div className="flex-1 min-w-0">
            <Skeleton className="w-full aspect-video rounded-xl" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Separator className="bg-border/30" />
      </div>

      {/* Instructor skeleton */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="rounded-xl border border-border/50 p-6 sm:p-8 space-y-6">
          <div className="flex gap-6">
            <Skeleton className="h-20 w-20 rounded-full shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2.5">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-64" />
              <div className="space-y-2 pt-1">
                <Skeleton className="h-4 w-full max-w-md" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>
          <Separator className="bg-border/30" />
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="text-center space-y-1">
                <Skeleton className="h-8 w-16 mx-auto" />
                <Skeleton className="h-3 w-24 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Separator className="bg-border/30" />
      </div>

      {/* Course features skeleton */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/40 p-4 sm:p-5 space-y-3"
            >
              <Skeleton className="h-9 w-9 rounded-lg" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-28" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
