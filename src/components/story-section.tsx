"use client";

import React, { useState } from "react";
import { Play, ArrowRight, X, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function StorySection() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  return (
    <>
      <section className="py-24 bg-white overflow-hidden relative">
        <div className="container mx-auto px-6 max-w-7xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">
            
            {/* Left Column: Text Content */}
            <div className="flex flex-col justify-center order-2 lg:order-1">
              <div className="inline-flex items-center gap-3 mb-6">
                 <span className="w-8 h-[2px] bg-indigo-500"></span>
                 <span className="text-sm font-bold text-indigo-600 uppercase tracking-widest">
                   Evoke EduGlobal
                 </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-[1.15] mb-6 tracking-tight">
                Transforming Ambition Into{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-600">
                  Excellence
                </span>
              </h2>
              
              <p className="text-lg text-slate-500 leading-relaxed mb-10">
                Experience education without boundaries. Evoke EduGlobal brings the classroom directly to you with crystal-clear 4K video lessons, highly interactive live lectures, and rigorous mock exams designed to guarantee your professional success.
              </p>

              {/* Features Bullet Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8 mb-12">
                {[
                  "Premium 4K Videos",
                  "Live Interactive Lectures",
                  "Comprehensive Exams",
                  "24/7 Expert Support",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                    <span className="text-slate-700 font-semibold">{item}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <div>
                <a
                  href="#"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white font-bold rounded-none hover:bg-indigo-700 transition-colors shadow-lg"
                >
                  Join The Platform <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                </a>
              </div>
            </div>

            {/* Right Column: Video Card */}
            <div className="relative mx-auto w-full order-1 lg:order-2">
              {/* Offset accent block behind the video */}
              <div className="absolute top-6 -right-4 w-full h-full border border-indigo-200 z-0 bg-indigo-50/50"></div>

              <div className="relative z-10 bg-slate-100 shadow-xl aspect-[4/3] w-full border border-slate-200 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200"
                  alt="Student watching 4K video lectures"
                  className="w-full h-full object-cover object-center"
                />

                {/* Play overlay */}
                <div
                  className="absolute inset-0 flex items-center justify-center bg-slate-900/30 group cursor-pointer hover:bg-slate-900/40 transition-colors"
                  onClick={() => setIsVideoOpen(true)}
                >
                  <button className="w-24 h-24 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-all duration-300 shadow-2xl border border-white">
                    <Play className="w-10 h-10 ml-2" fill="currentColor" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Video Modal */}
      <AnimatePresence>
        {isVideoOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-xl"
          >
            <div className="absolute inset-0 z-0 cursor-pointer" onClick={() => setIsVideoOpen(false)}></div>

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative z-10 w-full max-w-6xl bg-black shadow-2xl border border-white/10"
            >
              <button
                onClick={() => setIsVideoOpen(false)}
                className="absolute -top-12 right-0 z-20 text-white/60 hover:text-white flex items-center gap-2 transition-colors font-semibold tracking-widest text-sm uppercase"
              >
                Close <X className="w-5 h-5" />
              </button>

              <div className="relative w-full pb-[56.25%]">
                <iframe
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                  title="EduGlobal Promotional Video"
                  className="absolute inset-0 w-full h-full border-none"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
