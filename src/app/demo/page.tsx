"use client";

import React, { useState } from "react";
import { Play, CheckCircle2, Clock, ChevronRight, Heart, BookOpen, Star, Users, BarChart2, Share2, PlayCircle, FileText, Download, Key, Smartphone, Award, Zap, MessageSquare, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const curriculum = [
  { id: 1, title: "Introduction to ACCA & Exam Structure", duration: "8:23", completed: true },
  { id: 2, title: "Understanding Financial Statements", duration: "12:11", completed: true },
  { id: 3, title: "Core Accounting Principles – Deep Dive", duration: "18:47", completed: false, active: true },
  { id: 4, title: "Income Statement & Balance Sheet", duration: "15:34", completed: false },
  { id: 5, title: "Cash Flow Statements Explained", duration: "14:09", completed: false },
  { id: 6, title: "Group Accounts & Consolidation", duration: "22:01", completed: false },
  { id: 7, title: "IFRS Standards & Application", duration: "19:55", completed: false },
  { id: 8, title: "Financial Ratios & Performance", duration: "16:30", completed: false },
  { id: 9, title: "Mock Exam Walkthrough – Paper 1", duration: "45:00", completed: false },
  { id: 10, title: "Examiner Report Analysis", duration: "11:20", completed: false },
  { id: 11, title: "Revision Session – Full Paper", duration: "38:50", completed: false },
  { id: 12, title: "Final Tips & Exam Strategy", duration: "9:40", completed: false },
];

export default function DemoPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [savedForLater, setSavedForLater] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const classroomImages = [
    {
      url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800",
      alt: "Student class",
      title: "Interactive Group Sessions",
      desc: "Live weekend masterclasses where students collaborate on complex case studies."
    },
    {
      url: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=800",
      alt: "Expert lecture",
      title: "Expert-Led Deep Dives",
      desc: "Deep dive sessions into ACCA Professional Level subjects with global faculty."
    },
    {
      url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800",
      alt: "Peer collaboration",
      title: "Peer-to-Peer Learning",
      desc: "Students sharing insights and exam strategies in our breakout digital rooms."
    },
    {
      url: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=800",
      alt: "Study resources",
      title: "Comprehensive Resources",
      desc: "Access to high-fidelity study notes and real-time query resolution."
    }
  ];

  React.useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % classroomImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [classroomImages.length]);

  const completedCount = curriculum.filter((c) => c.completed).length;
  const progress = Math.round((completedCount / curriculum.length) * 100);

  return (
    <>

      {/* ─── HERO ─── */}
      <section className="relative pt-24 pb-12 min-h-[380px] flex items-end bg-[#1e1e2d] overflow-hidden">
        {/* Background Image with Gradient Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop"
            alt="Students studying"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a103d]/98 via-[#4c2163]/90 to-[#9d2d44]/80" />
        </div>

        <div className="relative z-10 container mx-auto px-6 max-w-7xl">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-2">
            <div className="max-w-3xl">
              {/* Instructor info */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 shadow-lg bg-indigo-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">EE</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-bold tracking-wider uppercase text-xs">Evoke Academy</span>
                  <span className="text-white/60 text-[11px]">Updated April 2024</span>
                </div>
              </div>

              {/* Course Title */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-6 tracking-tight leading-[1.05]">
                LMS Demo: Professional <br className="hidden md:block" /> ACCA Experience
              </h1>

              {/* Ratings */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <span className="text-white/90 text-sm font-semibold">(1,240 Ratings)</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-6 lg:mb-1">
              <button className="flex items-center gap-2 text-white/80 hover:text-white transition-all group">
                <Heart className="w-5 h-5 group-hover:fill-white transition-all" />
                <span className="font-bold text-sm">Wishlist</span>
              </button>
              <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-all shadow-xl active:scale-95">
                <Share2 className="w-4 h-4" />
                <span className="font-bold text-xs uppercase tracking-widest">Share</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── VIDEO PLAYER SECTION ─── */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">

            {/* Left: Video Player */}
            <div>
              {/* Video frame */}
              <div className="relative bg-slate-900 w-full overflow-hidden" style={{ aspectRatio: "16/9" }}>
                <img
                  src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1400"
                  alt="Demo lecture preview"
                  className="w-full h-full object-cover opacity-70"
                />

                {/* Play button overlay */}
                {!isPlaying && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
                    <button
                      onClick={() => setIsPlaying(true)}
                      className="group flex flex-col items-center gap-4 transition-all"
                    >
                      <div className="w-24 h-24 bg-white flex items-center justify-center hover:scale-110 transition-transform shadow-2xl relative">
                        <Play className="w-10 h-10 text-indigo-600 ml-1" fill="currentColor" />
                        <div className="absolute -inset-2 border border-white/30 animate-pulse" />
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-white font-black text-xl uppercase tracking-[0.2em]">Start Demo Lecture</span>
                        <span className="px-4 py-1.5 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-widest">No Sign-in Required</span>
                      </div>
                    </button>
                  </div>
                )}

                {isPlaying && (
                  <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                    <iframe
                      src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                      className="w-full h-full border-none"
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                    />
                  </div>
                )}

                {/* Bottom progress bar */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-5 py-4">
                  <div className="flex items-center gap-3 mb-2">
                    <button onClick={() => setIsPlaying(!isPlaying)} className="text-white hover:text-sky-400 transition-colors">
                      <Play className="w-5 h-5" fill="currentColor" />
                    </button>
                    <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-sky-400 rounded-full" style={{ width: "35%" }} />
                    </div>
                    <span className="text-xs text-white/70 font-mono">16:45 / 45:32</span>
                  </div>
                </div>
              </div>

              {/* Below video: title + tag */}
              <div className="bg-white border border-slate-100 py-5 px-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">
                  Core Accounting Principles – ACCA Financial Accounting (FA)
                </h2>
                <span className="flex-shrink-0 ml-4 px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Advanced
                </span>
              </div>

              {/* Tags row */}
              <div className="flex items-center gap-3 mt-3 mb-8">
                {["Advanced", "Live Class", "12 Lessons"].map((tag) => (
                  <span key={tag} className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200">
                    {tag}
                  </span>
                ))}
              </div>

              {/* ── Stats Bar ── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                {[
                  { icon: <Star className="w-4 h-4 text-amber-400" fill="currentColor" />, value: "4.9", label: "Rating" },
                  { icon: <Users className="w-4 h-4 text-indigo-500" />, value: "6,200+", label: "Students" },
                  { icon: <BookOpen className="w-4 h-4 text-sky-500" />, value: "12", label: "Lessons" },
                  { icon: <Clock className="w-4 h-4 text-emerald-500" />, value: "9h 40m", label: "Total" },
                ].map((s) => (
                  <div key={s.label} className="flex flex-col items-start gap-1 px-4 py-3 bg-white border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2">
                      {s.icon}
                      <span className="text-lg font-black text-slate-900">{s.value}</span>
                    </div>
                    <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">{s.label}</span>
                  </div>
                ))}
              </div>

              {/* ── Description ── */}
              <div className="border-t border-slate-100 pt-6 mb-6">
                <p className="text-slate-600 leading-relaxed text-sm">
                  Experience our high-performance LMS designed for ACCA success. Track progress in real-time and access expert-led curriculum through a seamless, data-driven interface.
                </p>
              </div>

              {/* ── What you'll learn ── */}
              <div className="border-t border-slate-100 pt-7 mb-8">
                <h3 className="text-lg font-bold text-slate-900 mb-5">What you&apos;ll learn</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    "Prepare and interpret complete financial statements",
                    "Apply double-entry bookkeeping with precision",
                    "Understand IFRS and IAS standards in depth",
                    "Analyse financial performance using key ratios",
                    "Navigate group accounts and consolidation",
                    "Tackle past papers with examiner-level insight",
                    "Build a structured revision strategy for exam day",
                    "Master cash flow statements from scratch",
                  ].map((point) => (
                    <div key={point} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700 leading-snug">{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Topic Cards ── */}
              <div className="border-t border-slate-100 pt-7">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {[
                    {
                      title: "Adaptive Learning Technology",
                      desc: "Experience how our LMS tracks your strength and weakness zones in real-time, providing a personalized learning path for every ACCA module.",
                      color: "border-t-indigo-500",
                    },
                    {
                      title: "Expert-Led Interactive Sessions",
                      desc: "Beyond static videos, engage with mock exams, interactive quizzes, and live examiner report analysis session demos.",
                      color: "border-t-sky-500",
                    },
                  ].map((topic) => (
                    <div key={topic.title} className={`border border-slate-100 border-t-2 ${topic.color} p-5 bg-white shadow-sm hover:shadow-md transition-shadow`}>
                      <h4 className="text-[15px] font-bold text-slate-900 mb-2">{topic.title}</h4>
                      <p className="text-sm text-slate-500 leading-relaxed">{topic.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Course Sidebar */}
            <div className="flex flex-col gap-6 sticky top-24">

              {/* ── Premium CTA Card ── */}
              <div className="bg-white border-t-4 border-t-indigo-600 border-x border-b border-slate-200 p-6 shadow-lg shadow-slate-200/50 relative overflow-hidden group">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-slate-500 font-bold text-sm uppercase tracking-wider">Access</span>
                    <span className="text-3xl font-black text-indigo-600">FREE</span>
                  </div>
                  <button className="w-full py-4 bg-indigo-600 text-white font-bold text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-[0.98] flex items-center justify-center gap-2 mb-3">
                    <PlayCircle className="w-5 h-5" />
                    Start Demo Lecture
                  </button>
                  <p className="text-[11px] text-center text-slate-400 font-medium">No credit card or sign-up required</p>
                </div>
              </div>

              {/* ── Demo Highlights Card ── */}
              <div className="bg-white border border-slate-200 p-8 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 uppercase tracking-tight">
                  <div className="w-1.5 h-5 bg-indigo-500" />
                  Demo Highlights
                </h3>
                <div className="flex flex-col gap-5">
                  {[
                    { icon: <PlayCircle className="w-5 h-5" />, text: "HD 4K Video Quality", color: "text-blue-500", bg: "bg-blue-50" },
                    { icon: <FileText className="w-5 h-5" />, text: "Full Syllabus Access", color: "text-indigo-500", bg: "bg-indigo-50" },
                    { icon: <Download className="w-5 h-5" />, text: "Sample Study Notes", color: "text-emerald-500", bg: "bg-emerald-50" },
                    { icon: <Key className="w-5 h-5" />, text: "LMS Portal Preview", color: "text-amber-500", bg: "bg-amber-50" },
                    { icon: <Smartphone className="w-5 h-5" />, text: "Cross-Device Syncing", color: "text-purple-500", bg: "bg-purple-50" },
                    { icon: <Award className="w-5 h-5" />, text: "Global Certification", color: "text-rose-500", bg: "bg-rose-50" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 group cursor-default">
                      <div className={`w-10 h-10 ${item.bg} ${item.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        {item.icon}
                      </div>
                      <span className="text-[14px] text-slate-700 font-bold uppercase tracking-tight">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── LMS Features Card ── */}
              <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">LMS Intelligence</h3>
                </div>
                <div className="flex flex-col">
                  {[
                    { label: "Architecture", value: "Adaptive Learning" },
                    { label: "Analytics", value: "Real-time Tracking" },
                    { label: "Content Type", value: "Modular Video" },
                    { label: "Testing", value: "AI Mock Exams" },
                    { label: "Support", value: "24/7 Expert Help" },
                    { label: "Compliance", value: "ACCA Standard" },
                  ].map((feature, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between px-8 py-4 text-[13px] ${i !== 5 ? "border-b border-slate-50" : ""
                        }`}
                    >
                      <span className="text-slate-500 font-semibold uppercase text-[11px] tracking-wider">{feature.label}</span>
                      <span className="text-slate-900 font-bold">{feature.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Course Tags Card ── */}
              <div className="bg-white border border-slate-200 p-8 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6 uppercase tracking-tight">Expertise Focus</h3>
                <div className="flex flex-wrap gap-2">
                  {["LMS DEMO", "ADAPTIVE", "ACCA", "FINANCE", "TECH"].map((tag) => (
                    <span
                      key={tag}
                      className="px-4 py-1.5 bg-indigo-50/50 border border-indigo-100 text-[10px] font-black text-indigo-600 tracking-widest hover:bg-indigo-600 hover:text-white transition-all cursor-default"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ─── COMPACT STUDENT SATISFACTION DASHBOARD ─── */}
      <section className="py-16 bg-background border-t border-border">
        <div className="container mx-auto px-4 max-w-7xl">

          <div className="mb-10">
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight mb-2">Student Satisfaction</h2>
            <p className="text-muted-foreground text-sm font-semibold uppercase tracking-wider">Live Learning Community Insights</p>
          </div>

          {/* Unified Satisfaction Container */}
          <Card className="overflow-hidden border-border/50 shadow-sm">
            {/* Top Row: Ratings Breakdown (Compact) */}
            <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr_350px] divide-y lg:divide-y-0 lg:divide-x divide-border border-b border-border">
              {/* Overall Rating */}
              <div className="p-6 flex flex-col justify-center">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Overall Rating</h3>
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-primary text-primary-foreground px-4 py-2 rounded-md flex items-center gap-2 font-black text-3xl shadow-sm">
                    <Star className="w-6 h-6 fill-primary-foreground" />
                    4.9
                  </div>
                  <span className="text-muted-foreground font-bold text-xl">/ 5</span>
                </div>
                <p className="text-xs text-muted-foreground font-medium mt-1">1,240 Verified Reviews</p>
                <div className="mt-4 flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-tight">
                  <BarChart2 className="w-4 h-4" />
                  <span>+12% Industry Avg</span>
                </div>
              </div>

              {/* Rating Distribution */}
              <div className="p-6">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Rating Distribution</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                  {[
                    { star: 5, pct: 79, count: 982 },
                    { star: 4, pct: 15, count: 184 },
                    { star: 3, pct: 3, count: 42 },
                    { star: 2, pct: 2, count: 20 },
                    { star: 1, pct: 1, count: 12 },
                  ].map((row) => (
                    <div key={row.star} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-muted-foreground w-3">{row.star}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden relative">
                        <div className="absolute inset-y-0 left-0 bg-primary rounded-full" style={{ width: `${row.pct}%` }} />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground w-16 text-right">{row.count} ({row.pct}%)</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category Ratings */}
              <div className="p-6 bg-muted/30">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Category Ratings</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                  {[
                    { label: "Content", val: "4.9" },
                    { label: "LMS UX", val: "5.0" },
                    { label: "Support", val: "4.8" },
                    { label: "Exam Prep", val: "4.9" },
                  ].map((cat) => (
                    <div key={cat.label} className="flex items-center justify-between gap-2 p-2 rounded bg-background border border-border/50 shadow-sm">
                      <span className="text-xs font-semibold text-muted-foreground">{cat.label}</span>
                      <div className="flex items-center gap-1 text-primary">
                        <Star className="w-3 h-3 fill-primary" />
                        <span className="text-sm font-bold">{cat.val}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="link" className="mt-4 px-0 text-xs font-bold uppercase tracking-wider text-primary hover:underline h-auto">
                  Detailed Trends →
                </Button>
              </div>
            </div>

            {/* Bottom Row: Insights & Photo Carousel */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] divide-y lg:divide-y-0 lg:divide-x divide-border">
              {/* Insights Card */}
              <div className="flex flex-col bg-background">
                <div className="p-6 border-b border-border bg-muted/20">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-tight">Student Experience Insights</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Clock className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-bold text-foreground uppercase tracking-tight">Self-Paced</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed italic">&quot;Miles ahead of traditional classroom learning. Revisit modules anytime.&quot;</p>
                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest bg-muted/50">94% Positive sentiment</Badge>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Zap className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-bold text-foreground uppercase tracking-tight">Live Support</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed italic">&quot;Integrated support directly in the player. Resolution is instant.&quot;</p>
                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest bg-muted/50">88% Reported success</Badge>
                  </div>
                </div>
              </div>

              {/* Automated Photo Carousel Card */}
              <div className="relative group bg-black overflow-hidden min-h-[350px]">
                {/* Carousel Content */}
                {classroomImages.map((img, idx) => (
                  <div
                    key={idx}
                    className={`absolute inset-0 transition-all duration-1000 ease-in-out ${idx === activeSlide ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"
                      }`}
                  >
                    <img
                      src={img.url}
                      alt={img.alt}
                      className="w-full h-full object-cover opacity-60"
                    />
                  </div>
                ))}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                {/* Carousel Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge className="bg-primary text-primary-foreground border-none font-bold text-[10px] uppercase tracking-widest">
                      <Users className="w-3 h-3 mr-1 inline-block" /> Live Demo
                    </Badge>
                  </div>
                  <h4 className="text-white font-bold text-xl mb-2 leading-tight">
                    {classroomImages[activeSlide].title}
                  </h4>
                  <p className="text-white/70 text-xs mb-6 font-medium">
                    {classroomImages[activeSlide].desc}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {classroomImages.map((_, i) => (
                        <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === activeSlide ? "bg-white w-6" : "bg-white/30 w-2"}`} />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveSlide((prev) => (prev - 1 + classroomImages.length) % classroomImages.length)}
                        className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center text-white hover:bg-white/20 transition-colors backdrop-blur-sm"
                      >
                        <ChevronRight className="w-4 h-4 rotate-180" />
                      </button>
                      <button
                        onClick={() => setActiveSlide((prev) => (prev + 1) % classroomImages.length)}
                        className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center text-white hover:bg-white/20 transition-colors backdrop-blur-sm"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

        </div>
      </section>

      {/* ─── ADD A REVIEW SECTION ─── */}
      <section className="relative py-24 bg-muted/30 border-t border-border overflow-hidden">
        <div className="relative z-10 container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-12 lg:gap-16 items-start">

            {/* Left: Copy & Context */}
            <div className="lg:sticky lg:top-24">
              <Badge className="mb-6 px-3 py-1 font-bold text-xs uppercase tracking-widest bg-primary text-primary-foreground border-none">
                Your Feedback Matters
              </Badge>
              <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-6 leading-tight tracking-tight">
                Help Us Refine the <br /> <span className="text-primary">Learning Experience</span>
              </h2>
              <p className="text-muted-foreground font-medium leading-relaxed mb-10 text-lg">
                Every review helps our engineering team optimize the LMS for future ACCA aspirants. Share your thoughts on platform performance, video quality, and overall accessibility.
              </p>

              <div className="space-y-8">
                {[
                  { label: "Engineering Transparency", desc: "We review every technical report and UX suggestion to improve the platform." },
                  { label: "Community Driven", desc: "90% of our new LMS features come from direct student feedback." },
                ].map((item) => (
                  <div key={item.label} className="flex gap-4 p-4 rounded-xl bg-background border border-border shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-foreground mb-1">{item.label}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Review Form Card */}
            <Card className="shadow-xl border-border/50 relative overflow-hidden bg-background">
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 -mr-20 -mt-20 rounded-full blur-3xl pointer-events-none" />

              <CardContent className="p-8 md:p-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  {/* Form Fields */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Full Name</Label>
                      <Input
                        type="text"
                        placeholder="e.g. John Doe"
                        className="h-12 bg-muted/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Reviewed Module / Course</Label>
                      <Select>
                        <SelectTrigger className="h-12 bg-muted/50">
                          <SelectValue placeholder="Select Module" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fa">ACCA Financial Accounting (FA)</SelectItem>
                          <SelectItem value="ma">ACCA Management Accounting (MA)</SelectItem>
                          <SelectItem value="lw">ACCA Corporate & Business Law (LW)</SelectItem>
                          <SelectItem value="pm">ACCA Performance Management (PM)</SelectItem>
                          <SelectItem value="master">Professional Level Masterclass</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Rate Your LMS Experience</Label>
                      <div className="flex items-center gap-1 p-2 rounded-lg bg-muted/50 border border-border/50 inline-flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setUserRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="p-1 transition-transform hover:scale-110 focus:outline-none"
                          >
                            <Star
                              className={`w-7 h-7 ${star <= (hoverRating || userRating)
                                ? "fill-primary text-primary"
                                : "text-muted-foreground/30 fill-transparent"
                                }`}
                            />
                          </button>
                        ))}
                        <span className="ml-3 px-2 py-1 bg-background rounded text-sm font-bold text-foreground min-w-[3rem] text-center shadow-sm">
                          {userRating > 0 ? `${userRating}.0` : "-"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Categories & Textarea */}
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Quick Feedback Tags</Label>
                      <div className="flex flex-wrap gap-2">
                        {["Lightning Fast", "Practical Examples", "Syllabus Depth", "Exam Oriented", "Pro Notes", "Crystal Clear Video"].map((tag) => (
                          <Badge 
                            key={tag} 
                            variant="secondary" 
                            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors py-1.5 px-3 font-semibold"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Your Detailed Review</Label>
                      <Textarea
                        placeholder="Tell us about the interface, speed, and content depth..."
                        className="min-h-[140px] resize-none bg-muted/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.6)]" />
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Awaiting Verification</span>
                  </div>
                  <Button size="lg" className="w-full sm:w-auto h-12 px-8 font-bold gap-2 text-sm shadow-md">
                    Submit Review
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </section>

    </>
  );
}
