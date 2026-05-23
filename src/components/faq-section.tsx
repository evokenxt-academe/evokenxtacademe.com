"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Asterisk, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BlurFade } from "@/components/ui/blur-fade";

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
    <section className="py-24  overflow-hidden">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">

          {/* ─── Left Column: Content & Contact Card ─── */}
          <div className="flex flex-col gap-6 lg:gap-8 w-full max-w-[480px]">
            <BlurFade delay={0.1} inView>
              <div className="flex flex-col items-start gap-5">
                <Badge variant="outline" className="px-6 py-2.5 text-[16px] rounded-full bg-transparent border-[1.5px] border-foreground/40 text-foreground flex items-center gap-3 font-medium shadow-sm">
                  <Asterisk className="w-6 h-6 text-foreground animate-[spin_2s_linear_infinite]" /> FAQ
                </Badge>
                
                <h2 className="text-4xl md:text-[44px] font-bold text-foreground tracking-tight leading-[1.1]">
                  Have more questions?
                </h2>
                
                <p className="text-muted-foreground text-[16px] leading-relaxed">
                  Our app is designed to make managing your finances easy and stress-free. With intuitive features, you can track your spending and savings effortlessly.
                </p>
              </div>
            </BlurFade>

            <BlurFade delay={0.25} inView>
              <Card className="shadow-sm border-border/60 bg-card rounded-[20px] p-6 md:p-8 mt-2 md:mt-4">
                <h3 className="text-[22px] font-bold text-foreground mb-3">
                  Can't find answers?
                </h3>
                <p className="text-muted-foreground text-[15px] leading-relaxed mb-6">
                  We're here to help you out whenever you need! Get in touch with our dedicated support team for personalized assistance anytime.
                </p>
                
                {/* Button with specific dark halo effect from screenshot */}
                <button className="relative inline-flex items-center gap-2 rounded-full bg-zinc-900 text-white px-6 py-3 text-[14px] font-medium transition-all hover:bg-zinc-800 shadow-[0px_0px_20px_rgba(0,0,0,0.25)] ring-4 ring-zinc-900/10 dark:bg-white dark:text-black dark:shadow-[0px_0px_20px_rgba(255,255,255,0.25)] dark:ring-white/10">
                  Contact us <ArrowUpRight className="w-4 h-4 stroke-[2]" />
                </button>
              </Card>
            </BlurFade>
          </div>

          {/* ─── Right Column: FAQ Accordion ─── */}
          <div className="flex flex-col">
            <BlurFade delay={0.15} inView>
              <h2 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight mb-4 leading-tight">
                Questions &amp; Answers
              </h2>
              <p className="text-muted-foreground text-base leading-relaxed mb-10 max-w-md">
                Discover a world of knowledge and opportunity with Evokenxt — your platform for professional accounting excellence.
              </p>
            </BlurFade>

            {/* Accordion */}
            <div className="flex flex-col divide-y divide-border border-t border-border">
              {faqs.map((faq, idx) => {
                const isOpen = openId === faq.id;
                return (
                  <BlurFade key={faq.id} delay={0.25 + idx * 0.05} inView>
                    <div className="overflow-hidden">
                      <button
                        onClick={() => setOpenId(isOpen ? null : faq.id)}
                        className={`w-full flex items-center justify-between py-5 text-left transition-colors group ${isOpen ? "text-primary" : "text-foreground hover:text-primary"
                          }`}
                      >
                        <span className={`text-[15px] font-semibold leading-snug pr-4 ${isOpen ? "text-primary" : "text-foreground"}`}>
                          {faq.question}
                        </span>
                        <span className={`flex-shrink-0 w-8 h-8 flex items-center justify-center transition-colors ${isOpen ? "text-primary" : "text-muted-foreground"}`}>
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
                            <p className="pb-5 text-muted-foreground text-[15px] leading-relaxed">
                              {faq.answer}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </BlurFade>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
