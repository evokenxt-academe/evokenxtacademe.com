"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Star } from "lucide-react";
import type { ReviewRow } from "@/lib/supabase/queries/course-detail";

interface ReviewsSectionProps {
  reviews: ReviewRow[];
  avgRating: number;
}

export function ReviewsSection({ reviews, avgRating }: ReviewsSectionProps) {
  const breakdown = useMemo(() => {
    const counts = [0, 0, 0, 0, 0]; // index 0 = 1★, index 4 = 5★
    for (const r of reviews) {
      const idx = Math.min(Math.max(Math.round(r.rating) - 1, 0), 4);
      counts[idx]++;
    }
    return counts;
  }, [reviews]);

  const total = reviews.length;

  if (total === 0) {
    return (
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Student Reviews</h2>
        <p className="text-sm text-muted-foreground">
          No reviews yet. Be the first to review this course!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Student Reviews</h2>

      {/* Rating overview */}
      <div className="flex flex-col sm:flex-row gap-8 items-start">
        {/* Big number */}
        <div className="flex flex-col items-center gap-1.5 min-w-[90px]">
          <span className="text-5xl font-bold tabular-nums">
            {avgRating > 0 ? avgRating.toFixed(1) : "0.0"}
          </span>
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < Math.round(avgRating)
                    ? "fill-amber-500 text-amber-500"
                    : "fill-none text-muted-foreground/30"
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {total} rating{total !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Bar breakdown */}
        <div className="flex-1 space-y-2 w-full">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = breakdown[stars - 1];
            const pct = total > 0 ? (count / total) * 100 : 0;
            return (
              <div
                key={stars}
                className="flex items-center gap-2.5 text-sm"
              >
                <span className="w-6 text-right text-muted-foreground tabular-nums text-xs">
                  {stars}★
                </span>
                <Progress value={pct} className="h-2 flex-1" />
                <span className="w-6 text-muted-foreground tabular-nums text-xs text-right">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Individual reviews */}
      <div className="space-y-4">
        {reviews.map((review, i) => (
          <ReviewCard key={i} review={review} />
        ))}
      </div>
    </div>
  );
}

// ── Review Card ──────────────────────────────────────────

function ReviewCard({ review }: { review: ReviewRow }) {
  return (
    <div className="flex gap-3 border rounded-lg p-4">
      <Avatar className="h-9 w-9 shrink-0">
        {review.reviewer_avatar && (
          <AvatarImage
            src={review.reviewer_avatar}
            alt={review.reviewer_name}
          />
        )}
        <AvatarFallback className="text-xs font-semibold bg-muted">
          {review.reviewer_name?.charAt(0).toUpperCase() || "S"}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">{review.reviewer_name}</span>
          <time className="text-[11px] text-muted-foreground whitespace-nowrap">
            {new Date(review.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </time>
        </div>

        <div className="flex gap-0.5">
          {[...Array(5)].map((_, j) => (
            <Star
              key={j}
              className={`h-3 w-3 ${
                j < review.rating
                  ? "fill-amber-500 text-amber-500"
                  : "fill-none text-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        {review.comment && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {review.comment}
          </p>
        )}
      </div>
    </div>
  );
}
