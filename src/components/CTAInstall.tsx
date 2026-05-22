"use client";


import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Download,
  Users,
  Star,
  BookOpen,
  PlayCircle,
  TrendingUp,
  ArrowLeft,
  Bookmark,
  GraduationCap,
  Play,
  ArrowRight,
  Sparkles,
  MessageSquare,
  CheckCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { motion } from "motion/react";

/* ─── Animated Counter Hook ─── */
function useCounter(end: number, duration: number = 2000, startCounting: boolean = false) {
  const [count, setCount] = useState(0);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!startCounting || hasRun.current) return;
    hasRun.current = true;

    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // Ease-out cubic
      setCount(Math.round(eased * end));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [end, duration, startCounting]);

  return count;
}

const stats = [
  { icon: Download, numericValue: 2.5, suffix: "M+", label: "Downloads", accent: "from-violet-500/10 to-purple-600/10" },
  { icon: Users, numericValue: 850, suffix: "K+", label: "Active Learners", accent: "from-blue-500/10 to-cyan-500/10" },
  { icon: Star, numericValue: 4.9, suffix: "/5", label: "Average Rating", isDecimal: true, accent: "from-amber-500/10 to-orange-500/10" },
  { icon: BookOpen, numericValue: 1200, suffix: "+", label: "Courses Offered", accent: "from-emerald-500/10 to-teal-500/10" },
];

export default function CTAInstall() {

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (
      typeof window !== "undefined" &&
      (window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone)
    ) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    }

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      toast.success("App installed successfully! Thank you!");
    };

    if (typeof window !== "undefined") {
      window.addEventListener("appinstalled", handleAppInstalled);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.removeEventListener("appinstalled", handleAppInstalled);
      }
    };
  }, []);

  const handleInstallClick = async () => {
    if (isInstalled) {
      toast.info("EvokeNext LMS is already installed as a PWA!");
      return;
    }

    if (!deferredPrompt) {
      // Check if it's iOS Safari
      const isIOS =
        /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      const isSafari =
        /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

      if (isIOS && isSafari) {
        toast.info(
          "To install: Tap the Share button at the bottom of Safari, then select 'Add to Home Screen' 📲",
          { duration: 6000 }
        );
      } else {
        toast.info(
          "PWA installation is ready! If you don't see the prompt, check your browser's address bar for an install icon (⊕) or menu option.",
          { duration: 6000 }
        );
      }
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        toast.success("PWA install accepted!");
        setIsInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
      } else {
        toast.warning("PWA install dismissed.");
      }
    } catch (err) {
      console.error("Installation failed:", err);
      toast.error("An error occurred during installation.");
    }
  };

  return (
    <section className="w-full bg-background relative overflow-hidden border-t border-border/40 py-24 md:py-32">
      {/* Cinematic Backdrops */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-primary/[0.03] rounded-full blur-[130px]" />
        <div className="absolute bottom-12 right-1/4 w-[600px] h-[400px] bg-violet-500/[0.02] rounded-full blur-[110px]" />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="w-full max-w-6xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-12 items-center">

          {/* Left Column — Stunning Phone Mockup with scroll animation */}
          <motion.div
            initial={{ opacity: 0, x: -40, scale: 0.95 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 order-2 lg:order-1 flex justify-center lg:justify-start"
          >
            <MockPhone />
          </motion.div>

          {/* Right Column — Professional Editorial Content with scroll animation */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            onViewportEnter={() => setStartStatsCount(true)}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 order-1 lg:order-2 flex flex-col gap-6 lg:pl-6"
          >
            {/* Elegant Tagline */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex items-center gap-2.5"
            >
              <Sparkles className="size-4 text-primary animate-pulse" />
              <span className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-primary">
                Evokenxt Learning Platform
              </span>
            </motion.div>

            {/* Premium Heading */}
            <h2 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold text-foreground leading-[1.05] tracking-tight">
              Empowering Minds,
              <br />
              <span className="relative inline-block mt-1">
                <span className="text-primary">Transforming Futures</span>
                <motion.span
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute -bottom-1.5 left-0 right-0 h-[3px] bg-gradient-to-r from-primary to-violet-500 origin-left"
                />
              </span>
            </h2>

            {/* Description */}
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-lg font-medium">
              Access the ultimate portal to world-class business and financial learning. Combine structured expert courses, custom AI analytics, and a thriving community of peers.
            </p>

            {/* Grid Stats with staggered animation */}
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: { staggerChildren: 0.12, delayChildren: 0.2 },
                },
              }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4"
            >
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  variants={{
                    hidden: { opacity: 0, y: 20, scale: 0.95 },
                    show: { opacity: 1, y: 0, scale: 1 }
                  }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <StatCard
                    icon={stat.icon}
                    numericValue={stat.numericValue}
                    suffix={stat.suffix}
                    label={stat.label}
                    isDecimal={stat.isDecimal}
                    accent={stat.accent}
                    startCount={startStatsCount}
                    index={i}
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap gap-4 pt-6 border-t border-border/40 mt-4"
            >
              <Button
                size="lg"   
                className="h-13 px-8 font-bold rounded-none text-base group shadow-lg shadow-primary/10 hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
                asChild
              >
                <Link href="/courses">
                  Start Free Trial
                  <ArrowRight className="ml-2 size-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-13 px-8 font-bold rounded-none border-white/10 hover:border-primary/40 text-foreground bg-white/[0.02] hover:bg-white/[0.06] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
              >
                <PlayCircle className="mr-2 size-5" />
                Watch Demo
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export function MockPhone() {
  const chatMessages = [
    { name: "Sarah Miller", msg: "Great course content!", time: "9:00AM", unread: 1, color: "bg-violet-500" },
    { name: "John Davis", msg: "When is the next live session?", time: "10:00PM", unread: 3, color: "bg-blue-500" },
    { name: "Emma Wilson", msg: "Thanks for the support!", time: "8:30AM", unread: 0, color: "bg-emerald-500" },
    { name: "Alex Chen", msg: "Module 3 was incredible", time: "5:50AM", unread: 2, color: "bg-amber-500" },
  ];

  return (
    <div className="relative w-full max-w-sm select-none" aria-hidden="true">
      {/* Decorative Outer Glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-violet-500/10 rounded-[2.8rem] blur-2xl -z-10" />

      {/* Floating Card: Active Learners + mini chart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85, x: -30, y: 10 }}
        whileInView={{ opacity: 1, scale: 1, x: 0, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="absolute -top-8 -left-4 sm:-left-10 z-20 bg-zinc-900/90 backdrop-blur-xl rounded-none border border-white/[0.08] p-4 w-36 sm:w-44 shadow-2xl shadow-black/40 hover:border-primary/30 transition-all duration-300"
      >
        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-primary" />
          Active Learners
        </p>
        <p className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5 tracking-tight">
          124,500
        </p>

        {/* Real miniature SVG sparkline */}
        <div className="h-8 w-full mt-3 opacity-85">
          <svg className="w-full h-full" viewBox="0 0 100 30" fill="none" preserveAspectRatio="none">
            <path
              d="M0,25 Q15,20 30,12 T60,18 T90,5 L100,2"
              stroke="url(#sparkline-grad)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M0,25 Q15,20 30,12 T60,18 T90,5 L100,2 L100,30 L0,30 Z"
              fill="url(#sparkline-bg)"
              opacity="0.1"
            />
            <defs>
              <linearGradient id="sparkline-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
              <linearGradient id="sparkline-bg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="flex items-center justify-between mt-3 text-[10px] text-emerald-500 font-bold">
          <span>+32% this month</span>
          <span className="text-zinc-500 font-normal">Live</span>
        </div>
      </motion.div>

      {/* Main Phone Device Mockup */}
      <div className="relative mx-auto w-60 sm:w-68 bg-zinc-950 border border-white/[0.08] rounded-[2.6rem] shadow-2xl p-2 z-10">
        <div className="bg-zinc-900/40 rounded-[2.3rem] overflow-hidden min-h-[440px] sm:min-h-[500px] border border-white/[0.04]">

          {/* Dynamic Island / Notch */}
          <div className="bg-zinc-950 h-7 flex items-center justify-center relative">
            <div className="w-20 h-4 bg-zinc-900 rounded-full flex items-center justify-between px-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-700/50" />
              <div className="w-8 h-1 bg-zinc-800 rounded-full" />
              <div className="w-2 h-2 rounded-full bg-primary/40 animate-pulse" />
            </div>
          </div>

          {/* Phone Screen Canvas */}
          <div className="px-3 sm:px-4 pb-4 space-y-4">

            {/* Header Navigation */}
            <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
              <ArrowLeft className="h-4 w-4 text-zinc-400" />
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-300">
                Course Details
              </span>
              <Bookmark className="h-4 w-4 text-zinc-400" />
            </div>

            {/* Course Title and Cover Info */}
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[9px] text-primary font-bold uppercase tracking-wider">
                  EvokeNext LMS
                </p>
                <h4 className="text-sm sm:text-base font-extrabold text-white tracking-tight mt-0.5">
                  UX Design Mastery
                </h4>
                <p className="text-[9px] text-zinc-500 mt-0.5">
                  4.2k active students
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-extrabold text-primary">$49.99</p>
                <Badge className="text-[8px] bg-primary/20 hover:bg-primary/20 text-primary border-none rounded-none py-0 px-1.5 mt-1 font-bold">
                  Bestseller
                </Badge>
              </div>
            </div>

            {/* Video Preview Card */}
            <div className="relative rounded-none border border-white/[0.08] overflow-hidden aspect-video bg-zinc-950 group/preview cursor-pointer">
              <img
                src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400"
                alt="UX Course preview"
                className="w-full h-full object-cover opacity-60 group-hover/preview:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover/preview:bg-black/40 transition-colors">
                <div className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center text-primary group-hover/preview:scale-110 shadow-lg shadow-black/30 transition-all duration-300">
                  <Play className="w-4 h-4 ml-0.5 fill-current" />
                </div>
              </div>
              {/* Playback time overlay */}
              <div className="absolute bottom-2 right-2 bg-black/75 px-1.5 py-0.5 text-[8px] font-bold text-white uppercase tracking-wider">
                12:45 Mins
              </div>
            </div>

            {/* Teacher Row */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-none p-2.5 flex items-center gap-3">
              <Avatar className="h-9 w-9 rounded-none border border-primary/30">
                <AvatarFallback className="bg-primary text-white text-xs font-black rounded-none">
                  JK
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-[10px] font-extrabold text-white">
                  James Korsgaard
                </p>
                <p className="text-[8px] text-zinc-500">
                  Senior Product Designer
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-right">
                <GraduationCap className="h-3 w-3 text-primary" />
                <span className="text-[9px] text-primary font-bold">12 Courses</span>
              </div>
            </div>

            {/* Progress Checklist */}
            <div className="space-y-2">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
                Course Outline
              </p>
              <div className="space-y-1.5">
                {[
                  { name: "Introduction to UX Theory", checked: true },
                  { name: "User Research & Interviews", checked: false },
                  { name: "Wireframing with Figma", checked: false },
                ].map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between text-[9px] py-1 border-b border-white/[0.02]">
                    <div className="flex items-center gap-2">
                      <div className={`w-3.5 h-3.5 rounded-none flex items-center justify-center border ${item.checked ? "border-primary bg-primary/10" : "border-zinc-700 bg-transparent"}`}>
                        {item.checked && <CheckCircle className="w-2.5 h-2.5 text-primary" />}
                      </div>
                      <span className={item.checked ? "text-zinc-400 line-through" : "text-zinc-200 font-medium"}>
                        {item.name}
                      </span>
                    </div>
                    <span className="text-[8px] text-zinc-500">{i === 0 ? "Completed" : "Next up"}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Enroll / Start Learning Action */}
            <div className="bg-primary hover:bg-primary/95 text-white font-extrabold rounded-none py-2 text-center text-[10px] tracking-widest uppercase cursor-pointer hover:shadow-lg hover:shadow-primary/15 transition-all">
              Resume Course
            </div>

          </div>
        </div>
      </div>

      {/* Floating Card: Community Chat Overlay */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85, x: 30, y: 15 }}
        whileInView={{ opacity: 1, scale: 1, x: 0, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-6 -right-4 sm:-right-10 z-20 bg-zinc-900/90 backdrop-blur-xl border border-white/[0.08] w-44 sm:w-52 shadow-2xl shadow-black/40 overflow-hidden rounded-none hover:border-primary/30 transition-all duration-300"
      >
        <div className="bg-white/[0.02] px-3.5 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
          <p className="text-[9px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare className="h-3 w-3 text-primary" />
            Class Feed
          </p>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
        </div>

        <div className="divide-y divide-white/[0.04]">
          {chatMessages.map((chat) => (
            <div key={chat.name} className="flex items-center gap-2.5 px-3 py-2 hover:bg-white/[0.01] transition-colors">
              <Avatar className="h-7 w-7 shrink-0 rounded-none border border-white/[0.08]">
                <AvatarFallback className={`${chat.color} text-white text-[8px] font-black rounded-none`}>
                  {chat.name.split(" ").map((n) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-extrabold text-white truncate">
                    {chat.name}
                  </p>
                  <span className="text-[6.5px] text-zinc-500">{chat.time}</span>
                </div>
                <p className="text-[8px] text-zinc-400 truncate mt-0.5">
                  {chat.msg}
                </p>
              </div>
              {chat.unread > 0 && (
                <div className="h-3.5 min-w-3.5 px-1 text-[7px] font-bold bg-primary text-white rounded-none flex items-center justify-center shrink-0">
                  {chat.unread}
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

interface StatCardProps {
  icon: any;
  numericValue: number;
  suffix: string;
  label: string;
  isDecimal?: boolean;
  accent: string;
  startCount: boolean;
  index: number;
}

export function StatCard({
  icon: Icon,
  numericValue,
  suffix,
  label,
  isDecimal = false,
  accent,
  startCount,
  index,
}: StatCardProps) {
  // Multiply decimals by 10 internally to allow integer count-up animation, then divide back for display
  const targetVal = isDecimal ? Math.round(numericValue * 10) : numericValue;
  const count = useCounter(targetVal, 2200 + index * 100, startCount);
  const displayVal = isDecimal ? (count / 10).toFixed(1) : count.toLocaleString();

  return (
    <div className="relative group cursor-pointer overflow-hidden bg-white/[0.02] backdrop-blur-md border border-white/[0.06] hover:border-primary/30 hover:bg-white/[0.04] transition-all duration-500 p-5 flex items-center gap-4 rounded-none">
      {/* Dynamic Hover Background Gradient Layer */}
      <div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

      {/* Top glowing accent border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-primary/30 transition-all duration-500" />

      {/* Icon Frame */}
      <div className="size-11 shrink-0 rounded-none bg-white/[0.04] border border-white/[0.06] group-hover:bg-primary group-hover:border-primary/50 flex items-center justify-center transition-all duration-500 shadow-md group-hover:shadow-primary/20">
        <Icon className="size-5 text-zinc-400 group-hover:text-white transition-colors duration-500" strokeWidth={1.5} />
      </div>

      {/* Text Values */}
      <div className="relative z-10">
        <p className="text-2xl font-black text-white tracking-tight leading-none group-hover:text-primary transition-colors duration-500">
          {displayVal}
          {suffix}
        </p>
        <p className="text-[10px] font-bold text-zinc-500 group-hover:text-zinc-400 transition-colors uppercase tracking-[0.15em] mt-1.5">
          {label}
        </p>
      </div>
    </div>
  );
}
