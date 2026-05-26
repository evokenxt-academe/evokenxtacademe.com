"use client";

import React from "react";
import {
  ArrowRight,
  UserCheck,
  Users,
  MonitorPlay,
  TrendingUp,
} from "lucide-react";

import { GlowCardGrid } from "@/components/glow-card-grid";
import { cn } from "@/lib/utils";
import { BlurFade } from "@/components/ui/blur-fade";

const stats = [
  {
    id: 1,
    value: "10+",
    label: "Expert Faculty",
    icon: UserCheck,
    color: "text-blue-500",
    glowColor: "text-blue-500/50",
    iconBg: "bg-blue-500/10",
    iconBorder: "border-blue-500/20",
  },
  {
    id: 2,
    value: "500+",
    label: "Enrolled Students",
    icon: Users,
    color: "text-emerald-500",
    glowColor: "text-emerald-500/50",
    iconBg: "bg-emerald-500/10",
    iconBorder: "border-emerald-500/20",
  },
  {
    id: 3,
    value: "100+",
    label: "Online Courses",
    icon: MonitorPlay,
    color: "text-violet-500",
    glowColor: "text-violet-500/50",
    iconBg: "bg-violet-500/10",
    iconBorder: "border-violet-500/20",
  },
  {
    id: 4,
    value: "98%",
    label: "Pass Rate",
    icon: TrendingUp,
    color: "text-amber-500",
    glowColor: "text-amber-500/50",
    iconBg: "bg-amber-500/10",
    iconBorder: "border-amber-500/20",
  },
];

const features = [
  {
    id: 1,
    title: "Live & Recorded Lectures",
    desc: "Attend expert-led live sessions or catch up anytime with our full HD recorded libraries — learning fits around your schedule.",
  },
  {
    id: 2,
    title: "Exam-Ready Mock Tests",
    desc: "Our comprehensive mock exams mirror the real ACCA paper format and difficulty, ensuring you walk into your exam with complete confidence.",
  },
];

function StatGlowCard({ stat }: { stat: (typeof stats)[0] }) {
  const Icon = stat.icon;
  return (
    <div
      data-slot="glow-card"
      className={cn(
        "@container-[size] relative h-full min-h-[14rem] w-full overflow-hidden rounded-(--card-radius) ring-1 ring-border transition-[translate,scale] select-none active:scale-[0.98]",
        "bg-card group",
      )}
    >
      <div className="flex size-full overflow-hidden rounded-(--card-radius) [clip-path:inset(0_round_var(--card-radius))]">
        <div
          className={cn(
            "pointer-events-none absolute inset-0 flex items-center justify-center",
            "translate-x-[calc(var(--pointer-x,-10)*50cqi)] translate-y-[calc(var(--pointer-y,-10)*50cqh)] translate-z-0 scale-(--card-icon-scale)",
            "blur-(--card-icon-blur) brightness-(--card-icon-brightness) saturate-(--card-icon-saturate)",
            "opacity-(--card-icon-opacity) will-change-[transform,filter]",
          )}
        >
          {/* Background glow icon */}
          <Icon className={cn("size-20", stat.glowColor)} />
        </div>

        <div className="z-1 flex flex-1 flex-col items-start justify-between p-6">
          <div
            className={cn(
              "mb-6 flex size-12 items-center justify-center border transition-transform duration-300 group-hover:-translate-y-1",
              stat.iconBg,
              stat.iconBorder,
            )}
          >
            <Icon className={cn("size-5", stat.color)} strokeWidth={2.5} />
          </div>

          <div>
            <p className="text-3xl md:text-4xl font-extrabold text-foreground leading-none mb-2">
              {stat.value}
            </p>
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {stat.label}
            </p>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "pointer-events-none absolute inset-0 translate-z-0 rounded-(--card-radius)",
          "border-(length:--card-border-width) border-solid border-transparent",
          "backdrop-blur-(--card-border-blur) backdrop-brightness-(--card-border-brightness) backdrop-contrast-(--card-border-contrast) backdrop-saturate-(--card-border-saturate)",
          "[clip-path:inset(0_round_var(--card-radius))]",
        )}
        style={
          {
            maskImage:
              "linear-gradient(#fff 0 100%), linear-gradient(#fff 0 100%)",
            maskOrigin: "border-box, padding-box",
            maskClip: "border-box, padding-box",
            maskComposite: "exclude",
            WebkitMaskComposite: "xor",
          } as React.CSSProperties
        }
      />
    </div>
  );
}

export function HowProcessSection() {
  return (
    <section className="py-24 bg-background overflow-hidden">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          {/* ─── Left Column: Text ─── */}
          <div>
            <BlurFade delay={0.1} inView>
              {/* Label */}
              <div className="flex items-center gap-3 mb-4">
                <span className="w-6 h-[2px] bg-primary inline-block"></span>
                <span className="text-xs font-bold uppercase tracking-widest text-primary">
                  How It Works
                </span>
              </div>

              {/* Headline */}
              <h2 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight leading-tight mb-4">
                Welcome to <br />
                <span className="text-primary">Evokenxt</span>
              </h2>

              {/* Blockquote */}
              <blockquote className="border-l-4 border-amber-400 pl-4 mb-10">
                <p className="text-muted-foreground text-base leading-relaxed">
                  Our proven methodology is designed to guide you from
                  foundational learning all the way seamlessly to your final
                  examination success — taught in Urdu & Hindi by ACCA qualified
                  professionals.
                </p>
              </blockquote>
            </BlurFade>

            {/* Feature cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
              {features.map((f, idx) => (
                <BlurFade key={f.id} delay={0.2 + idx * 0.1} inView>
                  <div className="border-t-2 border-primary pt-4 h-full flex flex-col justify-between">
                    <div>
                      <h4 className="text-base font-bold text-foreground mb-2">
                        {f.title}
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                        {f.desc}
                      </p>
                    </div>
                    <div>
                      <a
                        href="#"
                        className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-background bg-foreground px-4 py-2.5 hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        <ArrowRight className="w-3.5 h-3.5" /> Learn More
                      </a>
                    </div>
                  </div>
                </BlurFade>
              ))}
            </div>
          </div>

          {/* ─── Right Column: 2×2 Stats Grid ─── */}
          <div className="w-full">
            <GlowCardGrid className="grid-cols-2 sm:grid-cols-2 md:grid-cols-2 gap-4">
              {stats.map((stat, idx) => (
                <BlurFade key={stat.id} delay={0.3 + idx * 0.08} inView>
                  <StatGlowCard stat={stat} />
                </BlurFade>
              ))}
            </GlowCardGrid>
          </div>
        </div>
      </div>
    </section>
  );
}
