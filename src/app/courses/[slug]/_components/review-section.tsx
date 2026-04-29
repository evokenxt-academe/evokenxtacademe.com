"use client";

import type { Review } from "@/features/courses/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { IconStarFilled } from "@tabler/icons-react";

interface ReviewSectionProps {
  reviews: Review[];
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ReviewSection({ reviews }: ReviewSectionProps) {
  if (reviews.length === 0) {
    return (
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>Reviews</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          No reviews yet. Be the first to review this course.
        </CardContent>
      </Card>
    );
  }

  const ratingCount = reviews.length;
  const ratingAverage =
    reviews.reduce((sum, review) => sum + review.rating, 0) / ratingCount;

  const breakdown = [5, 4, 3, 2, 1].map((score) => {
    const count = reviews.filter((review) => review.rating === score).length;
    return {
      score,
      count,
      percent: ratingCount ? (count / ratingCount) * 100 : 0,
    };
  });

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle>Reviews</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-semibold text-foreground">
              {ratingAverage.toFixed(1)}
            </span>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <IconStarFilled />
              <span>{ratingCount} ratings</span>
            </div>
          </div>
          <Badge variant="secondary">Verified reviews</Badge>
        </div>

        <div className="flex flex-col gap-3">
          {breakdown.map((item) => (
            <div key={item.score} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {item.score} star
              </span>
              <Progress value={item.percent} />
              <span className="text-xs text-muted-foreground">
                {item.count}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          {reviews.slice(0, 6).map((review) => (
            <div key={review.id} className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <IconStarFilled />
                  <span>{review.rating} / 5</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDate(review.created_at)}
                </span>
              </div>
              <p className="text-sm text-foreground">
                {review.comment || "No written review provided."}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
