"use client";

import React from "react";
import { MonitorPlay, Calendar, Users, TrendingUp, Library, ArrowRight } from "lucide-react";

const capabilities = [
    {
        id: 1,
        title: "Live Classes",
        description: "Interactive sessions with real-time doubt resolution and expert-led instruction.",
        icon: <MonitorPlay strokeWidth={1.5} className="w-6 h-6 text-indigo-600" />
    },
    {
        id: 2,
        title: "Course Planner",
        description: "Smart scheduling tools to keep your learning structured and entirely stress-free.",
        icon: <Calendar strokeWidth={1.5} className="w-6 h-6 text-indigo-600" />
    },
    {
        id: 3,
        title: "Virtual Classrooms",
        description: "Immersive digital environments built for focused, high-quality collaborative learning.",
        icon: <Users strokeWidth={1.5} className="w-6 h-6 text-indigo-600" />
    },
    {
        id: 4,
        title: "Performance Tracking",
        description: "Granular analytics to surface strengths, pinpoint gaps, and drive measurable progress.",
        icon: <TrendingUp strokeWidth={1.5} className="w-6 h-6 text-indigo-600" />
    },
    {
        id: 5,
        title: "Resource Library",
        description: "Curated notes, references, and materials available on-demand at any time.",
        icon: <Library strokeWidth={1.5} className="w-6 h-6 text-indigo-600" />
    }
];

export default function FeaturesSection() {
    return (
        <section className="py-24 bg-slate-50 overflow-hidden relative">
            <div className="container mx-auto px-6 relative z-10 max-w-7xl">

                {/* Header Section */}
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <h2 className="text-4xl md:text-5xl font-[900] text-slate-900 tracking-tight mb-6">
                        Platform Capabilities
                    </h2>
                    <p className="text-lg text-slate-500 font-medium leading-relaxed">
                        Everything you need to learn smarter. A complete, enterprise-grade learning platform built for serious educators and high-performing students.
                    </p>
                </div>

                {/* Flex Wrap Layout for 5 Cards - Automatically centers the orphaned items */}
                <div className="flex flex-wrap justify-center gap-8">
                    {capabilities.map((cap) => (
                        <div
                            key={cap.id}
                            className="flex-1 min-w-[300px] max-w-[340px] bg-white rounded-[24px] p-10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.08)] hover:-translate-y-2 transition-all duration-300 border border-slate-100 flex flex-col group cursor-pointer"
                        >
                            {/* Icon Container (matches screenshot soft purple vibe) */}
                            <div className="w-16 h-16 rounded-[16px] bg-indigo-50 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                                {cap.icon}
                            </div>

                            {/* Text Block */}
                            <h3 className="text-xl font-bold text-slate-900 mb-4 transition-colors group-hover:text-indigo-600">
                                {cap.title}
                            </h3>
                            <p className="text-slate-500 leading-relaxed text-[15px] flex-grow mb-8 line-clamp-3">
                                {cap.description}
                            </p>

                            {/* Read More Link (pushed to bottom) */}
                            <div className="flex items-center gap-2 text-slate-900 font-semibold text-[15px] group-hover:text-indigo-600 transition-colors mt-auto">
                                Read More
                                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={2} />
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
}