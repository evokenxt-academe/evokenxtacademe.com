"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight, Loader2 } from "lucide-react";
import type { CourseDetailData } from "@/lib/supabase/queries/course-detail";

interface EnrollButtonProps {
  course: CourseDetailData;
}

function formatPrice(
  basePrice: number | null,
  discountedPrice: number | null,
  currency: string
): string {
  const amount = discountedPrice ?? basePrice;
  if (amount == null || amount <= 0) return "Free";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function EnrollButton({ course }: EnrollButtonProps) {
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function checkEnrollment() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user || cancelled) {
          setIsLoading(false);
          return;
        }

        const { data } = await supabase
          .from("enrollments")
          .select("id, status")
          .eq("course_id", course.id)
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle();

        if (!cancelled) {
          setIsEnrolled(data !== null);
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) setIsLoading(false);
      }
    }

    checkEnrollment();
    return () => {
      cancelled = true;
    };
  }, [course.id]);

  const priceLabel = formatPrice(
    course.base_price,
    course.discounted_price,
    course.currency
  );

  if (isLoading) {
    return (
      <Button
        size="lg"
        className="h-11 px-8 font-bold uppercase tracking-wide text-sm bg-primary hover:bg-primary/90"
        disabled
      >
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Checking...
      </Button>
    );
  }

  if (isEnrolled) {
    return (
      <Button
        size="lg"
        className="h-11 px-8 font-bold uppercase tracking-wide text-sm bg-emerald-600 hover:bg-emerald-700"
        asChild
      >
        <a href={`/dashboard`}>
          Continue Learning
          <ArrowRight className="h-4 w-4 ml-1.5" />
        </a>
      </Button>
    );
  }

  return (
    <Button
      size="lg"
      className="h-11 px-8 font-bold uppercase tracking-wide text-sm bg-primary hover:bg-primary/90"
    >
      Enroll Now — {priceLabel}
    </Button>
  );
}
