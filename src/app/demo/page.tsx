"use client";

import React, { useState } from "react";
import { Play, CheckCircle2, Clock, ChevronRight, Heart, BookOpen, Star, Users, BarChart2, Share2, PlayCircle, FileText, Download, Key, Smartphone, Award, Zap, MessageSquare, Send } from "lucide-react";

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
                  { icon: <Star className="w-4 h-4 text-amber-400" fill="currentColor" />, value: "4.9",   label: "Rating" },
                  { icon: <Users className="w-4 h-4 text-indigo-500" />,                  value: "6,200+", label: "Students" },
                  { icon: <BookOpen className="w-4 h-4 text-sky-500" />,                  value: "12",     label: "Lessons" },
                  { icon: <Clock className="w-4 h-4 text-emerald-500" />,                 value: "9h 40m", label: "Total" },
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
                      className={`flex items-center justify-between px-8 py-4 text-[13px] ${
                        i !== 5 ? "border-b border-slate-50" : ""
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
      <section className="py-16 bg-white border-t border-slate-100">
        <div className="container mx-auto px-4 max-w-7xl">
          
          <div className="mb-10">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-1">Student Satisfaction</h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">Live Learning Community Insights</p>
          </div>

          {/* Unified Satisfaction Container */}
          <div className="border border-slate-200 overflow-hidden">
            
            {/* Top Row: Ratings Breakdown (Compact) */}
            <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr_350px] divide-y lg:divide-y-0 lg:divide-x divide-slate-100 border-b border-slate-100">
              
              {/* Overall Rating */}
              <div className="p-6 flex flex-col justify-center">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Overall Rating</h3>
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-indigo-600 text-white px-3 py-1 flex items-center gap-1.5 font-black text-2xl">
                    <Star className="w-5 h-5 fill-white" />
                    4.9
                  </div>
                  <span className="text-slate-400 font-bold text-lg">/ 5</span>
                </div>
                <p className="text-[10px] text-slate-500 font-bold">1,240 Verified Reviews</p>
                <div className="mt-4 flex items-center gap-2 text-indigo-600 font-black text-[11px] uppercase tracking-tight">
                  <BarChart2 className="w-3 h-3" />
                  <span>+12% Industry Avg</span>
                </div>
              </div>

              {/* Rating Distribution */}
              <div className="p-6">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Rating Distribution</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                  {[
                    { star: 5, pct: 79, count: 982 },
                    { star: 4, pct: 15, count: 184 },
                    { star: 3, pct: 3, count: 42 },
                    { star: 2, pct: 2, count: 20 },
                    { star: 1, pct: 1, count: 12 },
                  ].map((row) => (
                    <div key={row.star} className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-slate-500 w-2">{row.star}</span>
                      <div className="flex-1 h-1 bg-slate-100 relative">
                        <div className="absolute inset-y-0 left-0 bg-slate-900" style={{ width: `${row.pct}%` }} />
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 w-12 text-right">{row.count} ({row.pct}%)</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category Ratings */}
              <div className="p-6 bg-slate-50/30">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Category Ratings</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  {[
                    { label: "Content", val: "4.9" },
                    { label: "LMS UX", val: "5.0" },
                    { label: "Support", val: "4.8" },
                    { label: "Exam Prep", val: "4.9" },
                  ].map((cat) => (
                    <div key={cat.label} className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-indigo-600">
                        <Star className="w-3 h-3 fill-current" />
                        <span className="text-xs font-black">{cat.val}</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{cat.label}</span>
                    </div>
                  ))}
                </div>
                <button className="mt-4 text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Detailed Trends →</button>
              </div>

            </div>

            {/* Bottom Row: Insights & Photo Carousel */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
              
              {/* Insights Card */}
              <div className="flex flex-col">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Student Experience Insights</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <Clock className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-black text-slate-800 uppercase tracking-tight">Self-Paced</span>
                    </div>
                    <p className="text-[13px] text-slate-600 leading-relaxed italic font-medium">&quot;Miles ahead of traditional classroom learning. Revisit modules anytime.&quot;</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">94% Positive sentiment</p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <Zap className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-black text-slate-800 uppercase tracking-tight">Live Support</span>
                    </div>
                    <p className="text-[13px] text-slate-600 leading-relaxed italic font-medium">&quot;Integrated support directly in the player. Resolution is instant.&quot;</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">88% Reported success</p>
                  </div>
                </div>
              </div>

              {/* Automated Photo Carousel Card */}
              <div className="relative group bg-slate-900 overflow-hidden min-h-[350px]">
                {/* Carousel Content */}
                {classroomImages.map((img, idx) => (
                  <div 
                    key={idx}
                    className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                      idx === activeSlide ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"
                    }`}
                  >
                    <img 
                      src={img.url} 
                      alt={img.alt}
                      className="w-full h-full object-cover opacity-60"
                    />
                  </div>
                ))}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                {/* Carousel Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-indigo-600 flex items-center justify-center text-white">
                      <Users className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Live Classroom Demo</span>
                  </div>
                  <h4 className="text-white font-black text-lg mb-1 leading-tight uppercase">
                    {classroomImages[activeSlide].title}
                  </h4>
                  <p className="text-white/60 text-[10px] mb-5">
                    {classroomImages[activeSlide].desc}
                  </p>
                  
                  <div className="flex items-center justify-between">
                     <div className="flex gap-1.5">
                       {classroomImages.map((_, i) => (
                         <div key={i} className={`w-1.5 h-1.5 transition-all duration-500 ${i === activeSlide ? "bg-white w-4" : "bg-white/20"}`} />
                       ))}
                     </div>
                     <div className="flex gap-2">
                        <button 
                          onClick={() => setActiveSlide((prev) => (prev - 1 + classroomImages.length) % classroomImages.length)}
                          className="w-7 h-7 border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                        >
                          <ChevronRight className="w-3 h-3 rotate-180" />
                        </button>
                        <button 
                          onClick={() => setActiveSlide((prev) => (prev + 1) % classroomImages.length)}
                          className="w-7 h-7 border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                        >
                          <ChevronRight className="w-3 h-3" />
                        </button>
                     </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ─── ADD A REVIEW SECTION ─── */}
      <section className="relative py-24 bg-slate-900 overflow-hidden">
        {/* Background Photo Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop" 
            alt="Classroom background"
            className="w-full h-full object-cover opacity-20 grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900/95 to-indigo-900/90" />
        </div>

        <div className="relative z-10 container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-16 items-start">
            
            {/* Left: Copy & Context */}
            <div className="text-white lg:sticky lg:top-24">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest mb-6">
                Your Feedback Matters
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-6 leading-tight uppercase tracking-tight">
                Help Us Refine the <br /> <span className="text-indigo-400">Learning Experience</span>
              </h2>
              <p className="text-white/60 font-medium leading-relaxed mb-8">
                Every review helps our engineering team optimize the LMS for future ACCA aspirants. Share your thoughts on platform performance, video quality, and overall accessibility.
              </p>
              
              <div className="space-y-6">
                {[
                  { label: "Engineering Transparency", desc: "We review every technical report and UX suggestion." },
                  { label: "Community Driven", desc: "90% of our new LMS features come from student feedback." },
                ].map((item) => (
                  <div key={item.label} className="flex gap-4">
                    <div className="w-10 h-10 bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white uppercase tracking-tight mb-1">{item.label}</h4>
                      <p className="text-xs text-white/40 font-medium leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Review Form Card */}
            <div className="bg-white border border-slate-200 shadow-xl shadow-slate-200/50 p-8 md:p-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 -mr-16 -mt-16 rotate-45 pointer-events-none" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                
                {/* Form Fields */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Full Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. John Doe"
                      className="w-full h-12 border border-slate-200 px-4 text-sm font-medium focus:outline-none focus:border-indigo-600 transition-colors placeholder:text-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Reviewed Module / Course</label>
                    <select 
                      className="w-full h-12 border border-slate-200 px-4 text-sm font-medium focus:outline-none focus:border-indigo-600 transition-colors bg-white"
                    >
                      <option>Select Module</option>
                      <option>ACCA Financial Accounting (FA)</option>
                      <option>ACCA Management Accounting (MA)</option>
                      <option>ACCA Corporate & Business Law (LW)</option>
                      <option>ACCA Performance Management (PM)</option>
                      <option>Professional Level Masterclass</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Rate Your LMS Experience</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setUserRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="transition-all"
                        >
                          <Star 
                            className={`w-8 h-8 ${
                              star <= (hoverRating || userRating) 
                                ? "fill-indigo-600 text-indigo-600" 
                                : "text-slate-200 fill-transparent"
                            }`} 
                          />
                        </button>
                      ))}
                      <span className="ml-2 text-sm font-black text-slate-900">{userRating > 0 ? `${userRating}.0` : ""}</span>
                    </div>
                  </div>
                </div>

                {/* Categories & Textarea */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Quick Feedback Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {["Lightning Fast", "Practical Examples", "Syllabus Depth", "Exam Oriented", "Pro Notes", "Crystal Clear Video"].map((tag) => (
                        <button key={tag} className="px-3 py-1.5 border border-slate-100 bg-slate-50 text-[9px] font-black text-slate-500 uppercase tracking-wider hover:border-indigo-600 hover:text-indigo-600 transition-all">
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Your Detailed Review</label>
                    <textarea 
                      placeholder="Tell us about the interface, speed, and content depth..."
                      className="w-full h-32 border border-slate-200 p-4 text-sm font-medium focus:outline-none focus:border-indigo-600 transition-colors resize-none placeholder:text-slate-300"
                    />
                  </div>
                </div>

              </div>

              <div className="mt-10 pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Awaiting Verification</span>
                </div>
                <button className="px-10 py-4 bg-indigo-600 text-white font-black text-[11px] uppercase tracking-[0.2em] hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100 flex items-center gap-3 active:scale-95 group">
                  Submit Review
                  <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

    </>
  );
}
