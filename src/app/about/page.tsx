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

      {/* MISSION & VISION CONTENT */}
      <div className="relative z-20 bg-muted/30 border-y">
        <div className="container mx-auto px-6 py-16">
          <div className="max-w-[1220px] mx-auto">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-16 items-center mb-16">
              
              {/* LEFT COLUMN: COMPLEX IMAGE GRID */}
              <div className="relative grid grid-cols-2 gap-4">
                {/* Main Large Image */}
                <div className="relative row-span-2 group overflow-hidden rounded-xl">
                  <img
                    src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800"
                    alt="Students collaborating"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Floating Promo Card */}
                  <div className="absolute bottom-6 left-0 bg-background/90 backdrop-blur-md p-4 border-l-4 border-primary shadow-xl rounded-r-lg">
                    <div className="text-[10px] font-black text-foreground uppercase tracking-widest">20% OFF</div>
                    <div className="text-[9px] font-bold text-muted-foreground">For All Courses</div>
                  </div>
                </div>

                {/* Top Stat Cards Row */}
                <div className="grid grid-cols-2 gap-4 h-fit">
                  <div className="bg-background/80 backdrop-blur-md border border-border p-6 flex flex-col items-center justify-center text-center rounded-xl transition-all duration-500 shadow-sm hover:shadow-md hover:border-primary">
                    <div className="text-4xl font-black mb-1 text-foreground">16+</div>
                    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Years of experience</div>
                  </div>
                  <div className="bg-background/80 backdrop-blur-md border border-border p-6 flex flex-col items-center justify-center text-center rounded-xl transition-all duration-500 shadow-sm hover:shadow-md hover:border-primary">
                    <div className="text-4xl font-black mb-1 text-foreground">3k+</div>
                    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Global Graduates</div>
                  </div>
                </div>

                {/* Smaller Bottom Image */}
                <div className="relative group overflow-hidden h-[300px] rounded-xl">
                  <img
                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800"
                    alt="Students studying"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
              </div>

              {/* RIGHT COLUMN: PROFESSIONAL CONTENT */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-primary font-bold text-xs uppercase tracking-widest">Who We Are</span>
                  </div>
                  <h3 className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground tracking-tight leading-[1.05]">
                    Empowering Global <br />
                    <span className="text-primary">Accounting Excellence</span>
                  </h3>
                  <p className="text-muted-foreground text-[15px] leading-relaxed max-w-xl font-medium">
                    We bridge the gap between academic theory and industry expertise, empowering the next generation of global leaders through cutting-edge digital learning.
                  </p>
                </div>

                {/* Mission & Vision Rows */}
                <div className="space-y-8 pt-4">
                  <div className="flex gap-6 group">
                    <div className="w-14 h-14 shrink-0 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                      <svg className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-foreground mb-2 uppercase tracking-tight">Our Mission</h4>
                      <p className="text-muted-foreground text-sm leading-relaxed max-w-md font-medium">Bridging the critical gap between raw potential and professional career success on a global scale.</p>
                    </div>
                  </div>

                  <div className="flex gap-6 group">
                    <div className="w-14 h-14 shrink-0 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                      <svg className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-foreground mb-2 uppercase tracking-tight">Our Vision</h4>
                      <p className="text-muted-foreground text-sm leading-relaxed max-w-md font-medium">Empowering a global community of learners through advanced technology and accessible education.</p>
                    </div>
                  </div>
                </div>

                {/* Footer Section */}
                <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center gap-8">
                  <Button size="lg" className="px-8 font-bold uppercase tracking-widest text-xs" asChild>
                    <Link href="/auth/login">Sign In <ChevronRight className="w-4 h-4 ml-2" /></Link>
                  </Button>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-background shadow-lg">
                      <img src="https://i.pravatar.cc/150?img=53" alt="CEO" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="font-script text-2xl text-muted-foreground rotate-[-5deg] leading-none mb-1 opacity-80">Joel Wish</div>
                      <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">CEO Of Company</div>
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

      {/* CORE VALUES SECTION */}
      <section className="py-24 bg-background relative border-t border-border">
        <div className="container mx-auto px-6 max-w-[1220px]">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-[1px] bg-primary" />
                <span className="text-primary font-bold text-[10px] uppercase tracking-[0.4em]">Our Ethos</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-foreground tracking-tighter leading-[1.05] mb-6">
                The Values That <br />
                <span className="text-primary">Drive EduGlobal.</span>
              </h2>
            </div>
            <p className="text-muted-foreground font-medium text-lg max-w-sm leading-relaxed mb-4">
              Beyond education, we are committed to building a foundation of global professional ethics.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
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
                <div className="text-muted/30 text-8xl font-black absolute -top-10 -left-4 z-0 group-hover:text-primary/10 transition-colors pointer-events-none">
                  0{idx + 1}
                </div>
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-muted text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-sm border border-border">
                    {value.icon}
                  </div>
                  <h4 className="text-xl font-bold text-foreground mb-3 uppercase tracking-tight">{value.title}</h4>
                  <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                    {value.desc}
                  </p>
                  <div className="w-8 group-hover:w-full h-[2px] bg-primary mt-6 transition-all duration-500" />
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
      <section className="py-16 bg-muted/20 border-t">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
              Ready to Start Your ACCA Journey?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Join thousands of students and take the next step in advancing your global career in accounting.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="font-bold px-8 w-full sm:w-auto" asChild>
                <Link href="/courses">View All Courses</Link>
              </Button>
              <Button size="lg" variant="outline" className="font-bold px-8 w-full sm:w-auto" asChild>
                <Link href="/contact">Talk to an Advisor</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </main>


  );
}