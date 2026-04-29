"use client";

import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Cpu, Globe, Users } from "lucide-react";

export function PremiumAboutHero() {
  return (
    <section className="relative w-full min-h-[70vh] flex items-center justify-center overflow-hidden bg-[#0A0C10]">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80"
          alt="Professional Environment"
          className="w-full h-full object-cover opacity-30 mix-blend-overlay scale-110 blur-[2px]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0C10]/80 via-transparent to-[#0A0C10]" />
        
        {/* Animated Orbs */}
        <motion.div 
          animate={{ 
            x: [0, 100, 0], 
            y: [0, -50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" 
        />
        <motion.div 
          animate={{ 
            x: [0, -100, 0], 
            y: [0, 50, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" 
        />
      </div>

      <div className="container mx-auto px-6 relative z-10 py-24">
        <div className="flex flex-col items-center text-center">
          {/* Eyebrow */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-medium text-white/70 tracking-widest uppercase">The Future of Financial Learning</span>
          </motion.div>

          {/* Heading */}
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="text-5xl md:text-8xl font-bold text-white mb-8 tracking-tighter leading-[0.9] max-w-5xl"
          >
            Intelligence designed <br /> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500">
              for your success.
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="text-lg md:text-xl text-white/50 max-w-2xl leading-relaxed mb-12 font-light"
          >
            Evoke EduGlobal isn&apos;t just an educational institution; it&apos;s a state-of-the-art learning ecosystem engineered to transform professional aspirations into global careers.
          </motion.p>

          {/* CTA Group */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center gap-6"
          >
            <Button size="lg" className="h-14 px-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold group">
              Explore Platform
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <button className="text-white/70 hover:text-white font-medium flex items-center gap-2 transition-colors">
              Schedule a Demo
              <span className="w-8 h-px bg-white/20" />
            </button>
          </motion.div>

          {/* Platform Metrics (Glassmorphism) */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.7 }}
            className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-24 mt-24 pt-16 border-t border-white/5 w-full max-w-4xl"
          >
            <div className="flex flex-col items-center md:items-start text-center md:text-left gap-3">
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                <Globe className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-white font-bold text-2xl uppercase tracking-tighter">Global</p>
                <p className="text-white/40 text-xs uppercase tracking-widest mt-1 italic">Standards</p>
              </div>
            </div>
            <div className="flex flex-col items-center md:items-start text-center md:text-left gap-3">
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                <Cpu className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-white font-bold text-2xl uppercase tracking-tighter">Adaptive</p>
                <p className="text-white/40 text-xs uppercase tracking-widest mt-1 italic">Technology</p>
              </div>
            </div>
            <div className="flex flex-col items-center md:items-start text-center md:text-left gap-3 col-span-2 md:col-span-1">
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-white font-bold text-2xl uppercase tracking-tighter">Network</p>
                <p className="text-white/40 text-xs uppercase tracking-widest mt-1 italic">World-Class</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
