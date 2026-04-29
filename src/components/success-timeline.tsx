"use client";

import React from "react";
import { motion } from "motion/react";
import { Milestone, Calendar, Globe, Award, TrendingUp, Rocket, MapPin } from "lucide-react";

interface TimelineItem {
  year: string;
  title: string;
  location?: string;
  description: string;
  icon: React.ReactNode;
}

const milestones: TimelineItem[] = [
  {
    year: "2019",
    title: "The Genesis",
    location: "Delhi Hub",
    description: "Founded with a singular mission to revolutionize accounting education across the subcontinent, starting with our core hub in Delhi.",
    icon: <Milestone className="w-4 h-4" />,
  },
  {
    year: "2020",
    title: "Digital Evolution",
    location: "LMS Launch",
    description: "Pivoted to a high-fidelity digital ecosystem, ensuring uninterrupted learning for thousands of students during global shifts.",
    icon: <Globe className="w-4 h-4" />,
  },
  {
    year: "2021",
    title: "National Scale",
    location: "Pan-India",
    description: "Reached a milestone of 50,000+ active learners, bridging the gap between local talent and international expertise.",
    icon: <TrendingUp className="w-4 h-4" />,
  },
  {
    year: "2022",
    title: "Global Excellence",
    location: "London Accredited",
    description: "Recognized by international bodies for our innovative pedagogy and commitment to world-class professional standards.",
    icon: <Award className="w-4 h-4" />,
  },
  {
    year: "2023",
    title: "Strategic Growth",
    location: "Impact Labs",
    description: "Introduced AI-driven progress tracking and personalized mentorship paths, resulting in record-breaking pass rates.",
    icon: <Rocket className="w-4 h-4" />,
  },
  {
    year: "2024",
    title: "National Leadership",
    location: "Global Reach",
    description: "Successfully connected 1 Lakh+ learners with global career opportunities, cementing our position as a subcontinent leader.",
    icon: <Calendar className="w-4 h-4" />,
  },
  {
    year: "2025",
    title: "The Future Defined",
    location: "Next Gen LMS",
    description: "Launching AI-driven personalized learning paths and augmented mentorship, setting a new global standard in professional education.",
    icon: <Rocket className="w-4 h-4" />,
  },
];

export function SuccessTimeline() {
  return (
    <section className="py-12 bg-[#0E1628] relative overflow-hidden border-y border-white/5">
      {/* Mesh Gradient Accents */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-indigo-600/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-purple-600/10 blur-[100px] rounded-full" />
      </div>

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        {/* Header - Editorial Style */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-3 mb-6"
          >
            <div className="h-px w-8 bg-indigo-500" />
            <span className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em]">Success Journey</span>
            <div className="h-px w-8 bg-indigo-500" />
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black text-white tracking-tight leading-[1.1] mb-6"
          >
            A Journey of <br /> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-indigo-500 italic font-serif">Global Excellence</span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 max-w-2xl mx-auto text-lg font-medium leading-relaxed"
          >
            Dedicated to transforming the educational landscape across the subcontinent. Our ecosystem connects local talent with global expertise.
          </motion.p>
        </div>

        {/* Timeline - Alternating Left/Right */}
        <div className="relative">
          {/* Central Vertical Line (Visible only on Desktop) */}
          <div className="absolute left-[20px] md:left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-indigo-500/50 via-white/10 to-transparent -translate-x-1/2" />

          <div className="space-y-10 md:space-y-14">
            {milestones.map((item, idx) => (
              <TimelineItem key={idx} item={item} index={idx} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TimelineItem({ item, index }: { item: TimelineItem; index: number }) {
  const isEven = index % 2 === 0;

  return (
    <div className={`relative flex items-center justify-center w-full group ${isEven ? "md:flex-row" : "md:flex-row-reverse"}`}>
      {/* Central Node Dot */}
      <div className="absolute left-[20px] md:left-1/2 top-0 md:top-1/2 -translate-x-1/2 md:-translate-y-1/2 w-3 h-3 border-2 border-indigo-500 bg-[#0E1628] z-20 transition-all duration-500 group-hover:scale-150 group-hover:bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]" />

      {/* Content Container */}
      <div className={`w-full md:w-1/2 pl-12 md:pl-0 ${isEven ? "md:pr-16" : "md:pl-16"}`}>
        <motion.div
          initial={{ opacity: 0, x: isEven ? -40 : 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className={`w-full max-w-lg bg-white/[0.03] backdrop-blur-md border border-white/[0.05] p-8 rounded-[2rem] hover:bg-white/[0.07] transition-all duration-500 group shadow-2xl ${isEven ? "md:items-end md:text-right" : "md:items-start md:text-left"}`}>
            {/* Year Badge */}
            <div className={`text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2 ${isEven ? "justify-end" : "justify-start"}`}>
              <Calendar className="w-3 h-3" />
              {item.year}
            </div>

            <div className={`flex flex-col gap-4 ${isEven ? "md:items-end" : "md:items-start"}`}>
              <div className={`flex items-center gap-3 ${isEven ? "md:flex-row-reverse" : "md:flex-row"}`}>
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500">
                  {item.icon}
                </div>
                <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">
                  {item.title}
                </h3>
              </div>

              <div className={`flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest ${isEven ? "md:flex-row-reverse" : "md:flex-row"}`}>
                <MapPin className="w-3 h-3 text-indigo-500/50" />
                {item.location}
              </div>

              <p className="text-slate-400 text-[14px] leading-relaxed font-medium">
                {item.description}
              </p>

              {/* Progress Bar Decoration */}
              <div className={`h-[2px] w-12 bg-indigo-500/20 group-hover:w-full transition-all duration-1000 ${isEven ? "ml-auto" : "mr-auto"}`} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Spacer for Desktop Grid */}
      <div className="hidden md:block w-1/2" />
    </div>
  );
}
