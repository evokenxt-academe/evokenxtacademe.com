"use client";
import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Stars, FileText, Video, Users, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SuccessTimeline } from "@/components/success-timeline";
import { LmsClassesStripSection } from "@/components/lms-classes-strip-section";
import { TeamSection } from "@/components/team-section";

// ── Component ──────────────────────────────────────────────────────────────
export default function AboutPage() {


  return (

    <main className="relative min-h-screen bg-background text-foreground selection:bg-primary/20 overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        body {
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .image-container-mask {
          mask-image: linear-gradient(to bottom, black 90%, transparent 100%);
        }

        .badge-shadow {
          box-shadow: 0 20px 50px -12px rgba(0, 0, 0, 0.1);
        }

        .pill-shadow {
          box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.4);
        }
      `}</style>




      {/* HERO SECTION */}
      <section className="relative w-full min-h-[40vh] md:min-h-[50vh] flex items-center justify-center border-b border-border bg-background">
        {/* Fixed Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{ backgroundImage: "url('/wallpaper.jpeg')" }}
        />
        {/* Adaptive overlay for text readability */}
        <div className="absolute inset-0 bg-background/85" />

        {/* Content */}
        <div className="relative z-10 container mx-auto px-6 text-center py-20 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            <div className="mb-6">
              <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground uppercase tracking-widest font-semibold">
                <span className="w-8 h-[2px] bg-primary" />
                About Evoke EduGlobal
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-[6rem] font-extrabold text-foreground mb-8 leading-[0.95] tracking-tight">
              Empowering the <br className="hidden md:block" />
              <span className="text-primary">Next Generation</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed mb-10">
              We deliver world-class ACCA education and industry-driven programs to bridge the gap between learning and global career success.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="rounded-none h-12 px-8 text-base font-semibold" asChild>
                <Link href="/courses">Explore Programs</Link>
              </Button>
              <Button variant="outline" size="lg" className="rounded-none h-12 px-8 text-base font-semibold border-border bg-transparent hover:bg-muted" asChild>
                <Link href="#team">Meet the Team</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* MISSION & VISION CONTENT (Modernized Layout with Global Theme) */}
      <div
        className="relative z-20"
        style={{
          backgroundColor: "#F8FAFC",
          backgroundImage: `
            radial-gradient(at 0% 0%, rgba(56, 189, 248, 0.15) 0px, transparent 50%),
            radial-gradient(at 100% 0%, rgba(251, 146, 60, 0.12) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(16, 185, 129, 0.12) 0px, transparent 50%),
            radial-gradient(at 0% 100%, rgba(255, 255, 255, 0.8) 0px, transparent 50%)
          `,
        }}
      >
        <div className="container mx-auto px-6 py-16">
          <div className="max-w-[1220px] mx-auto">
            {/* WHO WE ARE - REFERENCE CLONE (HIGH FIDELITY) */}
            <div className="max-w-[1220px] mx-auto mb-24">
              <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-16 items-center">

                {/* LEFT COLUMN: COMPLEX IMAGE GRID */}
                <div className="relative grid grid-cols-2 gap-4">
                  {/* Main Large Image */}
                  <div className="relative row-span-2 group overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800"
                      alt="Students collaborating"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {/* Floating Promo Card */}
                    <div className="absolute bottom-6 left-0 bg-orange-50 p-4 border-l-4 border-orange-500 shadow-xl">
                      <div className="text-[10px] font-black text-slate-900 uppercase tracking-widest">20% OFF</div>
                      <div className="text-[9px] font-bold text-slate-500">For All Courses</div>
                    </div>
                  </div>

                  {/* Top Stat Cards Row - Simplified */}
                  <div className="grid grid-cols-2 gap-4 h-fit">
                    <div className="bg-white/40 backdrop-blur-md border border-white/50 p-6 flex flex-col items-center justify-center text-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-sm">
                      <div className="text-4xl font-black mb-1 text-slate-900 group-hover:text-white">16+</div>
                      <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-blue-100">Years of experience</div>
                    </div>
                    <div className="bg-white/40 backdrop-blur-md border border-white/50 p-6 flex flex-col items-center justify-center text-center group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 shadow-sm">
                      <div className="text-4xl font-black mb-1 text-slate-900 group-hover:text-white">3k+</div>
                      <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-slate-100">Global Graduates</div>
                    </div>
                  </div>

                  {/* Smaller Bottom Image */}
                  <div className="relative group overflow-hidden h-[300px]">
                    <img
                      src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800"
                      alt="Students studying"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>

                  {/* Decorative Dotted Background Element */}
                  <div className="absolute -bottom-6 -left-6 w-32 h-32 opacity-10 pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 0)', backgroundSize: '15px 15px' }} />
                </div>

                {/* RIGHT COLUMN: PROFESSIONAL CONTENT */}
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-600" />
                      <span className="text-blue-600 font-black text-xs uppercase tracking-widest">Who We Are</span>
                    </div>
                    <h3 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.05]">
                      Empowering Global <br />
                      <span className="text-blue-600">Accounting Excellence</span>
                    </h3>
                    <p className="text-slate-500 text-[15px] leading-relaxed max-w-xl font-medium">
                      We bridge the gap between academic theory and industry expertise, empowering the next generation of global leaders through cutting-edge digital learning.
                    </p>
                  </div>

                  {/* Mission & Vision Rows */}
                  <div className="space-y-10 pt-4">
                    <div className="flex gap-6 group">
                      <div className="w-16 h-16 shrink-0 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                        <svg className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Our Mission</h4>
                        <p className="text-slate-500 text-sm leading-relaxed max-w-md font-medium">Bridging the critical gap between raw potential and professional career success on a global scale.</p>
                      </div>
                    </div>

                    <div className="flex gap-6 group">
                      <div className="w-16 h-16 shrink-0 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                        <svg className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Our Vision</h4>
                        <p className="text-slate-500 text-sm leading-relaxed max-w-md font-medium">Empowering a global community of learners through advanced technology and accessible education.</p>
                      </div>
                    </div>
                  </div>

                  {/* Footer Section */}
                  <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-8">
                    <button className="px-10 py-5 bg-blue-600 text-white font-black text-[11px] uppercase tracking-[0.2em] hover:bg-slate-900 transition-all shadow-xl shadow-blue-100 flex items-center gap-3">
                      Sign In
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-lg">
                        <img src="https://i.pravatar.cc/150?img=53" alt="CEO" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="font-script text-2xl text-slate-400 rotate-[-5deg] leading-none mb-1 opacity-60">Joel Wish</div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">CEO Of Company</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* FULL WIDTH SUCCESS TIMELINE SECTION */}
      <SuccessTimeline />

      {/* CORE VALUES SECTION - EDITORIAL MINIMALISM */}
      <section className="py-24 bg-white relative border-t border-slate-100">
        <div className="container mx-auto px-6 max-w-[1220px]">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-[1px] bg-indigo-600" />
                <span className="text-indigo-600 font-black text-[10px] uppercase tracking-[0.4em]">Our Ethos</span>
              </div>
              <h2 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[0.95] mb-6">
                The Values That <br />
                <span className="text-indigo-600">Drive EduGlobal.</span>
              </h2>
            </div>
            <p className="text-slate-500 font-medium text-lg max-w-sm leading-relaxed mb-4">
              Beyond education, we are committed to building a foundation of global professional ethics.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-16">
            {[
              {
                title: "Excellence",
                desc: "Setting the gold standard in ACCA and professional accounting education worldwide.",
                icon: <Stars className="w-6 h-6" />
              },
              {
                title: "Integrity",
                desc: "Upholding the highest ethical standards in every student journey and interaction.",
                icon: <FileText className="w-6 h-6" />
              },
              {
                title: "Innovation",
                desc: "Pioneering AI-driven learning paths and digital-first educational experiences.",
                icon: <Video className="w-6 h-6" />
              },
              {
                title: "Impact",
                desc: "Creating real-world career transformations for a global community of professionals.",
                icon: <Users className="w-6 h-6" />
              }
            ].map((value, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                className="group relative"
              >
                <div className="text-slate-100 text-8xl font-black absolute -top-12 -left-4 z-0 group-hover:text-indigo-50 transition-colors pointer-events-none">
                  0{idx + 1}
                </div>
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 text-indigo-600 flex items-center justify-center mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-sm border border-slate-100">
                    {value.icon}
                  </div>
                  <h4 className="text-xl font-black text-slate-900 mb-4 uppercase tracking-tight">{value.title}</h4>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed">
                    {value.desc}
                  </p>
                  <div className="w-8 group-hover:w-full h-[2px] bg-indigo-600 mt-8 transition-all duration-500" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* STRIP SECTION (Now After Feature Cards) */}
      <div className="relative z-30 mt-0 pointer-events-none">
        <LmsClassesStripSection />
      </div>

      <TeamSection />

      {/* ─── FINAL CTA ─── */}
      <section className="py-24 bg-slate-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-indigo-600/10 skew-x-12" />
        <div className="container mx-auto px-4 max-w-7xl relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-8 leading-tight uppercase tracking-tight">
            Ready to Start Your <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-teal-400">ACCA Journey?</span>
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button className="px-10 py-5 bg-white text-slate-900 font-black text-xs uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-2xl">
              View All Courses
            </button>
            <button className="px-10 py-5 bg-transparent border border-white/20 text-white font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all">
              Talk to an Advisor
            </button>
          </div>
        </div>
      </section>
    </main>


  );
}