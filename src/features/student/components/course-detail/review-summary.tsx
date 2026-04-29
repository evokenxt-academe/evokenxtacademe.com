import { IconStar, IconMessageCircle } from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import type { ReviewSummary as ReviewSummaryType } from "@/features/student/types/course-detail";

interface ReviewSummaryProps {
  summary: ReviewSummaryType;
}

export function ReviewSummary({ summary }: ReviewSummaryProps) {
  if (summary.totalReviews === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <IconMessageCircle />
              </EmptyMedia>
              <EmptyTitle>No reviews yet</EmptyTitle>
              <EmptyDescription>
                Be the first to leave a review for this course.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reviews</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Average */}
        <div className="flex items-center gap-3">
          <span className="text-3xl font-semibold">{summary.averageRating}</span>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <IconStar
                  key={i}
                  className={`size-3.5 ${
                    i < Math.round(summary.averageRating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {summary.totalReviews.toLocaleString()} reviews
            </span>
          </div>
        </div>

        {/* Distribution bars */}
        <div className="flex flex-col gap-1.5">
          {summary.distribution.map((row) => (
            <div key={row.stars} className="flex items-center gap-2">
              <span className="w-3 text-xs text-muted-foreground text-right">
                {row.stars}
              </span>
              <IconStar className="size-3 text-muted-foreground/40" />
              <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-amber-400"
                  style={{ width: `${row.percentage}%` }}
                />
              </div>
              <span className="w-7 text-right text-xs text-muted-foreground">
                {row.percentage}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
