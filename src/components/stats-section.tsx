"use client";

import React from "react";
import { BookOpen, Users, GraduationCap, Clock } from "lucide-react";
import { motion } from "motion/react";

const stats = [
  {
    icon: <BookOpen className="w-8 h-8 text-[#FFB800] mb-6" strokeWidth={2} />,
    number: "15+",
    label: "Premium Courses"
  },
  {
    icon: <Users className="w-8 h-8 text-[#FFB800] mb-6" strokeWidth={2} />,
    number: "500+",
    label: "Students Enrolled"
  },
  {
    icon: <GraduationCap className="w-8 h-8 text-[#FFB800] mb-6" strokeWidth={2} />,
    number: "30+",
    label: "Expert Teachers"
  },
  {
    icon: <Clock className="w-8 h-8 text-[#FFB800] mb-6" strokeWidth={2} />,
    number: "10+",
    label: "Years of Excellence"
  }
];

export function StatsSection() {
  return (
    <section className="relative py-28 bg-white overflow-hidden">
      {/* Bright, clean white architectural background photo */}
      <div 
        className="absolute inset-0 z-0 bg-fixed bg-cover bg-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&h=1000')", 
        }}
      />

      <div className="container mx-auto px-6 relative z-10 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, idx) => (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.8 }}
              key={idx}
              className="flex flex-col items-center justify-center py-12 px-6 text-center border border-slate-200/60 bg-white/50 backdrop-blur-md transition-all duration-500 hover:bg-white hover:shadow-xl"
            >
              {stat.icon}
              <h3 className="text-5xl font-black text-slate-900 mb-2 tracking-tighter">
                {stat.number}
              </h3>
              <p className="text-slate-600 font-bold uppercase tracking-widest text-[11px]">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
