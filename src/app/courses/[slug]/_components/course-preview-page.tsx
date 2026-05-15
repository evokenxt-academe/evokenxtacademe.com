"use client";

import { useState, useMemo, useCallback } from "react";
import { CourseHero } from "./CourseHero";
import { CourseCurriculum } from "./CourseCurriculum";
import { VideoPreview } from "./VideoPreview";
import { InstructorCard } from "./InstructorCard";
import { CourseFeatures } from "./CourseFeatures";
import { EnrollButton } from "./EnrollButton";
import { Separator } from "@/components/ui/separator";
import type {
  CourseDetailData,
  ChapterWithLectures,
} from "@/lib/supabase/queries/course-detail";

interface CourseDetailClientProps {
  course: CourseDetailData;
  chapters: ChapterWithLectures[];
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
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
  }
  return null;
}

export function CourseDetailClient({
  course,
  chapters,
}: CourseDetailClientProps) {
  // Find first preview lecture video id as default
  const defaultVideoId = useMemo(() => {
    // Try course preview_video_url first
    if (course.preview_video_url) {
      const id = extractYouTubeId(course.preview_video_url);
      if (id) return id;
    }
    // Then try first preview lecture
    for (const ch of chapters) {
      for (const l of ch.lectures) {
        if (l.is_preview && l.yt_video_id) {
          return l.yt_video_id;
        }
      }
    }
    return null;
  }, [course.preview_video_url, chapters]);

  const [activeVideoId, setActiveVideoId] = useState<string | null>(
    defaultVideoId
  );

  const handleLectureClick = useCallback((ytVideoId: string) => {
    setActiveVideoId(ytVideoId);
    // On mobile, scroll to the video player
    if (window.innerWidth < 1024) {
      const el = document.getElementById("video-preview-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, []);

  const handlePreviewClick = useCallback(() => {
    if (defaultVideoId) {
      setActiveVideoId(defaultVideoId);
    }
    // Scroll to video section
    const el = document.getElementById("video-preview-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [defaultVideoId]);

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Hero Banner ─── */}
      <CourseHero
        course={course}
        price={{
          display: formatPriceDisplay(course),
          original: null,
          hasDiscount: false,
        }}
        onPreviewClick={handlePreviewClick}
        enrollButton={<EnrollButton course={course} />}
      />

      {/* ─── Two-Column Content ─── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          {/* Left Column (40%) — Curriculum */}
          <div className="w-full lg:w-[38%] shrink-0">
            <CourseCurriculum
              chapters={chapters}
              onLectureClick={handleLectureClick}
            />
          </div>

          {/* Right Column (60%) — Sticky Video Preview */}
          <div className="flex-1 min-w-0" id="video-preview-section">
            <VideoPreview
              videoId={activeVideoId}
              courseTitle={course.title}
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Separator className="bg-border/30" />
      </div>

      {/* ─── Meet Your Teacher ─── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <InstructorCard
          name={course.instructor_name}
          avatar={course.instructor_avatar}
          subjectName={course.subject_name}
          totalStudents={course.total_students}
        />
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Separator className="bg-border/30" />
      </div>

      {/* ─── Course Features ─── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <CourseFeatures
          chapters={chapters}
          language={course.language}
          totalStudents={course.total_students}
        />
      </section>
    </div>
  );
}

// ── Helper ──
function formatPriceDisplay(course: CourseDetailData): string {
  const amount = course.discounted_price ?? course.base_price;
  if (amount == null || amount <= 0) return "Free";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: course.currency || "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}
