"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const faqs = [
  {
    id: 1,
    question: "How do I enroll in a course?",
    answer: "Enrolling is simple. Browse our Course Catalogue, select your desired program, and click 'Enroll Now'. You'll get instant access to all video lectures, practice kits, and resources."
  },
  {
    id: 2,
    question: "Are the courses available in Urdu and Hindi?",
    answer: "Yes! All of our ACCA and professional accounting courses are taught by expert instructors in Urdu and Hindi, making complex concepts far easier to understand."
  },
  {
    id: 3,
    question: "What qualifications do your instructors hold?",
    answer: "Our instructors are fully qualified ACCA and CA professionals with years of industry experience and a proven track record of helping students pass on the first attempt."
  },
  {
    id: 4,
    question: "Do I get access to recorded lectures?",
    answer: "Absolutely. Every course includes full access to our high-definition recorded lecture library so you can learn at your own pace, on your own schedule, on any device."
  },
  {
    id: 5,
    question: "Is there any support for exam preparation?",
    answer: "Yes — every program includes comprehensive mock exams, past paper walkthroughs, and targeted revision kits built directly around the latest examiner reports and marking schemes."
  }
];

const instructorAvatars = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=60&h=60&fit=crop",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=60&h=60&fit=crop",
  "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=60&h=60&fit=crop",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=60&h=60&fit=crop",
];

export function FaqSection() {
  const [openId, setOpenId] = useState<number | null>(3);

  return (
    <section className="py-24 bg-[#0E1628] overflow-hidden">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">

          {/* ─── Left Column: Image Composition ─── */}
          <div className="relative mx-auto w-full max-w-[480px] lg:max-w-none">

            {/* Main large photo */}
            <div className="relative w-[80%] overflow-hidden shadow-2xl" style={{ aspectRatio: "3/4" }}>
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=900"
                alt="Student learning"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Smaller overlapping photo */}
            <div className="absolute bottom-[-6%] right-0 w-[52%] overflow-hidden shadow-xl border-4 border-[#0E1628]" style={{ aspectRatio: "4/3" }}>
              <img
                src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=600"
                alt="Students studying"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>

            {/* Floating Instructors Card */}
            <div className="absolute top-6 -right-4 lg:right-4 bg-white shadow-xl border border-slate-100 px-4 py-3 flex items-center gap-3 z-20" style={{ minWidth: "180px" }}>
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2">Our Instructors</p>
                <div className="flex items-center gap-1">
                  {instructorAvatars.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt={`Instructor ${i + 1}`}
                      className="w-7 h-7 rounded-full object-cover border-2 border-white"
                      style={{ marginLeft: i > 0 ? "-6px" : 0 }}
                    />
                  ))}
                  <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold border-2 border-white ml-[-6px]">+</div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Right Column: FAQ Accordion ─── */}
          <div className="flex flex-col">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
              Questions &amp; Answers
            </h2>
            <p className="text-slate-400 text-base leading-relaxed mb-10 max-w-md">
              Discover a world of knowledge and opportunity with Evoke EduGlobal — your platform for professional accounting excellence.
            </p>

            {/* Accordion */}
            <div className="flex flex-col divide-y divide-white/10 border-t border-white/10">
              {faqs.map((faq) => {
                const isOpen = openId === faq.id;
                return (
                  <div key={faq.id} className="overflow-hidden">
                    <button
                      onClick={() => setOpenId(isOpen ? null : faq.id)}
                      className={`w-full flex items-center justify-between py-5 text-left transition-colors group ${
                        isOpen ? "text-indigo-400" : "text-slate-200 hover:text-indigo-400"
                      }`}
                    >
                      <span className={`text-[15px] font-semibold leading-snug pr-4 ${isOpen ? "text-indigo-400" : "text-slate-200"}`}>
                        {faq.question}
                      </span>
                      <span className={`flex-shrink-0 w-8 h-8 flex items-center justify-center transition-colors ${isOpen ? "text-indigo-400" : "text-slate-500"}`}>
                        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </span>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key="content"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.28, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <p className="pb-5 text-slate-400 text-[15px] leading-relaxed">
                            {faq.answer}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
