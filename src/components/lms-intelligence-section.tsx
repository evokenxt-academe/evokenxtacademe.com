"use client";

import { motion } from "motion/react";
import { BarChart3, BookOpen, Layers, ShieldCheck, Zap } from "lucide-react";

const features = [
  {
    title: "Real-time Intelligence",
    description: "Our proprietary dashboard provides sub-second tracking of your exam progress and learning milestones.",
    icon: <BarChart3 className="w-6 h-6 text-blue-500" />,
    className: "md:col-span-2",
  },
  {
    title: "Adaptive Learning",
    description: "Curriculum that evolves based on your strength and weakness zones.",
    icon: <Zap className="w-6 h-6 text-indigo-500" />,
    className: "md:col-span-1",
  },
  {
    title: "Verified Excellence",
    description: "Industry-standard certification training for ACCA and global finance.",
    icon: <ShieldCheck className="w-6 h-6 text-emerald-500" />,
    className: "md:col-span-1",
  },
  {
    title: "Structural Modulars",
    description: "Learn through high-impact, bite-sized modules designed for retention.",
    icon: <Layers className="w-6 h-6 text-purple-500" />,
    className: "md:col-span-1",
  },
  {
    title: "Academic Hub",
    description: "A centralized repository of premium study materials, case studies, and mock exams.",
    icon: <BookOpen className="w-6 h-6 text-blue-400" />,
    className: "md:col-span-1",
  },
];

export function LMSIntelligenceSection() {
  return (
    <section className="py-24 bg-[#0A0C10] relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl mb-16">
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="text-white text-3xl md:text-5xl font-bold tracking-tight mb-6"
          >
            The technology behind <br />
            <span className="text-white/40 italic font-light">professional mastery.</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-white/50 text-lg leading-relaxed"
          >
            We don&apos;t just teach; we deliver a systematic edge through data-driven insights and world-class digital tools.
          </motion.p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`p-10 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group overflow-hidden relative ${feature.className}`}
            >
              {/* Subtle background glow on hover */}
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-blue-600/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative z-10">
                <div className="mb-6 p-3 rounded-2xl bg-white/[0.03] border border-white/5 w-fit group-hover:bg-white/10 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-white text-xl font-bold mb-4 tracking-tight">{feature.title}</h3>
                <p className="text-white/40 leading-relaxed text-sm">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
