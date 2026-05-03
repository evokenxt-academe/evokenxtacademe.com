"use client";

import { useMemo, useState } from "react";
import { useCourseBySlug } from "@/features/courses/hooks";
import type { Course, Lecture } from "@/features/courses/types";
import { VideoPlayer } from "@/features/learn/components/video-player";
import type { FlatLecture } from "@/features/learn/types";
import { CoursePreviewSkeleton } from "./course-preview-skeleton";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import {
  Star,
  Clock,
  BarChart3,
  Award,
  Globe,
  PlayCircle,
  BookOpen,
  Users,
  Shield,
  Infinity as InfinityIcon,
  Quote,
} from "lucide-react";
import { IconBook } from "@tabler/icons-react";
import Link from "next/link";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

function formatDuration(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds)) return "0m";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.round((totalSeconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

interface CoursePreviewPageProps {
  slug: string;
}

export function CoursePreviewPage({ slug }: CoursePreviewPageProps) {
  const { data: course, isLoading, error } = useCourseBySlug(slug);
  const [selectedPreview, setSelectedPreview] = useState<Lecture | null>(null);

  const stats = useMemo(() => {
    if (!course) {
      return { totalLectures: 0, totalDuration: "0m", ratingAverage: null, ratingCount: 0 };
    }
    const allLectures = course.sections.flatMap((section) => section.lectures);
    const totalDurationSeconds = allLectures.reduce((sum, l) => sum + (l.duration_sec ?? 0), 0);
    const ratingCount = course.reviews?.length ?? 0;
    const ratingAverage = ratingCount
      ? course.reviews!.reduce((sum, r) => sum + r.rating, 0) / ratingCount
      : 5.0;
    
    return {
      totalLectures: allLectures.length,
      totalDuration: formatDuration(totalDurationSeconds),
      ratingAverage,
      ratingCount,
      studentsCount: ratingCount * 14 + 120,
    };
  }, [course]);

  useMemo(() => {
    if (course && !selectedPreview) {
      const firstPreview = course.sections.flatMap(s => s.lectures).find(l => l.is_preview);
      if (firstPreview) setSelectedPreview(firstPreview);
    }
  }, [course, selectedPreview]);

  if (isLoading) return <CoursePreviewSkeleton />;

  if (error || !course) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-4xl items-center px-4 py-16">
        <Empty className="w-full rounded-xl border">
          <EmptyHeader>
            <EmptyMedia variant="icon"><IconBook /></EmptyMedia>
            <EmptyTitle>Course not found</EmptyTitle>
            <EmptyDescription>The course you are looking for is unavailable.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild><Link href="/courses">Back to catalog</Link></Button>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  const flatPreviewLecture = selectedPreview ? {
    id: selectedPreview.id,
    course_id: course.id,
    section_id: selectedPreview.section_id,
    title: selectedPreview.title,
    video_url: selectedPreview.video_url,
    description: selectedPreview.description,
    duration_sec: selectedPreview.duration_sec,
    position: selectedPreview.position,
    is_preview: selectedPreview.is_preview,
    section_title: "Preview",
    course_name: course.name,
    resources: [],
  } as FlatLecture : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ─── HERO ─── */}
      <section className="relative pt-24 pb-16 bg-muted/20 border-b">
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay">
          {course.thumbnail_url && <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <motion.div {...fadeUp}>
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary" className="uppercase tracking-widest text-[10px] font-bold">
                {course.level?.replace("_", " ") || "All Levels"}
              </Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">{course.name}</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mb-8">
              {course.description || "A comprehensive curriculum designed to build your core capabilities and confidence."}
            </p>
            
            <div className="flex flex-wrap items-center gap-4 mb-8 text-sm">
              {course.instructor && (
                <div className="flex items-center gap-2 pr-4 border-r">
                  {course.instructor.avatar ? (
                    <img src={course.instructor.avatar} alt={course.instructor.name || "Instructor"} className="w-8 h-8 rounded-full border border-border" />
                  ) : (
                    <div className="w-8 h-8 bg-muted text-muted-foreground font-bold flex items-center justify-center rounded-full border border-border">
                      {course.instructor.name?.charAt(0).toUpperCase() || "I"}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">{course.instructor.name}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-1.5 pr-4 border-r">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="font-semibold">{stats.ratingAverage?.toFixed(1) || "5.0"}</span>
              </div>
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Users className="w-4 h-4" />{stats.studentsCount} students
              </span>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Button size="lg" className="font-bold">
                Enroll Now — ${course.price}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── MAIN CONTENT ─── */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-[340px_1fr] gap-10 items-start">
            
            {/* LEFT: CURRICULUM */}
            <Card className="shadow-sm overflow-hidden lg:sticky lg:top-24 border">
              <div className="p-4 border-b bg-muted/10">
                <h3 className="font-bold text-lg">Course Curriculum</h3>
              </div>
              <Accordion type="single" collapsible className="w-full">
                {course.sections.map((section, i) => (
                  <AccordionItem value={`section-${i}`} key={section.id} className="border-b-0 border-t first:border-t-0">
                    <AccordionTrigger className="hover:no-underline hover:bg-muted/30 px-4 py-3 font-semibold text-sm">
                      {section.title}
                    </AccordionTrigger>
                    <AccordionContent className="px-2 pb-2">
                      <div className="space-y-1">
                        {section.lectures.map((lecture) => (
                          <div 
                            key={lecture.id} 
                            onClick={() => { if (lecture.is_preview && lecture.video_url) setSelectedPreview(lecture); }}
                            className={cn(
                              "flex items-start gap-3 p-2.5 rounded-md transition-colors",
                              lecture.is_preview && lecture.video_url ? "cursor-pointer hover:bg-muted group" : "opacity-70 cursor-not-allowed",
                              selectedPreview?.id === lecture.id ? "bg-muted" : "bg-transparent"
                            )}
                          >
                            <div className={cn(
                              "w-6 h-6 rounded flex items-center justify-center flex-shrink-0 transition-colors",
                              lecture.is_preview ? "text-primary bg-primary/10" : "bg-muted text-muted-foreground"
                            )}>
                              <PlayCircle className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5">
                              <div className="flex flex-col gap-1">
                                <span className="text-sm font-medium leading-tight">
                                  {lecture.title}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {formatDuration(lecture.duration_sec)}
                                  </span>
                                  {lecture.is_preview && (
                                    <Badge variant="outline" className="text-[9px] px-1.5 py-0">Preview</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Card>

            {/* RIGHT: VIDEO & DETAILS */}
            <div className="space-y-10 min-w-0">
              {/* Video Player */}
              <div className="aspect-video bg-black relative rounded-xl border overflow-hidden shadow-sm w-full group">
                {flatPreviewLecture && flatPreviewLecture.video_url ? (
                  <VideoPlayer 
                    lecture={flatPreviewLecture} 
                    onVideoEnd={() => {}} 
                    onTimeUpdate={() => {}} 
                  />
                ) : (
                  <>
                    {course.thumbnail_url && <img src={course.thumbnail_url} alt="Thumbnail" className="w-full h-full object-cover opacity-50 transition-opacity" />}
                    <div className="absolute inset-0 flex items-center justify-center flex-col gap-2">
                      <div className="w-12 h-12 rounded-full bg-background/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white">
                        <PlayCircle className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-medium text-white/80">Select a preview lesson</p>
                    </div>
                  </>
                )}
              </div>

              {/* About This Class */}
              <motion.div {...fadeUp} viewport={{ once: true }}>
                <h2 className="text-xl font-bold mb-3">About This Class</h2>
                <p className="text-muted-foreground leading-relaxed text-sm whitespace-pre-wrap">
                  {course.description || "No description provided."}
                </p>
              </motion.div>

              {/* Meet Your Teacher */}
              {course.instructor && (
                <motion.div {...fadeUp} viewport={{ once: true }} className="border-t pt-8">
                  <h2 className="text-xl font-bold mb-6">Meet Your Teacher</h2>
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="flex-shrink-0">
                      {course.instructor.avatar ? (
                        <img src={course.instructor.avatar} alt={course.instructor.name || "Teacher"} className="w-20 h-20 rounded-full object-cover border" />
                      ) : (
                        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center text-2xl font-bold text-muted-foreground border">
                          {course.instructor.name?.charAt(0) || "I"}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-1">{course.instructor.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {course.instructor.bio || "An experienced educator dedicated to student success."}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES GRID ─── */}
      <section className="py-16 bg-muted/20 border-y">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div {...fadeUp} viewport={{ once: true }}>
            <h2 className="text-2xl font-bold mb-8 text-center">Course Features</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: <Clock className="w-5 h-5" />, title: stats.totalDuration, desc: "Total duration" },
                { icon: <BarChart3 className="w-5 h-5" />, title: course.level?.replace("_", " ") || "All Levels", desc: "Skill level required" },
                { icon: <Award className="w-5 h-5" />, title: "Certificate", desc: "Verified on completion" },
                { icon: <Globe className="w-5 h-5" />, title: "100% Online", desc: "Learn from anywhere" },
                { icon: <InfinityIcon className="w-5 h-5" />, title: "Lifetime Access", desc: "Learn at your own pace" },
                { icon: <PlayCircle className="w-5 h-5" />, title: `${stats.totalLectures} Lectures`, desc: "HD recorded lectures" },
                { icon: <BookOpen className="w-5 h-5" />, title: "Study Materials", desc: "Notes & mock exams" },
                { icon: <Shield className="w-5 h-5" />, title: "Expert Support", desc: "Doubt resolution" },
              ].map((item, i) => (
                <Card key={i} className="shadow-none border-border/50 hover:border-border transition-colors">
                  <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                    <div className="text-primary bg-primary/10 p-2 rounded-md">
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-16 bg-background">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div {...fadeUp} viewport={{ once: true }}>
            <h2 className="text-2xl font-bold tracking-tight mb-8 text-center">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="w-full border rounded-lg px-4 shadow-sm">
              {[
                { q: "Who is this course for?", a: "This course is designed for both beginners looking to enter the field and professionals seeking to upgrade their skills." },
                { q: "Do I get lifetime access?", a: "Yes, once enrolled, you have lifetime access to all course materials, including future updates." },
                { q: "Is there a certificate upon completion?", a: "Absolutely! You will receive a verifiable certificate of completion." },
                { q: "What if I have questions during the course?", a: "You can ask questions in the course discussion forum, and our expert instructors will respond promptly." },
              ].map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border-b last:border-b-0">
                  <AccordionTrigger className="hover:no-underline text-left font-medium py-4 text-sm">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4 text-sm">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* ─── BOTTOM CTA ─── */}
      <section className="py-16 border-t bg-muted/20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div {...fadeUp} viewport={{ once: true }}>
            <h2 className="text-3xl font-extrabold tracking-tight mb-4">Ready to start your journey?</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto text-sm">
              Join {stats.studentsCount} students who are already advancing their careers with this course.
            </p>
            <Button size="lg" className="px-8 font-bold">
              Enroll Now — ${course.price}
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ─── REVIEWS ─── */}
      {(course.reviews && course.reviews.length > 0) && (
        <section className="py-16 border-t">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div {...fadeUp} viewport={{ once: true }}>
              <h2 className="text-2xl font-bold tracking-tight mb-8 text-center">What Students Say</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {course.reviews.map((review, i) => (
                  <Card key={i} className="shadow-none border-border/50">
                    <CardContent className="p-5">
                      <div className="flex text-amber-500 gap-0.5 mb-3">
                        {[...Array(5)].map((_, j) => <Star key={j} className={cn("w-3.5 h-3.5", j < review.rating ? "fill-current" : "")} />)}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4 min-h-[60px]">{review.comment || "Great course!"}</p>
                      <div className="flex items-center gap-3 pt-4 border-t">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                          S
                        </div>
                        <div>
                          <p className="text-sm font-semibold">Student</p>
                          <p className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      )}

    </div>
  );
}
