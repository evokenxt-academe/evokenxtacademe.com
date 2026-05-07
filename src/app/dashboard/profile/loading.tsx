import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6">
      <Card>
        <CardHeader className="gap-4 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <Skeleton className="size-16 rounded-full" />
              <div className="flex min-w-0 flex-col gap-3">
                <Skeleton className="h-6 w-44" />
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-5 w-72" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
            <Skeleton className="h-8 w-28 rounded-lg" />
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} size="sm">
            <CardContent className="flex flex-col gap-2 p-4">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="gap-4 p-6">
          <Skeleton className="h-10 w-full rounded-lg" />
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="flex flex-col gap-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
