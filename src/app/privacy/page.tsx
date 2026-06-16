"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Shield,
  Eye,
  FileText,
  Share2,
  Lock,
  UserCheck,
  Globe,
  Mail,
  Search,
  ArrowRight,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BlurFade } from "@/components/ui/blur-fade";

// Define policy sections
interface PolicySection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  summary: string;
  content: string;
}

const PRIVACY_SECTIONS: PolicySection[] = [
  {
    id: "introduction",
    title: "1. Introduction & Overview",
    icon: Shield,
    summary: "Welcome to EvokeNxt Academe. We value your privacy and are committed to protecting the personal data of our ACCA and professional qualification students.",
    content: "EvokeNxt Academe LMS ('we', 'us', or 'our') is operated by Evoke EduGlobal. This Privacy Policy describes how we collect, use, process, and disclose your personal information in connection with your access to and use of our Learning Management System (LMS), mobile applications, website, live streaming platforms, and email updates. By accessing or using our services, you agree to the terms of this Privacy Policy and consent to the practices described herein."
  },
  {
    id: "collect",
    title: "2. Information We Collect",
    icon: Eye,
    summary: "We collect information you provide when creating an account, making payments, studying courses, and interacting in live stream classes.",
    content: "We collect several types of information from and about users of our LMS, including:\n\n• **Account Data:** Full name, email address, password, contact number, profile image, and ACCA registration details.\n• **Billing & Financial Info:** Payment transactions, invoice details, and billing address. Note that all transactions are processed securely through our authorized payment gateways; we do not store raw credit card credentials on our servers.\n• **Academic & Progress Data:** Course enrollments, video lecture playback progress, completion statuses, quiz scores, mock exam submissions, and academic performance telemetry.\n• **Live Streaming & Chat Data:** Comments, questions, chat room transcripts, and occasional audio/video streams during live interactive virtual sessions.\n• **Technical & Telemetry Data:** IP addresses, browser cookies, device fingerprints, operating system type, page load latency, and general platform interaction logs."
  },
  {
    id: "usage",
    title: "3. How We Use Your Data",
    icon: FileText,
    summary: "Your data is used to deliver ACCA courses, track study progress, process billing, send updates, and support your exam preparation.",
    content: "We use the collected information for the following core business and academic purposes:\n\n• **LMS Delivery:** Provisioning your student account, processing enrollments, tracking course completion, and displaying class analytics.\n• **Academic Guidance:** Providing study suggestions, assessing practice quiz outcomes, and grading mock exams to improve ACCA pass rates.\n• **Communication:** Delivering critical platform updates, class schedule notifications, and promotional materials via our Brevo integration (students can opt-out of marketing emails at any time).\n• **Operations Optimization:** Diagnosing technical streaming issues, refining video content delivery, and improving platform responsiveness.\n• **Security & RLS Compliance:** Enforcing secure Row-Level Security (RLS) on our databases, preventing unauthorized multi-device account sharing, and blocking fraudulent activities."
  },
  {
    id: "sharing",
    title: "4. Sharing & Third-Party Services",
    icon: Share2,
    summary: "We only share your information with trusted partners necessary for providing our LMS services (e.g. database, billing, email, video streaming). We never sell your data.",
    content: "We do not sell, rent, or trade your personal data. We disclose your information only to trusted third-party service providers who assist us in operating our platform and delivering lectures:\n\n• **Cloud & Infrastructure:** Supabase hosts our backend database infrastructure and handles secure identity authentication.\n• **Email Operations:** Brevo manages transactional and newsletter emails.\n• **Video Hosting & Streaming:** We utilize Amazon Web Services (AWS) S3 buckets for lecture PDFs/videos and the Google/YouTube API to run live interactive broadcast streams.\n• **Analytics & Payment Systems:** Encrypted transaction channels and diagnostics utilities designed to evaluate web performance."
  },
  {
    id: "cookies",
    title: "5. Cookies & Local Storage",
    icon: Lock,
    summary: "We use cookies and browser local storage to keep you logged in, preserve your progress, and remember player preferences.",
    content: "Our LMS uses browser cookies, local storage, and session tokens to provide a seamless learning experience:\n\n• **Essential Cookies & Tokens:** Retaining your authenticated session state to avoid repeated logins.\n• **Player Preferences:** Remembering video playback speeds, audio volumes, and theme configurations (Dark Mode vs Light Mode).\n• **Analytical Storage:** Non-identifiable metrics detailing how pages are navigated to optimize site hierarchy."
  },
  {
    id: "security",
    title: "6. Data Security & Retention",
    icon: UserCheck,
    summary: "Your data is stored securely using industry-standard encryption and strict database policies. We keep it as long as your account is active.",
    content: "We implement rigorous security practices to protect your data:\n\n• **Data Encryption:** All data is encrypted in transit using Transport Layer Security (TLS) and at rest utilizing cloud database encryption.\n• **Row-Level Security (RLS):** Database queries are strictly isolated, ensuring users only access their own data records.\n• **Data Retention:** We retain your account, academic records, and progress logs for as long as your student profile is active, or as required by regulatory standards and legal records guidelines."
  },
  {
    id: "rights",
    title: "7. Your Privacy Rights",
    icon: Globe,
    summary: "You can update your account information, download a copy of your records, or request deletion of your account.",
    content: "You have full control over your personal data with the following options:\n\n• **Access & Portability:** Request a copy of the academic and personal records we store.\n• **Correction:** Edit incorrect name, phone, or email details directly inside your profile settings.\n• **Erasure / Deletion:** Request the permanent deletion of your student account and progress history.\n• **Opt-out:** Unsubscribe from non-essential promotional emails using the link at the footer of any email."
  },
  {
    id: "contact",
    title: "8. Contact & Academic Inquiries",
    icon: Mail,
    summary: "Have questions? Our support team and privacy officers are ready to help at support@evokeeduglobal.com.",
    content: "If you have questions, concerns, or requests regarding this Privacy Policy, please contact our privacy compliance officer:\n\n• **Email:** support@evokeeduglobal.com\n• **Office Address:** Mumbai, Maharashtra, India\n• **Support Ticket:** Visit our Contact Support page to submit a ticket directly inside the LMS dashboard."
  }
];

export default function PrivacyPolicyPage() {
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
    if (!searchQuery.trim()) return PRIVACY_SECTIONS;
    const lowerQuery = searchQuery.toLowerCase();
    return PRIVACY_SECTIONS.filter(
      (section) =>
        section.title.toLowerCase().includes(lowerQuery) ||
        section.summary.toLowerCase().includes(lowerQuery) ||
        section.content.toLowerCase().includes(lowerQuery)
    );
  }, [searchQuery]);

  // Expand all full legal text content
  const expandAll = () => {
    const allExpanded = PRIVACY_SECTIONS.reduce((acc, curr) => {
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
            <Shield className="size-3 mr-2 text-primary" />
            Trust & Security Center
          </Badge>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
            Privacy Policy
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            At EvokeNxt Academe, we protect your personal and learning information. 
            Learn how we collect, process, and safeguard your data to support your ACCA journey.
          </p>

          <div className="mt-8 flex justify-center gap-4">
            <Link href="/privacy">
              <Button size="sm" className="rounded-full px-6 bg-primary text-primary-foreground font-semibold shadow-md hover:bg-primary/90">
                Privacy Policy
              </Button>
            </Link>
            <Link href="/terms">
              <Button size="sm" variant="outline" className="rounded-full px-6 border-border hover:border-foreground/20 text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted/60 font-semibold">
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
              placeholder="Search privacy topics (e.g. Supabase, cookies, rights)..."
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
                Policy Sections
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
                <Shield className="size-10 mx-auto text-muted-foreground mb-3" />
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
                    <h3 className="text-base font-bold">Need additional assistance with our privacy controls?</h3>
                    <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                      We take privacy issues seriously. If you have questions about how your student account data is shared, 
                      or want to submit a formal request for information erasure, please reach out to our team.
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
