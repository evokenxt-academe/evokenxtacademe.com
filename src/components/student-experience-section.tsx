"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Star } from "lucide-react";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

const avatars = [
  { id: 1, x: -350, y: -100, scale: 0.9, delay: 0.1, src: "https://i.pravatar.cc/150?u=1" },
  { id: 2, x: -300, y: 150, scale: 1.1, delay: 0.3, src: "https://i.pravatar.cc/150?u=2" },
  { id: 3, x: -150, y: -250, scale: 0.8, delay: 0.5, src: "https://i.pravatar.cc/150?u=3" },
  { id: 4, x: 150, y: -250, scale: 0.85, delay: 0.2, src: "https://i.pravatar.cc/150?u=4" },
  { id: 5, x: 300, y: 150, scale: 1.05, delay: 0.4, src: "https://i.pravatar.cc/150?u=5" },
  { id: 6, x: 350, y: -100, scale: 0.95, delay: 0.6, src: "https://i.pravatar.cc/150?u=6" },
];

const stackedAvatars = [
  "https://i.pravatar.cc/100?u=a",
  "https://i.pravatar.cc/100?u=b",
  "https://i.pravatar.cc/100?u=c",
  "https://i.pravatar.cc/100?u=d",
];

export function StudentExperienceSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [0.95, 1]);

  return (
    <section 
      ref={containerRef}
      className="relative w-full py-28 md:py-40 overflow-hidden bg-transparent font-sans border-b border-slate-100/30"
    >
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
           style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #000 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      
      {/* Animated Avatars Arc */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center -z-10">
        <motion.div style={{ opacity, scale }} className="relative w-full max-w-7xl h-full flex items-center justify-center">
          {avatars.map((avatar) => (
            <motion.div
              key={avatar.id}
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: avatar.scale }}
              viewport={{ once: true }}
              transition={{ 
                duration: 0.8, 
                delay: avatar.delay,
                type: "spring",
                stiffness: 100 
              }}
              style={{
                x: avatar.x,
                y: avatar.y,
              }}
              className="absolute hidden md:block"
            >
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full blur opacity-0 group-hover:opacity-25 transition duration-500" />
                <div className="relative h-16 w-16 md:h-20 md:w-20 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-slate-100 ring-1 ring-slate-100 transition-transform duration-500 group-hover:scale-110">
                  <img src={avatar.src} alt="Student" className="w-full h-full object-cover" />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto text-center"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100/50 mb-8 shadow-sm">
            <Star className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-blue-700">
              Transforming Futures
            </span>
          </div>

          {/* Title */}
          <h2 className="text-4xl md:text-7xl font-bold tracking-tight text-slate-900 mb-8 leading-[1.05]">
            Real Experiences from <br className="hidden md:block" /> 
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              Real Learners
            </span>
          </h2>

          {/* Description */}
          <p className="text-slate-500 text-lg md:text-xl leading-relaxed mb-12 max-w-2xl mx-auto">
            Discover how students worldwide have built new skills and unlocked global opportunities through our structured professional pathways.
          </p>

          {/* CTA & Social Proof */}
          <div className="flex flex-col items-center gap-10">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                size="lg" 
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-14 px-10 rounded-full shadow-2xl shadow-blue-500/20 flex items-center gap-3 transition-all border-none"
              >
                Join the Platform
                <ArrowRight className="w-5 h-5" />
              </Button>
            </motion.div>

            {/* Social Proof Pill (Premium Glass) */}
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-100 to-indigo-100 blur-xl opacity-0 group-hover:opacity-100 transition duration-1000" />
              <div className="relative inline-flex items-center gap-4 py-2 px-4 bg-white/40 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm transition-all hover:bg-white/60">
                <div className="flex -space-x-2.5">
                  {stackedAvatars.map((url, i) => (
                    <div key={i} className="inline-block h-7 w-7 rounded-full ring-2 ring-white/50 overflow-hidden bg-slate-200">
                      <img src={url} alt="Learner" className="h-full w-full object-cover" />
                    </div>
                  ))}
                  <div className="h-7 w-7 rounded-full ring-2 ring-white/50 bg-blue-600 flex items-center justify-center text-[10px] text-white font-bold">
                    +
                  </div>
                </div>
                <div className="text-left leading-none">
                  <p className="text-sm font-bold text-slate-900 mb-0.5 tracking-tight">Trusted by +23k students</p>
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider italic">95% Success Rate</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
