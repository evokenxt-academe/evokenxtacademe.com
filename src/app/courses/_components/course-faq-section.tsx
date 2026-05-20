"use client";

import { useState } from "react";
import { HelpCircle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type FAQItem = {
  id: number;
  category: "courses" | "support" | "exams";
  question: string;
  answer: string;
  features?: string[];
  stats?: { label: string; value: string };
};

const faqs: FAQItem[] = [
  {
    id: 1,
    category: "courses",
    question: "How do I enroll in an ACCA course?",
    answer:
      "Enrolling is simple. Browse our course list above, select the paper you want to study, and complete the enrollment process. You will get instant access to all lecture videos, practice materials, and tutor support.",
    features: ["Instant access upon payment", "HD video lectures included", "Mobile-friendly platform"],
    stats: { label: "Enrollment Time", value: "< 2 mins" },
  },
  {
    id: 2,
    category: "courses",
    question: "Are the courses designed for absolute beginners?",
    answer:
      "Yes, our Applied Knowledge level courses start from the absolute basics of accounting. We guide you step-by-step through all syllabus topics, assuming no prior accounting background.",
    features: ["Zero prerequisites required", "Basic-to-advanced syllabus", "Interactive step-by-step tutorials"],
  },
  {
    id: 3,
    category: "support",
    question: "What kind of tutor support do I get?",
    answer:
      "You will have direct access to experienced ACCA tutors via dedicated study groups and interactive discussion forums. You can ask questions anytime and receive detailed, personalized solutions.",
    features: ["Direct tutor messaging", "Active student community forums", "Weekly live Q&A sessions"],
    stats: { label: "Tutor Response", value: "< 12 hours" },
  },
  {
    id: 4,
    category: "exams",
    question: "Do you offer mock exams and practice kits?",
    answer:
      "Absolutely. Every course includes full mock exams designed to simulate real ACCA exam conditions, along with expert video solutions and walkthroughs of past exam questions.",
    features: ["Real exam simulations", "Expert tutor reviews", "Detailed feedback reports"],
    stats: { label: "Pass Rate", value: "95% Success" },
  },
  {
    id: 5,
    category: "support",
    question: "Can I study on my mobile phone or tablet?",
    answer:
      "Yes! Our modern LMS is fully responsive. You can seamlessly stream lectures, read notes, and practice quizzes on any mobile phone, tablet, or desktop computer.",
    features: ["Offline study guides", "Optimized video player", "Cross-device sync"],
  },
];

const categories = [
  { id: "all", label: "All Questions" },
  { id: "courses", label: "Courses & Study" },
  { id: "support", label: "Tutors & Platform" },
  { id: "exams", label: "Exams & Mocks" },
];

export function CourseFaqSection() {
  const [activeTab, setActiveTab] = useState<string>("all");

  const filteredFaqs = faqs.filter(
    (faq) => activeTab === "all" || faq.category === activeTab
  );

  return (
    <section className="relative w-full pt-16 pb-4 md:pt-24 md:pb-6 bg-background overflow-hidden">
      {/* Background Glow Decors */}
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 w-full max-w-7xl h-full -z-10 select-none">
        <div className="absolute top-1/4 left-1/4 size-[200px] rounded-full bg-primary/5 blur-[80px]" />
        <div className="absolute bottom-1/4 right-1/4 size-[200px] rounded-full bg-violet-500/5 blur-[80px]" />
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge
            variant="outline"
            className="inline-flex items-center gap-1.5 rounded-full border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary mb-3"
          >
            <HelpCircle className="size-3.5" /> Support Center
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base max-w-xl mx-auto">
            Everything you need to know about our ACCA courses, study materials, and learning platform.
          </p>
        </div>

        {/* Dynamic Category Pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`relative rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 border ${
                activeTab === cat.id
                  ? "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/25"
                  : "bg-muted/40 border-border/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Official Shadcn Accordion component */}
        <div className="w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Accordion type="single" collapsible className="w-full flex flex-col divide-y divide-border/60">
                {filteredFaqs.map((faq) => (
                  <AccordionItem
                    key={faq.id}
                    value={`item-${faq.id}`}
                    className="border-none py-1"
                  >
                    <AccordionTrigger className="text-[15px] font-bold text-foreground transition-all hover:text-primary hover:no-underline py-4 text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm leading-relaxed text-muted-foreground pb-5 pt-1">
                      {/* Answer description */}
                      <p className="mb-4">{faq.answer}</p>

                      {/* Nested Interactive Checklist & Metric Panels */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-border/40 pt-4 mt-3">
                        <div className="col-span-2 flex flex-col gap-2">
                          {faq.features?.map((feat, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 text-[12px] font-semibold text-foreground/80"
                            >
                              <CheckCircle2 className="size-3.5 text-primary shrink-0" />
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>

                        {faq.stats && (
                          <div className="col-span-1 flex flex-col justify-center items-start md:items-end border-t md:border-t-0 md:border-l border-border/40 pt-3 md:pt-0 md:pl-4">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                              {faq.stats.label}
                            </span>
                            <span className="text-sm font-extrabold text-primary mt-0.5">
                              {faq.stats.value}
                            </span>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
