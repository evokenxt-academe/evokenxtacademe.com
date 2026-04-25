"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { getCourseBySlug, getRecommendedCourses, type Course } from "@/lib/course-data";
import { motion, AnimatePresence } from "motion/react";
import {
  Star, Clock, BarChart3, Award, Globe, PlayCircle, ChevronDown, ChevronUp,
  Check, BookOpen, Users, Shield, Infinity, ArrowRight, Quote, CheckCircle, Book
} from "lucide-react";

const fadeUp = { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 } };

/* ─── HERO ─── */
function HeroSection({ course }: { course: Course }) {
  return (
    <section className="relative pt-32 pb-20 bg-[#0B1D3A] overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <img src={course.image} alt="" className="w-full h-full object-cover" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B1D3A] via-[#0B1D3A]/90 to-[#0B1D3A]/70" />
      <div className="relative z-10 max-w-[1280px] mx-auto px-6">
        <motion.div {...fadeUp}>
          <div className="flex items-center gap-3 mb-4">
            <span className="w-6 h-[2px] bg-sky-400 inline-block" />
            <span className="text-[11px] font-black uppercase tracking-[0.14em] text-sky-400">{course.category}</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-4">{course.title}</h1>
          <p className="text-lg text-slate-300 max-w-2xl mb-8 leading-relaxed">{course.description}</p>
          <div className="flex flex-wrap items-center gap-6 mb-8">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-sky-500 text-white text-xs font-black flex items-center justify-center">{course.tutorInitials}</div>
              <div>
                <p className="text-sm font-bold text-white">{course.tutor}</p>
                <p className="text-xs text-slate-400">Lead Instructor</p>
              </div>
            </div>
            <span className="w-px h-8 bg-white/10" />
            <div className="flex items-center gap-1.5">
              <div className="flex text-[#FFB800]">
                {[...Array(5)].map((_, i) => <Star key={i} className={`w-4 h-4 ${i < course.rating ? "fill-current" : ""}`} />)}
              </div>
              <span className="text-sm text-slate-300 font-semibold">{course.rating}.0</span>
            </div>
            <span className="w-px h-8 bg-white/10" />
            <span className="text-sm text-slate-300"><Users className="w-4 h-4 inline mr-1.5" />{course.students} students</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="px-8 py-3.5 bg-sky-600 hover:bg-sky-500 text-white text-sm font-black uppercase tracking-widest transition-all hover:scale-105">Enroll Now — ${course.price}</button>
            <button className="px-8 py-3.5 border border-white/15 bg-white/5 hover:bg-white/10 text-white text-sm font-bold uppercase tracking-widest transition-colors">Preview Course</button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── MAIN CONTENT (SPLIT LAYOUT) ─── */
function MainContentSection({ course }: { course: Course }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="py-20 bg-[#0E1628]">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="grid lg:grid-cols-[380px_1fr] gap-12 items-start">
          
          {/* LEFT: CURRICULUM ACCORDION */}
          <div className="bg-[#101726] border border-white/5 overflow-hidden lg:sticky lg:top-24">
            <div className="p-5 border-b border-white/5 bg-[#0B1221]">
              <h3 className="font-black text-white text-xl tracking-tight">Course Curriculum</h3>
            </div>
            <div className="flex flex-col">
              {course.modules.map((mod, i) => {
                const isOpen = openIdx === i;
                return (
                  <div key={i} className="bg-[#0B1221] border-b border-white/5">
                    <button 
                      onClick={() => setOpenIdx(isOpen ? null : i)} 
                      className={`w-full flex items-center justify-between p-5 text-left transition-colors ${isOpen ? "bg-[#112338]" : "hover:bg-[#112338]/50"}`}
                    >
                      <span className={`text-[15px] font-bold pr-4 ${isOpen ? "text-cyan-500" : "text-slate-300"}`}>{mod.title}</span>
                      <span className={`transition-transform ${isOpen ? "rotate-180 text-cyan-500" : "text-slate-500"}`}>
                        <ChevronDown className="w-5 h-5" />
                      </span>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div 
                          key="content" 
                          initial={{ height: 0, opacity: 0 }} 
                          animate={{ height: "auto", opacity: 1 }} 
                          exit={{ height: 0, opacity: 0 }} 
                          transition={{ duration: 0.25 }} 
                          className="overflow-hidden bg-[#0e1628]"
                        >
                          <div className="p-5 space-y-4">
                            {mod.lessons.map((lesson, j) => (
                              <div key={j} className="flex items-start gap-4 group cursor-pointer">
                                <div className="w-10 h-10 rounded border border-sky-900/50 bg-[#12192e] flex items-center justify-center flex-shrink-0 group-hover:border-sky-500 transition-colors">
                                  <PlayCircle className="w-5 h-5 text-sky-500" />
                                </div>
                                <div className="flex-1 min-w-0 pt-0.5">
                                  <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <span className="text-[14px] text-slate-200 font-bold group-hover:text-white transition-colors">{lesson.title}</span>
                                    {lesson.isDemo && (
                                      <span className="px-2 py-0.5 bg-slate-800 text-white text-[9px] font-black uppercase tracking-wider rounded-sm">Demo</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{lesson.duration}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: VIDEO & DETAILS */}
          <div className="space-y-12 lg:min-w-0">
            {/* Video Player Placeholder */}
            <div className="aspect-video bg-black relative border border-white/10 group overflow-hidden w-full">
              {course.videoUrl ? (
                <iframe src={course.videoUrl} className="w-full h-full" allowFullScreen></iframe>
              ) : (
                <>
                  <img src={course.image} alt="Video Thumbnail" className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center cursor-pointer hover:bg-sky-600 hover:border-sky-500 transition-all hover:scale-110">
                      <PlayCircle className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* About This Class */}
            <motion.div {...fadeUp} viewport={{ once: true }}>
              <h2 className="text-2xl font-black text-white tracking-tight mb-4">About This Class</h2>
              <p className="text-slate-300 leading-relaxed text-[15px]">{course.longDescription}</p>
            </motion.div>

            {/* Meet Your Teacher */}
            <motion.div {...fadeUp} viewport={{ once: true }} className="border-t border-white/10 pt-12">
              <h2 className="text-2xl font-black text-white tracking-tight mb-8">Meet Your Teacher</h2>
              
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-shrink-0">
                  <img src={course.instructor.image} alt={course.instructor.name} className="w-24 h-24 rounded-full object-cover border-2 border-white/10" />
                </div>
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-white">{course.instructor.name}</h3>
                    <span className="px-2 py-1 bg-[#FFB800]/10 text-[#FFB800] text-[10px] font-black uppercase tracking-widest rounded-sm border border-[#FFB800]/20">{course.instructor.role}</span>
                  </div>
                  <p className="text-sm text-sky-400 mb-6">{course.instructor.specialization}</p>
                  
                  <ul className="space-y-3 mb-6">
                    {course.instructor.bio.map((point, i) => (
                      <li key={i} className="flex items-start gap-3 text-[14px] text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-2 flex-shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                  
                  <button className="text-sm font-bold text-white hover:text-sky-400 transition-colors mb-8">Read More...</button>

                  <div className="border-t border-white/10 pt-8">
                    <p className="text-sm font-bold text-white mb-6">See Full Profile</p>
                    <div className="grid grid-cols-3 gap-4 text-center divide-x divide-white/10">
                      <div>
                        <p className="text-2xl font-black text-white mb-1">{course.instructor.stats.experience}</p>
                        <p className="text-[11px] text-slate-400 uppercase tracking-widest">Years Of Experience</p>
                      </div>
                      <div>
                        <p className="text-2xl font-black text-white mb-1">{course.instructor.stats.students}</p>
                        <p className="text-[11px] text-slate-400 uppercase tracking-widest">No of Students</p>
                      </div>
                      <div>
                        <p className="text-2xl font-black text-white mb-1">{course.instructor.stats.positions}</p>
                        <p className="text-[11px] text-slate-400 uppercase tracking-widest">Position Count</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── FEATURES GRID ─── */
function FeaturesGrid({ course }: { course: Course }) {
  const items = [
    { icon: <Clock className="w-6 h-6" />, title: course.features.duration, desc: "Total course duration" },
    { icon: <BarChart3 className="w-6 h-6" />, title: course.features.skillLevel, desc: "Skill level required" },
    { icon: <Award className="w-6 h-6" />, title: "Certificate", desc: "Verified on completion" },
    { icon: <Globe className="w-6 h-6" />, title: course.features.language, desc: "Teaching languages" },
    { icon: <Infinity className="w-6 h-6" />, title: "Lifetime Access", desc: "Learn at your own pace" },
    { icon: <PlayCircle className="w-6 h-6" />, title: course.features.lectures, desc: "HD recorded lectures" },
    { icon: <BookOpen className="w-6 h-6" />, title: "Study Materials", desc: "Notes, kits & mock exams" },
    { icon: <Shield className="w-6 h-6" />, title: "Mentor Support", desc: "24/7 doubt resolution" },
  ];
  return (
    <section className="py-20 bg-[#0E1628]">
      <div className="max-w-[1280px] mx-auto px-6">
        <motion.div {...fadeUp} viewport={{ once: true }} whileInView="animate" initial="initial">
          <h2 className="text-3xl font-black text-white tracking-tight mb-10">Course Features</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5">
            {items.map((item, i) => (
              <div key={i} className="bg-[#12192e] p-6 hover:bg-[#162040] transition-colors group">
                <div className="text-sky-400 mb-4 group-hover:scale-110 transition-transform">{item.icon}</div>
                <p className="text-white font-bold text-sm mb-1">{item.title}</p>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── CTA ─── */
function CtaSection({ course }: { course: Course }) {
  return (
    <section className="py-20 bg-gradient-to-r from-sky-600 to-indigo-600 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #fff 0px, transparent 50%), radial-gradient(circle at 80% 50%, #fff 0px, transparent 50%)" }} />
      </div>
      <div className="relative z-10 max-w-[1280px] mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-4">Start Learning {course.title} Today</h2>
        <p className="text-sky-100 max-w-xl mx-auto mb-8">Join {course.students} students who are already mastering their skills. Get lifetime access, expert support, and a verified certificate.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button className="px-10 py-4 bg-[#FFB800] hover:bg-[#F2A900] text-black font-black uppercase tracking-widest text-sm transition-all hover:scale-105">Enroll Now — ${course.price}</button>
          <button className="px-10 py-4 border-2 border-white/30 text-white font-bold text-sm uppercase tracking-widest hover:bg-white/10 transition-colors">Talk to Advisor</button>
        </div>
        <p className="mt-6 text-sm text-sky-100/70">7-day money-back guarantee · No hidden fees</p>
      </div>
    </section>
  );
}

/* ─── REVIEWS ─── */
function ReviewsSection({ course }: { course: Course }) {
  return (
    <section className="py-20 bg-[#0B1D3A]">
      <div className="max-w-[1280px] mx-auto px-6">
        <motion.div {...fadeUp} viewport={{ once: true }} whileInView="animate" initial="initial">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-6 h-[2px] bg-sky-400" />
            <span className="text-[11px] font-black uppercase tracking-[0.14em] text-sky-400">Testimonials</span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight mb-10">What Students Say</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5">
            {course.reviews.map((review, i) => (
              <div key={i} className="bg-[#12192e] p-6 hover:bg-[#162040] transition-colors">
                <Quote className="w-5 h-5 text-sky-500/40 mb-4" />
                <div className="flex text-[#FFB800] gap-0.5 mb-3">
                  {[...Array(5)].map((_, j) => <Star key={j} className={`w-3.5 h-3.5 ${j < review.rating ? "fill-current" : ""}`} />)}
                </div>
                <p className="text-sm text-slate-300 leading-relaxed mb-5">{review.review}</p>
                <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                  <img src={review.avatar} alt={review.name} className="w-8 h-8 rounded-full object-cover" />
                  <div>
                    <p className="text-sm font-bold text-white">{review.name}</p>
                    <p className="text-[11px] text-slate-500">{review.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── RECOMMENDED ─── */
function RecommendedSection({ currentSlug }: { currentSlug: string }) {
  const recommended = getRecommendedCourses(currentSlug);
  const cardImages = [
    "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=800",
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800",
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800",
    "https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?q=80&w=800",
  ];
  const levelColors: Record<string, { bg: string; text: string }> = {
    Knowledge: { bg: "bg-indigo-50", text: "text-indigo-700" },
    Skill: { bg: "bg-sky-50", text: "text-sky-700" },
    Basics: { bg: "bg-emerald-50", text: "text-emerald-700" },
  };
  return (
    <section className="py-20 bg-[#0E1628]">
      <div className="max-w-[1280px] mx-auto px-6">
        <motion.div {...fadeUp} viewport={{ once: true }} whileInView="animate" initial="initial">
          <h2 className="text-3xl font-black text-white tracking-tight mb-10">Recommended Courses</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/5">
            {recommended.map((c, i) => {
              const color = levelColors[c.category] ?? levelColors.Basics;
              const img = cardImages[i % cardImages.length];
              return (
                <Link href={`/courses/${c.slug}`} key={c.slug} className="bg-[#12192e] flex flex-col hover:bg-[#162040] transition-colors group">
                  <div className="relative h-40 overflow-hidden">
                    <img src={img} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className={`absolute top-0 left-0 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest ${color.bg} ${color.text}`}>{c.category}</div>
                  </div>
                  <div className="p-5 flex flex-col flex-grow">
                    {c.category && <p className="text-[10px] font-black tracking-widest uppercase text-sky-500/80 mb-1">{c.category}</p>}
                    <h3 className="text-[15px] font-bold text-white leading-snug mb-2">{c.title}</h3>
                    <p className="text-xs text-slate-500 mb-4 flex-grow line-clamp-2">{c.description}</p>
                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <span className="text-xs text-slate-400">{c.duration}</span>
                      <span className="text-sky-400 text-xs font-bold flex items-center gap-1 group-hover:gap-2 transition-all">View <ArrowRight className="w-3 h-3" /></span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── FAQ ─── */
function FaqSection({ course }: { course: Course }) {
  const [openId, setOpenId] = useState<number | null>(0);
  return (
    <section className="py-20 bg-[#0B1D3A]">
      <div className="max-w-[800px] mx-auto px-6">
        <motion.div {...fadeUp} viewport={{ once: true }} whileInView="animate" initial="initial">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-white tracking-tight mb-3">Frequently Asked Questions</h2>
            <p className="text-slate-400 text-sm">Everything you need to know about this course.</p>
          </div>
          <div className="flex flex-col divide-y divide-white/10 border-t border-white/10">
            {course.faqs.map((faq, i) => {
              const isOpen = openId === i;
              return (
                <div key={i}>
                  <button onClick={() => setOpenId(isOpen ? null : i)} className={`w-full flex items-center justify-between py-5 text-left transition-colors ${isOpen ? "text-sky-400" : "text-slate-200 hover:text-sky-400"}`}>
                    <span className="text-[15px] font-semibold pr-4">{faq.question}</span>
                    {isOpen ? <ChevronUp className="w-5 h-5 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 flex-shrink-0" />}
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div key="a" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                        <p className="pb-5 text-slate-400 text-[15px] leading-relaxed">{faq.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── PAGE ─── */
export default function CourseDetailPage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const course = getCourseBySlug(slug);

  if (!course) {
    return (
      <main className="min-h-screen bg-[#0E1628] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-black text-white mb-4">Course Not Found</h1>
          <p className="text-slate-400 mb-8">The course you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/" className="px-8 py-3 bg-sky-600 text-white font-bold text-sm uppercase tracking-widest hover:bg-sky-500 transition-colors">Back to Home</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <HeroSection course={course} />
      <MainContentSection course={course} />
      <FeaturesGrid course={course} />
      <CtaSection course={course} />
      <ReviewsSection course={course} />
      <RecommendedSection currentSlug={slug} />
      <FaqSection course={course} />
    </main>
  );
}
