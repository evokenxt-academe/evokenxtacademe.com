"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { YtcnPlayer } from "@/components/ytcn/components/ytcn/ytcn-player";
import {
  CheckCircle,
  Share2,
  Heart,
  BookOpen,
  Award,
  FileText,
} from "lucide-react";
import type {
  CourseDetailData,
  EnrollmentRow,
} from "@/lib/supabase/queries/course-detail";

interface EnrollmentCardProps {
  course: CourseDetailData;
  enrollment: EnrollmentRow | null;
  isLoadingEnrollment: boolean;
}

function extractYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtube.com")) {
      return parsed.searchParams.get("v");
    }
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.slice(1);
    }
  } catch {
    // If it's already just a video ID (11 chars)
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
  }
  return null;
}

function formatPrice(
  basePrice: number | null,
  discountedPrice: number | null,
  currency: string
): { display: string; original: string | null; hasDiscount: boolean } {
  const fmt = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(amount);

  if (
    discountedPrice != null &&
    basePrice != null &&
    discountedPrice < basePrice
  ) {
    return {
      display: fmt(discountedPrice),
      original: fmt(basePrice),
      hasDiscount: true,
    };
  }

  if (basePrice != null && basePrice > 0) {
    return { display: fmt(basePrice), original: null, hasDiscount: false };
  }

  return { display: "Free", original: null, hasDiscount: false };
}

export function EnrollmentCard({
  course,
  enrollment,
  isLoadingEnrollment,
}: EnrollmentCardProps) {
  const [copied, setCopied] = useState(false);

  const isEnrolled = enrollment !== null;

  const ytVideoId = course.preview_video_url
    ? extractYouTubeId(course.preview_video_url)
    : null;

  const price = formatPrice(
    course.base_price,
    course.discounted_price,
    course.currency
  );

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: course.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // User cancelled share
    }
  };

  return (
    <Card className="overflow-hidden border shadow-sm">
      {/* Thumbnail / Video preview */}
      <div className="relative w-full aspect-video bg-muted overflow-hidden">
        {ytVideoId ? (
          <YtcnPlayer
            videoId={ytVideoId}
            autoplay={false}
            className="w-full h-full"
          />
        ) : course.thumbnail_url ? (
          <Image
            src={course.thumbnail_url}
            alt={course.title}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 450px"
            priority
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/40" />
          </div>
        )}
      </div>

      <CardContent className="p-6 space-y-5">
        {/* Price */}
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold tracking-tight">
            {price.display}
          </span>
          {price.original && (
            <span className="text-base text-muted-foreground line-through">
              {price.original}
            </span>
          )}
        </div>

        {/* Pricing label */}
        {course.pricing_label && (
          <Badge variant="secondary" className="text-xs">
            {course.pricing_label}
          </Badge>
        )}

        {/* Enroll Button */}
        <Button
          className="w-full font-semibold text-sm h-11"
          size="lg"
          disabled={isEnrolled || isLoadingEnrollment}
        >
          {isLoadingEnrollment
            ? "Checking..."
            : isEnrolled
            ? "Enrolled ✓"
            : "Enroll Now"}
        </Button>

        {/* Feature bullets */}
        <ul className="space-y-3 pt-1">
          {[
            { icon: CheckCircle, text: "Lifetime access" },
            { icon: Award, text: "Certificate on completion" },
            { icon: FileText, text: "All study materials included" },
          ].map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-2.5 text-sm">
              <Icon className="h-4 w-4 text-green-600 shrink-0" />
              <span className="text-muted-foreground">{text}</span>
            </li>
          ))}
        </ul>

        <Separator />

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleShare} className="gap-1.5">
                  <Share2 className="h-3.5 w-3.5" />
                  <span className="text-xs">{copied ? "Copied!" : "Share"}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {copied ? "Link copied!" : "Share this course"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Heart className="h-3.5 w-3.5" />
                  <span className="text-xs">Wishlist</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add to wishlist</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}
