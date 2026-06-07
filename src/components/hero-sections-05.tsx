"use client";

import { useEffect, useRef, useState } from "react";
import {
  GraduationCap,
  ArrowRight,
  Trophy,
  Users,
  BookOpen,
  Zap,
  Globe,
  ShieldCheck,
  Award,
  Sparkles,
} from "lucide-react";
import { motion, useInView } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  },
};

/* ── Animated counter ─────────────────────────────────────── */
function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  useEffect(() => {
    if (!inView) return;
    const dur = 1600;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      setVal(Math.floor((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, target]);
  return (
    <span ref={ref}>
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}

export default function CourseHeroSection() {
  return (
    <section className="relative w-full overflow-hidden pb-0 pt-4">
      {/* ── Background Aesthetics (Premium Mesh & Dot Grid) ── */}
      <div className="pointer-events-none absolute inset-0 -z-10 select-none">
        {/* Colorful Glowing Orbs */}
        <div className="absolute -left-32 top-0 size-[500px] rounded-full bg-primary/10 blur-[130px] dark:bg-primary/5" />
        <div className="absolute -right-32 bottom-0 size-[400px] rounded-full bg-violet-600/10 blur-[110px] dark:bg-violet-600/5" />
        <div className="absolute left-1/3 top-1/4 size-[300px] rounded-full bg-emerald-500/[0.04] blur-[90px]" />

        {/* Dynamic Matrix-Like Dot Grid */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage:
              "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:py-16">
        <motion.div
          className="relative grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          {/* ── Left: Content ──────────────────────────────────── */}
          <div className="flex flex-col gap-6 lg:gap-8">
            <motion.div variants={fadeUp} className="self-center lg:self-start">
              <Badge
                variant="outline"
                className="inline-flex items-center gap-2 rounded-full border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary backdrop-blur-md shadow-sm dark:bg-primary/20"
              >
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex size-2 rounded-full bg-primary" />
                </span>
                New Batches Starting Soon
              </Badge>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="mx-auto flex max-w-xl flex-col gap-4 text-center lg:mx-0 lg:text-start"
            >
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
                <span>Master Your</span> <br />
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-primary via-primary/90 to-violet-500 bg-clip-text text-transparent">
                    ACCA
                  </span>
                  <span className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-gradient-to-r from-primary to-violet-500/50" />
                </span>
                <span className="text-muted-foreground"> Journey</span>
              </h1>

              <p className="text-base leading-relaxed text-muted-foreground lg:text-lg">
                Join our comprehensive LMS platform. Access premium study
                materials, live interactive classes, and expert guidance to
                accelerate your professional growth.
              </p>
            </motion.div>

            {/* Social proof */}
            <motion.div
              variants={fadeUp}
              className="flex items-center gap-3 justify-center lg:justify-start"
            >
              <div className="flex -space-x-2">
                {[
                  {
                    src: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100&h=100",
                    fb: "U1",
                  },
                  {
                    src: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100&h=100",
                    fb: "U2",
                  },
                  {
                    src: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100",
                    fb: "U3",
                  },
                ].map((u, i) => (
                  <Avatar
                    key={i}
                    className="size-7 border-2 border-background ring-1 ring-border/50"
                  >
                    <AvatarImage src={u.src} />
                    <AvatarFallback className="text-[10px]">
                      {u.fb}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">500+</span>{" "}
                students already enrolled
              </p>
            </motion.div>
          </div>

          {/* ── Right: 2×2 Bento Cards (Jaw-Dropping Styles) ─────── */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* Card 1 — Hero Image with glassmorphic stats overlay */}
            <motion.div variants={fadeUp} className="col-span-1">
              <div className="group relative h-full min-h-[140px] overflow-hidden rounded-2xl border border-border/60 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg sm:min-h-[160px]">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop"
                  alt="Students studying together"
                  className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                {/* Glassmorphic overlay pill */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="flex size-6 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
                        <BookOpen className="size-3 text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-white sm:text-[11px]">
                          13 Papers
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex max-w-fit items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-300 backdrop-blur-md">
                      <span className="relative flex size-1">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex size-1 rounded-full bg-emerald-400" />
                      </span>
                      Live
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Card 2 — Students count */}
            <motion.div variants={fadeUp} className="mt-2 sm:mt-4 lg:mt-6">
              <div className="group relative h-full overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-card to-card/50 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/[0.04] sm:p-5">
                {/* Neon blur radial background */}
                <div className="absolute -right-10 -top-10 -z-10 size-24 rounded-full bg-primary/10 blur-xl transition-all group-hover:bg-primary/20" />
                <div className="absolute -right-6 -top-6 size-16 rounded-full border border-primary/[0.06] sm:size-20" />

                <div className="relative flex h-full flex-col justify-between gap-3 sm:gap-4">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-inner transition-colors group-hover:from-primary/35">
                    <Users className="size-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xl font-bold tracking-tight text-foreground sm:text-2xl md:text-3xl">
                      <Counter target={500} suffix="+" />
                    </p>
                    <p className="text-[10px] font-semibold text-muted-foreground sm:text-xs">
                      Enrolled Students
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Card 3 — Pass rate */}
            <motion.div variants={fadeUp}>
              <div className="group relative h-full overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-card to-card/50 p-4 transition-all hover:-translate-y-0.5 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/[0.04] sm:p-5">
                {/* Neon blur radial background */}
                <div className="absolute -right-10 -top-10 -z-10 size-24 rounded-full bg-emerald-500/10 blur-xl transition-all group-hover:bg-emerald-500/20" />
                <div className="absolute -right-6 -top-6 size-16 rounded-full border border-emerald-500/[0.06] sm:size-20" />

                <div className="relative flex h-full flex-col justify-between gap-3 sm:gap-4">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 shadow-inner transition-colors group-hover:from-emerald-500/35">
                    <Trophy className="size-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xl font-bold tracking-tight text-foreground sm:text-2xl md:text-3xl">
                      <Counter target={98} suffix="%" />
                    </p>
                    <p className="text-[10px] font-semibold text-muted-foreground sm:text-xs">
                      Exam Pass Rate
                    </p>
                    <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-sm"
                        initial={{ width: 0 }}
                        whileInView={{ width: "95%" }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 1.2,
                          delay: 0.4,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Card 4 — Community / Active */}
            <motion.div variants={fadeUp}>
              <div className="group relative h-full overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.06] to-transparent p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/[0.05] sm:p-5">
                {/* Decorative dynamic glows */}
                <div className="absolute -bottom-8 -right-8 size-20 rounded-full bg-primary/[0.08] blur-xl transition-all group-hover:scale-110" />

                <div className="relative flex h-full flex-col justify-between gap-3 sm:gap-4">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary/25 to-primary/5 shadow-sm transition-colors group-hover:from-primary/40">
                    <Zap className="size-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xl font-bold tracking-tight text-foreground sm:text-2xl md:text-3xl">
                      <Counter target={1} suffix="k+" />
                    </p>
                    <p className="mb-2.5 text-[10px] font-semibold text-muted-foreground sm:text-xs">
                      Active Members
                    </p>
                    <div className="flex -space-x-1.5">
                      {[
                        {
                          src: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100&h=100",
                          fallback: "U1",
                        },
                        {
                          src: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100&h=100",
                          fallback: "U2",
                        },
                        {
                          src: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100",
                          fallback: "U3",
                        },
                      ].map((user, i) => (
                        <Avatar
                          key={i}
                          className="size-6 border-2 border-background ring-1 ring-border/30 sm:size-7"
                        >
                          <AvatarImage src={user.src} />
                          <AvatarFallback className="text-[8px]">
                            {user.fallback}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      <div className="flex size-6 items-center justify-center rounded-full border-2 border-background bg-primary/10 text-[8px] font-bold text-primary ring-1 ring-primary/20 sm:size-7">
                        +99
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* ── Beautiful Laser-Cut Accent Line ── */}
      <div className="relative h-px w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
    </section>
  );
}
