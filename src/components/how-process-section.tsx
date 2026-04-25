"use client";

import React from "react";
import { ArrowRight } from "lucide-react";

const stats = [
  {
    id: 1,
    value: "12+",
    label: "Expert Faculty",
    bg: "bg-indigo-600",
    icon: (
      <svg className="w-10 h-10 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.966 8.966 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
  {
    id: 2,
    value: "6K+",
    label: "Enrolled Students",
    bg: "bg-pink-500",
    icon: (
      <svg className="w-10 h-10 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    id: 3,
    value: "120+",
    label: "Online Courses",
    bg: "bg-amber-400",
    icon: (
      <svg className="w-10 h-10 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
      </svg>
    ),
  },
  {
    id: 4,
    value: "98%",
    label: "Pass Rate",
    bg: "bg-emerald-500",
    icon: (
      <svg className="w-10 h-10 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
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
    <section className="py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">

          {/* ─── Left Column: Text ─── */}
          <div>
            {/* Label */}
            <div className="flex items-center gap-3 mb-4">
              <span className="w-6 h-[2px] bg-indigo-600 inline-block"></span>
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">How It Works</span>
            </div>

            {/* Headline */}
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
              Welcome to <br />
              <span className="text-indigo-600">Evoke EduGlobal</span>
            </h2>

            {/* Blockquote */}
            <blockquote className="border-l-4 border-amber-400 pl-4 mb-10">
              <p className="text-slate-600 text-base leading-relaxed">
                Our proven methodology is designed to guide you from foundational learning all the way seamlessly to your final examination success — taught in Urdu & Hindi by ACCA qualified professionals.
              </p>
            </blockquote>

            {/* Feature cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
              {features.map((f) => (
                <div key={f.id} className="border-t-2 border-indigo-600 pt-4">
                  <h4 className="text-base font-bold text-slate-900 mb-2">{f.title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed mb-4">{f.desc}</p>
                  <a href="#" className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-white bg-slate-900 px-4 py-2.5 hover:bg-indigo-600 transition-colors">
                    <ArrowRight className="w-3.5 h-3.5" /> Learn More
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* ─── Right Column: 2×2 Stats Grid ─── */}
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.id}
                className={`${stat.bg} p-8 flex flex-col items-start justify-between aspect-square`}
              >
                {stat.icon}
                <div className="mt-auto">
                  <p className="text-4xl font-black text-white leading-none mb-1">{stat.value}</p>
                  <p className="text-xs font-bold uppercase tracking-widest text-white/80">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
