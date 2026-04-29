"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  GraduationCap,
  Users,
  Clock,
  Globe,
  Sparkles,
} from "lucide-react";

const lmsStats = [
  {
    id: 1,
    value: "92%",
    label: "ACCA Pass Rate",
    icon: GraduationCap,
  },
  {
    id: 2,
    value: "150+",
    label: "Global Mentors",
    icon: Users,
  },
  {
    id: 3,
    value: "500K+",
    label: "Learning Hours",
    icon: Clock,
  },
  {
    id: 4,
    value: "25+",
    label: "Countries Reached",
    icon: Globe,
  },
];

export function LmsClassesStripSection() {
  return (
    <section className="relative overflow-hidden py-16 md:py-24 border-y border-border">
      {/* Parallax Fixed Background Image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-fixed"
        style={{ backgroundImage: "url('/wallpaper.jpeg')" }}
      >
        {/* Adaptive overlay for light and dark modes (no blur) */}
        <div className="absolute inset-0 bg-background/50"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 md:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-16">

          {/* Clean, minimalist header */}
          <div className="w-full lg:w-[40%] text-center lg:text-left shrink-0">
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight leading-snug">
              Interactive Quizzes & <br />
              <span className="text-primary">Mock Exams</span>
            </h2>
            <p className="mt-4 text-base text-muted-foreground font-medium leading-relaxed">
              Test your knowledge instantly. Evoke EduGlobal goes beyond video lectures with custom mock exams and real-time performance analytics designed to guarantee success.
            </p>
          </div>

          {/* Minimalist 2x2 Stats Grid using glassmorphism */}
          <div className="w-full lg:w-[55%] grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            {lmsStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card
                  key={stat.id}
                  className="bg-card/60 backdrop-blur border-border/50 shadow-sm transition-all duration-300 hover:bg-card hover:border-primary/30 hover:-translate-y-1"
                >
                  <CardContent className="flex items-center gap-4 p-5 md:p-6">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="size-5 md:size-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-xl md:text-2xl font-bold tracking-tight text-foreground mb-1">
                        {stat.value}
                      </p>
                      <p className="text-xs md:text-sm font-medium text-muted-foreground">
                        {stat.label}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
