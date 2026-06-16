"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  UserCheck,
  Lock,
  Shield,
  BookOpen,
  Globe,
  Share2,
  Eye,
  Info,
  Mail,
  Search,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BlurFade } from "@/components/ui/blur-fade";

// Define terms sections
interface TermsSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  summary: string;
  content: string;
}

const TERMS_SECTIONS: TermsSection[] = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms",
    icon: FileText,
    summary: "By using EvokeNxt Academe LMS, you agree to these legal terms. If you do not agree, you must not use our platform.",
    content: "These Terms of Service ('Terms') govern your access to and use of the EvokeNxt Academe LMS ('LMS'), website, and associated academic materials provided by Evoke EduGlobal. Please read them carefully. By registering for an account, purchasing courses, attending live streams, or accessing any course materials, you signify your agreement to be bound by these Terms. If you do not agree, you must immediately cease using the platform."
  },
  {
    id: "registration",
    title: "2. Account Registration & Multi-device Policy",
    icon: UserCheck,
    summary: "You must provide accurate information when registering. Account credentials must never be shared; we restrict concurrent logins to prevent piracy.",
    content: "To access courses, you must create a student account. You agree to:\n\n• Provide accurate, complete, and current registration information.\n• Keep your login credentials strictly confidential. You are solely responsible for all activities occurring under your account.\n• Notify us immediately of any unauthorized access or breach of security.\n\n**Anti-Piracy Multi-device Policy:** To protect intellectual property, each student account is licensed to a single individual. We monitor concurrent logins. Accessing the platform from excessive concurrent devices or sharing credentials with other individuals will result in automatic session termination and potential account suspension."
  },
  {
    id: "license",
    title: "3. LMS Intellectual Property & Study Materials",
    icon: Lock,
    summary: "All course videos, lecture notes, PDFs, and quizzes are owned by EvokeNxt. You receive a personal, non-transferable license to study them; copying or redistributing is illegal.",
    content: "All content on the LMS, including recorded lectures, live stream broadcasts, study manuals, practice mock examinations, quizzes, graphics, logo marks, and code, is the intellectual property of Evoke EduGlobal or its content licensors and is protected by copyright laws.\n\n• **Limited License:** We grant you a personal, non-exclusive, non-transferable, revocable license to access and view materials for your personal, non-commercial study of ACCA or other enrolled qualifications.\n• **Restrictions:** You are strictly prohibited from copying, recording, downloading, publishing, redistributing, selling, or creating derivative works from any course assets without prior written consent. Violating this clause constitutes copyright infringement and will result in immediate legal action and account deletion."
  },
  {
    id: "billing",
    title: "4. Subscription Fees, Payments & Refunds",
    icon: Shield,
    summary: "Course prices are specified at enrollment. Refunds are subject to our specific refund window and policies for each course level.",
    content: "• **Pricing:** Course fees for ACCA Levels (Applied Knowledge, Applied Skills, and Strategic Professional) are displayed at checkout. We reserve the right to alter pricing at any time.\n• **Billing:** Transactions are processed securely via approved payment gateways. You agree to pay all charges incurred at the prices in effect when such charges are incurred.\n• **Refund Policy:** Due to the digital nature of study materials and immediate content delivery, refund eligibility is limited. Standard refund requests must be filed in writing within 7 calendar days of purchase, provided that less than 10% of the course content has been accessed. Refund policies may vary based on promotional offers and package terms."
  },
  {
    id: "conduct",
    title: "5. Academic Integrity & Conduct Code",
    icon: BookOpen,
    summary: "Students must maintain professional conduct in live chatrooms and forums, and exhibit absolute honesty in mock examinations.",
    content: "We foster an environment of professional education and academic excellence. All students must adhere to the following code of conduct:\n\n• **Academic Honesty:** You must complete all practice mock exams and quizzes without unauthorized assistance. Plagiarism or cheating on evaluations is prohibited.\n• **Interaction Rules:** When participating in live lecture stream chats, Q&A sessions, and student forums, you must communicate respectfully. We do not tolerate spamming, harassment, profane language, or self-promotions.\n• **Violations:** Breach of this conduct code may lead to disciplinary warnings, chat bans, or permanent expulsion from the LMS without refund."
  },
  {
    id: "disclaimer",
    title: "6. Disclaimer of Warranties",
    icon: Globe,
    summary: "We provide high-quality materials, but cannot guarantee that you will pass your professional board exams (like ACCA). All content is provided 'as is'.",
    content: "• **Educational Content:** The LMS materials are curated by professional tutors to assist in exam preparation. However, we do not warrant that all content is free from errors or omissions.\n• **No Pass Guarantees:** Passing professional board examinations (such as the ACCA) depends on individual study habits, effort, and exam conditions. We make no guarantees, warranties, or representations regarding your final exam results or career placement.\n• **Platform Availability:** We strive to keep the LMS running 24/7, but we do not warrant uninterrupted, error-free operations. Occasional downtime for system maintenance, AWS hosting latency, or server updates may occur."
  },
  {
    id: "liability",
    title: "7. Limitation of Liability",
    icon: Share2,
    summary: "Our liability is limited to the fees you paid for the course. We are not liable for any indirect or consequential damages.",
    content: "To the maximum extent permitted by law, Evoke EduGlobal, its directors, employees, tutors, and partners shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from:\n\n• Your access to or inability to access or use the LMS.\n• Any conduct or content of any third party on the services.\n• Any content obtained from the services.\n\nIn no event shall our aggregate liability exceed the total amount of course fees paid by you to us in the twelve (12) months preceding the event giving rise to the claim."
  },
  {
    id: "termination",
    title: "8. Account Suspension & Termination",
    icon: Eye,
    summary: "We reserve the right to suspend or close your account if you violate these terms or fail to pay course fees.",
    content: "We reserve the right, without liability or prior notice, to suspend, restrict, or terminate your access to the LMS if:\n\n• You breach any provision of these Terms or the Student Conduct Code.\n• You fail to pay outstanding course fees or installment plans.\n• Your account exhibits suspicious login activity suggesting credentials sharing or automated scraping.\n\nUpon termination, your right to access course materials and view recorded or live lectures ceases immediately. Expelled accounts due to code violations are not eligible for refunds."
  },
  {
    id: "law",
    title: "9. Dispute Resolution & Governing Law",
    icon: Info,
    summary: "These terms are governed by the laws of India. Any disputes will be resolved through arbitration in Mumbai.",
    content: "These Terms and your use of the LMS shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law principles.\n\nAny dispute, controversy, or claim arising out of or relating to these Terms, including the validity, invalidity, breach, or termination thereof, shall be referred to and finally resolved by binding arbitration in Mumbai, Maharashtra, India. The arbitration proceedings shall be conducted in English."
  },
  {
    id: "contact",
    title: "10. Contact & Regulatory Inquiries",
    icon: Mail,
    summary: "For terms-related questions or regulatory inquiries, contact us at support@evokeeduglobal.com.",
    content: "If you have questions about these Terms, or wish to seek clarification on subscription details or academic rules, please contact us:\n\n• **Email:** support@evokeeduglobal.com\n• **Physical Address:** Mumbai, Maharashtra, India\n• **Student Support Portal:** Submit a support inquiry inside the LMS sidebar panel."
  }
];

export default function TermsOfServicePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Toggle state of collapsible full content card
  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Filter sections based on search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return TERMS_SECTIONS;
    const lowerQuery = searchQuery.toLowerCase();
    return TERMS_SECTIONS.filter(
      (section) =>
        section.title.toLowerCase().includes(lowerQuery) ||
        section.summary.toLowerCase().includes(lowerQuery) ||
        section.content.toLowerCase().includes(lowerQuery)
    );
  }, [searchQuery]);

  // Expand all full legal text content
  const expandAll = () => {
    const allExpanded = TERMS_SECTIONS.reduce((acc, curr) => {
      acc[curr.id] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setExpandedSections(allExpanded);
  };

  // Collapse all full legal text content
  const collapseAll = () => {
    setExpandedSections({});
  };

  // Scroll to section helper
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {styleBlock}

      {/* ─── HERO SECTION ─── */}
      <section className="relative w-full overflow-hidden bg-gradient-to-b from-muted/60 via-muted/30 to-background py-16 md:py-24 border-b border-border/80">
        <div
          className="absolute inset-0 opacity-[0.05] dark:opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-6xl px-6 text-center">
          <Badge
            variant="outline"
            className="mb-5 border-border bg-muted/80 text-muted-foreground text-[10px] font-bold uppercase tracking-[0.15em] px-4 py-1.5 rounded-full"
          >
            <BookOpen className="size-3 mr-2 text-primary" />
            Terms & Agreement Center
          </Badge>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
            Terms of Service
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Please review the legal rules and expectations that govern your participation 
            in our virtual classes, course subscriptions, and platform access.
          </p>

          <div className="mt-8 flex justify-center gap-4">
            <Link href="/privacy">
              <Button size="sm" variant="outline" className="rounded-full px-6 border-border hover:border-foreground/20 text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted/60 font-semibold">
                Privacy Policy
              </Button>
            </Link>
            <Link href="/terms">
              <Button size="sm" className="rounded-full px-6 bg-primary text-primary-foreground font-semibold shadow-md hover:bg-primary/90">
                Terms of Service
              </Button>
            </Link>
          </div>

          <p className="text-[11px] text-muted-foreground/60 mt-6 uppercase tracking-wider">
            Last Updated: June 16, 2026
          </p>
        </div>
      </section>

      {/* ─── DYNAMIC NAVIGATION & SEARCH ─── */}
      <section className="sticky top-16 z-30 w-full bg-background/80 backdrop-blur-md border-b border-border/60 py-4 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Search bar */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search terms topics (e.g. refund, license, device)..."
              className="pl-9 h-10 w-full bg-muted/40 hover:bg-muted/60 focus:bg-background border-border rounded-full text-sm transition-all duration-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Quick Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={expandAll}
              className="text-xs h-9 rounded-md border-border"
            >
              Expand All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={collapseAll}
              className="text-xs h-9 rounded-md border-border"
            >
              Collapse All
            </Button>
          </div>
        </div>
      </section>

      {/* ─── MAIN CONTENT LAYOUT ─── */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          
          {/* SIDEBAR: Table of Contents */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-36 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 pl-2">
                Agreement Sections
              </h3>
              <div className="flex flex-col gap-1 border-l border-border/80 pl-0">
                {filteredSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className="text-left text-xs font-medium py-2 px-3 text-muted-foreground hover:text-primary transition-colors border-l-2 border-transparent hover:border-primary -ml-[1px]"
                  >
                    {section.title.split(". ")[1]}
                  </button>
                ))}
              </div>
              
              <div className="mt-8 p-4 rounded-xl border border-primary/10 bg-primary/5">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <Info className="size-4 shrink-0" />
                  <span className="text-xs font-bold uppercase">Quick Summary</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Use the green highlights inside cards to review summaries. Toggle sections to inspect legal language.
                </p>
              </div>
            </div>
          </div>

          {/* MAIN BODY: Content Cards */}
          <div className="lg:col-span-3 space-y-6">
            {filteredSections.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-muted/20">
                <FileText className="size-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-semibold">No matches found for your search query.</p>
                <p className="text-xs text-muted-foreground mt-1">Try searching another term, or clear the input to view all clauses.</p>
                <Button variant="outline" size="sm" onClick={() => setSearchQuery("")} className="mt-4 rounded-full">
                  Clear Search
                </Button>
              </div>
            ) : (
              filteredSections.map((section, idx) => {
                const Icon = section.icon;
                const isExpanded = !!expandedSections[section.id];
                return (
                  <BlurFade key={section.id} delay={0.05 * idx} inView>
                    <Card id={section.id} className="relative overflow-hidden border border-border bg-card/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 scroll-mt-32">
                      <div className="absolute top-0 left-0 w-[3px] h-full bg-primary" />
                      
                      <CardContent className="p-6 md:p-8 space-y-5">
                        
                        {/* Title block */}
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <Icon className="size-5" />
                          </div>
                          <h2 className="text-lg font-bold tracking-tight text-foreground">
                            {section.title}
                          </h2>
                        </div>

                        {/* Summary box (TL;DR) */}
                        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                          <div className="flex items-start gap-2.5">
                            <div className="size-4.5 rounded-full bg-primary/25 flex items-center justify-center text-primary shrink-0 mt-0.5">
                              <Info className="size-3" />
                            </div>
                            <div>
                              <p className="text-[11px] font-bold text-primary uppercase tracking-wider mb-0.5">
                                Key Takeaway (Summary)
                              </p>
                              <p className="text-xs md:text-sm text-foreground/90 font-medium leading-relaxed">
                                {section.summary}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Collapsible content (Full legal text) */}
                        <div className="space-y-4">
                          <button
                            onClick={() => toggleSection(section.id)}
                            className="flex items-center justify-between w-full py-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <span>{isExpanded ? "Hide Detailed Legal Clause" : "Read Full Legal Clause"}</span>
                            {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                          </button>

                          {isExpanded && (
                            <div className="text-xs md:text-sm text-muted-foreground leading-relaxed space-y-2 whitespace-pre-line pt-2 pl-1 border-t border-border/40">
                              {section.content}
                            </div>
                          )}
                        </div>
                        
                      </CardContent>
                    </Card>
                  </BlurFade>
                );
              })
            )}

            {/* CALLOUT: Support */}
            <BlurFade delay={0.4} inView>
              <Card className="bg-gradient-to-br from-primary/5 via-primary/0 to-background border border-primary/10 shadow-sm p-6 md:p-8">
                <CardContent className="p-0 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                  <div className="space-y-2 max-w-lg">
                    <h3 className="text-base font-bold">Have academic or billing questions?</h3>
                    <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                      Our support staff is available to clarify enrollment timelines, billing schedules, and 
                      individual license configurations.
                    </p>
                  </div>
                  <Link href="/contact" className="shrink-0">
                    <Button className="rounded-full font-semibold group flex items-center gap-2">
                      Contact Support
                      <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </BlurFade>
          </div>

        </div>
      </section>
    </div>
  );
}

const styleBlock = (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
  `}</style>
);
