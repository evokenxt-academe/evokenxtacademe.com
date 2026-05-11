"use client";

import { Card } from "@/components/ui/card";
import { motion } from "motion/react";
import {
  GraduationCap,
  Users,
  Clock,
  Globe,
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
    <section className="relative py-16 md:py-20 border-y border-border/40 overflow-hidden">
      
      {/* ─── PURE PHOTO (No gradients, no smoke, no overlays) ─── */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-fixed"
        style={{ backgroundImage: "url('/wallpaper.jpeg')" }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          
          {/* ─── Left Column: Explicit Light/Dark Text Colors ─── */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col text-left"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-black dark:text-white leading-[1.1] mb-4 drop-shadow-md">
              World-Class Learning <br />
              <span className="text-primary">Experience</span>
            </h2>
            <p className="text-base md:text-lg text-zinc-900 dark:text-zinc-100 font-bold max-w-md drop-shadow-md">
              Join thousands of students achieving professional excellence. Evoke EduGlobal delivers expert-led courses, rigorous mock exams, and unparalleled support to accelerate your career.
            </p>
          </motion.div>

          {/* ─── Right Column: Clean shadcn Cards (No Border Radius) ─── */}
          <motion.div 
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.1 } }
            }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {lmsStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <motion.div key={stat.id} variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }}>
                  <Card className="bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-primary/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/80 active:scale-[0.98] transition-all duration-300 p-6 flex flex-col gap-4 rounded-none group cursor-pointer">
                    <div className="w-10 h-10 rounded-none bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors duration-300">
                      <Icon className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-black dark:text-white mb-0.5 tracking-tight group-hover:text-primary transition-colors duration-300">{stat.value}</h3>
                      <p className="text-[12px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">{stat.label}</p>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>

        </div>
      </div>
    </section>
  );
}
