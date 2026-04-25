"use client";

import React from "react";
import { motion } from "motion/react";
import { TeacherCoursesSection } from "@/components/teacher-courses-section";
import { FeaturedCourseCarousel } from "@/components/featured-course-carousel";
import { StatsSection } from "@/components/stats-section";

export default function QualificationsPage() {
  return (
    <main className="relative min-h-screen bg-slate-50 selection:bg-indigo-100 overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        
        body {
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
      `}</style>

      {/* Qualifications Header Banner */}
      <section className="relative pt-28 pb-12 min-h-[320px] flex items-center justify-center overflow-hidden bg-[#0B1120]">
        {/* Background Image with Clearer Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop" 
            alt="Students collaborating"
            className="w-full h-full object-cover opacity-60 scale-105"
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-transparent to-black/20" />
        </div>

        <div className="relative z-10 container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
              Mentorship & Excellence
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-[1.1] tracking-tight">
              Professional <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-teal-400">Qualifications</span>
            </h1>

            <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
              Elite ACCA programs and professional pathways designed to accelerate your global career with our world-class faculty.
            </p>
          </motion.div>
        </div>
      </section>
      {/* The Core Component we Created */}
      <TeacherCoursesSection />

      {/* The Featured Course Carousel Component */}
      <FeaturedCourseCarousel />

      {/* The Clean Stats Strip */}
      <StatsSection />

    </main>
  );
}
