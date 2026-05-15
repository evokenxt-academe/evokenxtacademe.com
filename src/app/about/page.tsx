"use client";
import React, { useState, useEffect } from "react";

const ROTATING_WORDS = ["Efficient", "Innovative", "Scalable", "Dynamic"];
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Stars, FileText, Video, Users, ChevronRight, Award, ShieldCheck, Lightbulb, Globe, Rocket, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SuccessTimeline } from "@/components/success-timeline";
import { LmsClassesStripSection } from "@/components/lms-classes-strip-section";
import TeamSection from "@/components/team-section";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";



const VALUES = [
  {
    title: "Excellence",
    description:
      "Setting the gold standard in ACCA and professional accounting education worldwide.",
    icon: Award,
  },
  {
    title: "Integrity",
    description:
      "Upholding the highest ethical standards in every student journey and interaction.",
    icon: ShieldCheck,
  },
  {
    title: "Innovation",
    description:
      "Pioneering AI-driven learning paths and digital-first educational experiences.",
    icon: Lightbulb,
  },
  {
    title: "Impact",
    description:
      "Creating real-world career transformations for a global community of professionals.",
    icon: Globe,
  },
] as const;




const STATS = [
  { value: "16+", label: "Years of excellence" },
  { value: "3,000+", label: "Global graduates" },
  { value: "95%", label: "Pass rate improvement" },
  { value: "40+", label: "Countries reached" },
] as const;


// ── Component ──────────────────────────────────────────────────────────────
export default function AboutPage() {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

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



      <section className="w-full bg-background py-16 px-6 md:px-12 lg:px-24 my-10">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-center items-center gap-10 lg:gap-16">

          {/* ── Left Content ── */}
          <div className="flex-1 flex flex-col items-start gap-6 max-w-xl">

            {/* Badge */}
            <span className="inline-block border border-gray-300 text-sm px-5 py-2 rounded-full tracking-wide">
              Solution for client-facing businesses
            </span>

            {/* Heading */}
            <h1 className="text-4xl md:text-5xl font-extrabold leading-[1.15] tracking-tight text-balance">
              Helping You Build and Grow a Thriving{' '}
              <span
                className="relative inline-flex items-center h-[1.3em] min-w-[200px] md:min-w-[240px] align-bottom overflow-hidden rounded-xl border border-white/20 bg-primary/10 backdrop-blur-md shadow-lg shadow-primary/10"
              >
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={wordIndex}
                    initial={{ opacity: 0, y: 40, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -40, filter: "blur(4px)" }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="absolute inset-0 flex items-center justify-center text-primary font-bold px-4"
                  >
                    {ROTATING_WORDS[wordIndex]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </h1>

            {/* Description */}
            <p className=" text-base md:text-[17px] leading-relaxed">
              In today&apos;s fast-paced world, staying ahead means taking bold steps to expand,
              innovate, and lead. We&apos;re here to equip you with the right strategies, insights,
              and tools to drive growth and turn your business goals into reality. Let&apos;s
              transform your vision into measurable success.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button className="flex items-center gap-2 bg-gray-950 text-white text-sm font-semibold px-7 py-3.5 rounded-full hover:bg-gray-800 transition-colors duration-200">
                Schedule A Demo
                <Rocket className="w-4 h-4" aria-hidden="true" />
              </button>
              <button className="flex items-center gap-2 border border-gray-300  text-sm font-semibold px-7 py-3.5 rounded-full hover:bg-gray-50 transition-colors duration-200">
                Watch Video
                <Play className="w-4 h-4 fill-gray-900" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* ── Right Image Block ── */}
          <div className="flex-shrink-0 hidden lg:flex justify-end relative">
            {/* Main card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="relative w-[380px] h-[420px] rounded-3xl overflow-hidden shadow-2xl bg-muted"
            >
              <img
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=800"
                alt="Professional team collaborating"
                className="w-full h-full object-cover object-center"
              />
            </motion.div>
          </div>

        </div>
      </section>

      {/* MISSION & VISION CONTENT */}
      < div className="relative z-20 bg-muted/30 border-y" >
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

      <section className="bg-background">
        <div className="container mx-auto px-6 py-24 max-w-6xl">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-16">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-primary font-bold text-xs uppercase tracking-widest">Our Ethos</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-[1.1]">
                Values That Drive <br />
                <span className="text-primary">EvokeNXT</span>
              </h2>
            </div>
            <p className="text-muted-foreground text-[15px] leading-relaxed max-w-sm md:text-right font-medium">
              Beyond education, we are committed to building a foundation of
              global professional ethics and continuous growth.
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map(({ title, description, icon: Icon }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}
                className="h-full"
              >
                <div className="h-full relative overflow-hidden rounded-2xl bg-background border border-border p-8 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-primary/20 transition-all duration-500 group flex flex-col">
                  {/* Subtle Background Gradient */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity duration-500 opacity-0 group-hover:opacity-100" />

                  {/* Icon */}
                  <div className="relative mb-8 w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                    <Icon className="w-7 h-7 stroke-[1.5]" />
                  </div>

                  {/* Text */}
                  <div className="relative mt-auto space-y-3">
                    <h4 className="font-bold text-foreground text-lg tracking-tight">
                      {title}
                    </h4>
                    <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                      {description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>


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