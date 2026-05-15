"use client";

import { useMemo } from "react";
import {
  Clock,
  BarChart3,
  Award,
  Globe,
  Infinity,
  Video,
  BookOpen,
  Shield,
} from "lucide-react";
import { formatDuration, type ChapterWithLectures } from "@/lib/supabase/queries/course-detail";

interface CourseFeaturesProps {
  chapters: ChapterWithLectures[];
  language: string;
  totalStudents: number;
}

export function CourseFeatures({
  chapters,
  language,
  totalStudents,
}: CourseFeaturesProps) {
  const stats = useMemo(() => {
    let totalDuration = 0;
    let totalLectures = 0;
    for (const ch of chapters) {
      totalLectures += ch.lectures.length;
      for (const l of ch.lectures) {
        totalDuration += l.duration_sec;
      }
    }

    const hours = Math.floor(totalDuration / 3600);
    const durationLabel = hours > 0 ? `${hours} hours` : formatDuration(totalDuration);

    return { totalDuration, totalLectures, durationLabel };
  }, [chapters]);

  const features = [
    {
      icon: Clock,
      value: stats.durationLabel,
      label: "Total course duration",
    },
    {
      icon: BarChart3,
      value: "Advanced",
      label: "Skill level required",
    },
    {
      icon: Award,
      value: "Certificate",
      label: "Verified on completion",
    },
    {
      icon: Globe,
      value: language || "English",
      label: "Teaching languages",
    },
    {
      icon: Infinity,
      value: "Lifetime Access",
      label: "Learn at your own pace",
    },
    {
      icon: Video,
      value: stats.totalLectures > 0 ? stats.totalLectures.toString() : "85",
      label: "HD recorded lectures",
    },
    {
      icon: BookOpen,
      value: "Study Materials",
      label: "Notes, kits & mock exams",
    },
    {
      icon: Shield,
      value: "Mentor Support",
      label: "24/7 doubt resolution",
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Course Features</h2>

      <div
        className="course-features-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "1rem",
        }}
      >
        {features.map((feature, idx) => {
          const Icon = feature.icon;
          return (
            <div
              key={idx}
              className="group flex flex-col items-start gap-3 rounded-xl border border-border/40 bg-card/30 p-4 transition-all duration-300 hover:border-cyan-500/30 hover:bg-card/60"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400/10 transition-transform duration-300 group-hover:scale-110">
                <Icon className="h-[18px] w-[18px] text-cyan-400" />
              </div>

              <p className="text-sm font-bold text-foreground leading-tight">
                {feature.value}
              </p>

              <p className="text-[11px] text-muted-foreground leading-snug -mt-1">
                {feature.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
