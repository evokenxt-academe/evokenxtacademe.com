"use client";

import React, { useState } from "react";
import { Play, ArrowRight, X, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BlurFade } from "@/components/ui/blur-fade";

export function StorySection() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  return (
    <>
      <section className="py-20 md:py-28 overflow-hidden relative">
        <div className="container mx-auto px-6 max-w-6xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Left Column: Text Content */}
            <div className="flex flex-col justify-center order-2 lg:order-1">
              <BlurFade delay={0.1} inView>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-xs font-bold text-primary uppercase tracking-[0.15em]">
                    Evokenxt
                  </span>
                </div>
              </BlurFade>

              <BlurFade delay={0.2} inView>
                <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-extrabold text-foreground leading-[1.1] mb-5 tracking-tight">
                  Transforming Ambition Into{" "}
                  <span className="text-primary">Excellence</span>
                </h2>
              </BlurFade>

              <BlurFade delay={0.3} inView>
                <p className="text-base text-muted-foreground leading-relaxed mb-8 max-w-md">
                  Experience education without boundaries. Evokenxt brings the
                  classroom directly to you with crystal-clear 4K video lessons,
                  highly interactive live lectures, and rigorous mock exams
                  designed to guarantee your professional success.
                </p>
              </BlurFade>

              {/* Features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 mb-8">
                {[
                  "Premium 4K Videos",
                  "Live Interactive Lectures",
                  "Comprehensive Exams",
                  "24/7 Expert Support",
                ].map((item, idx) => (
                  <BlurFade key={item} delay={0.35 + idx * 0.05} inView>
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="size-4.5 text-primary flex-shrink-0" />
                      <span className="text-sm font-semibold text-foreground">{item}</span>
                    </div>
                  </BlurFade>
                ))}
              </div>

              {/* CTA */}
              <BlurFade delay={0.55} inView>
                <div>
                  <Button size="lg" className="h-12 px-8 rounded-none font-bold" asChild>
                    <Link href="/auth/login">
                      Join The Platform
                      <ArrowRight className="ml-2 size-4" />
                    </Link>
                  </Button>
                </div>
              </BlurFade>
            </div>

            {/* Right Column: Video Card */}
            <div className="relative mx-auto w-full order-1 lg:order-2">
              <BlurFade delay={0.25} inView>
                {/* Offset accent block */}
                <div className="absolute top-6 -right-4 w-full h-full border border-primary/15 z-0 bg-primary/[0.03]" />

                <div className="relative z-10 bg-card shadow-xl aspect-[4/3] w-full border border-border overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200"
                    alt="Student watching 4K video lectures"
                    className="w-full h-full object-cover object-center"
                  />

                  {/* Play overlay */}
                  <div
                    className="absolute inset-0 flex items-center justify-center bg-black/40 group cursor-pointer hover:bg-black/50 transition-colors"
                    onClick={() => setIsVideoOpen(true)}
                  >
                    <button className="w-20 h-20 md:w-24 md:h-24 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-all duration-300 shadow-2xl border border-white">
                      <Play className="w-8 h-8 md:w-10 md:h-10 ml-1.5" fill="currentColor" />
                    </button>
                  </div>
                </div>
              </BlurFade>
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
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-background/95 backdrop-blur-xl"
          >
            <div className="absolute inset-0 z-0 cursor-pointer" onClick={() => setIsVideoOpen(false)} />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative z-10 w-full max-w-5xl bg-black shadow-2xl border border-border"
            >
              <button
                onClick={() => setIsVideoOpen(false)}
                className="absolute -top-12 right-0 z-20 text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors font-semibold tracking-widest text-sm uppercase"
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
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
