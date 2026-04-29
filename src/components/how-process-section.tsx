"use client";

import React from "react";
import { ArrowRight, UserCheck, Users, MonitorPlay, TrendingUp } from "lucide-react";

const stats = [
  {
    id: 1,
    value: "12+",
    label: "Expert Faculty",
    icon: UserCheck,
  },
  {
    id: 2,
    value: "6K+",
    label: "Enrolled Students",
    icon: Users,
  },
  {
    id: 3,
    value: "120+",
    label: "Online Courses",
    icon: MonitorPlay,
  },
  {
    id: 4,
    value: "98%",
    label: "Pass Rate",
    icon: TrendingUp,
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

export function HowProcessSection() {
  return (
    <section className="py-24 bg-background overflow-hidden">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">

          {/* ─── Left Column: Text ─── */}
          <div>
            {/* Label */}
            <div className="flex items-center gap-3 mb-4">
              <span className="w-6 h-[2px] bg-primary inline-block"></span>
              <span className="text-xs font-bold uppercase tracking-widest text-primary">How It Works</span>
            </div>

            {/* Headline */}
            <h2 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight leading-tight mb-4">
              Welcome to <br />
              <span className="text-primary">Evoke EduGlobal</span>
            </h2>

            {/* Blockquote */}
            <blockquote className="border-l-4 border-amber-400 pl-4 mb-10">
              <p className="text-muted-foreground text-base leading-relaxed">
                Our proven methodology is designed to guide you from foundational learning all the way seamlessly to your final examination success — taught in Urdu & Hindi by ACCA qualified professionals.
              </p>
            </blockquote>

            {/* Feature cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
              {features.map((f) => (
                <div key={f.id} className="border-t-2 border-primary pt-4">
                  <h4 className="text-base font-bold text-foreground mb-2">{f.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{f.desc}</p>
                  <a href="#" className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-background bg-foreground px-4 py-2.5 hover:bg-primary hover:text-primary-foreground transition-colors">
                    <ArrowRight className="w-3.5 h-3.5" /> Learn More
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* ─── Right Column: 2×2 Stats Grid ─── */}
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.id}
                  className="group flex flex-col items-start justify-between bg-card border border-border/50 p-6 md:p-8 rounded-none transition-all duration-300 hover:border-primary/50 hover:shadow-lg"
                >
                  <div className="mb-6 flex size-12 items-center justify-center rounded-none bg-primary/10 border border-primary/20 transition-transform duration-300 group-hover:-translate-y-1">
                    <Icon className="size-5 text-primary" strokeWidth={2.5} />
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
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
