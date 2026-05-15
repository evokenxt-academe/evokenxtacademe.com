"use client";

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
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";

const stats = [
  { icon: Download, value: "2.5M+", label: "Downloads" },
  { icon: Users, value: "850K+", label: "Active Learners" },
  { icon: Star, value: "4.9/5", label: "Average Rating" },
  { icon: BookOpen, value: "1,200+", label: "Courses" },
  { icon: TrendingUp, value: "15%", label: "Growth" },
];

export default function CTAInstall() {
  return (
    <section className="w-full min-h-screen flex items-center bg-background">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 lg:gap-20 items-center">
          {/* Left — Phone mockup */}
          <div className="order-2 lg:order-1 flex justify-center lg:justify-start py-8 sm:py-12 lg:py-16">
            <MockPhone />
          </div>

          {/* Right — Content */}
          <div className="order-1 lg:order-2 flex flex-col gap-6 sm:gap-8">
            {/* Brand badge */}
            <div className="inline-flex">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent text-primary text-xs sm:text-sm font-medium">
                <BookOpen className="h-3.5 w-3.5" />
                EvokeNext LMS
              </span>
            </div>

            {/* Heading */}
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight text-balance">
                Empowering Minds, Transforming Futures
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
                EvokeNext is your gateway to world-class learning. Join millions
                of learners mastering new skills through expert-led courses,
                interactive content, and a thriving community.
              </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {stats.map((stat) => (
                <StatCard
                  key={stat.label}
                  icon={stat.icon}
                  value={stat.value}
                  label={stat.label}
                />
              ))}
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 h-12 sm:h-14 rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                Start Free Trial
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground font-semibold px-8 h-12 sm:h-14 rounded-xl gap-2 transition-all"
              >
                <PlayCircle className="h-5 w-5" />
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

interface StatCardProps {
  icon: LucideIcon;
  value: string;
  label: string;
}

export function MockPhone() {
  const chatMessages = [
    {
      name: "Sarah Miller",
      msg: "Great course content!",
      time: "9:00AM",
      unread: 1,
    },
    {
      name: "John Davis",
      msg: "When is the next live?",
      time: "10:00PM",
      unread: 3,
    },
    {
      name: "Emma Wilson",
      msg: "Thanks for the help!",
      time: "8:30AM",
      unread: 0,
    },
    {
      name: "Alex Chen",
      msg: "Module 3 was amazing",
      time: "5:50AM",
      unread: 2,
    },
  ];

  return (
    <div
      className="relative w-full max-w-sm mx-auto select-none"
      aria-hidden="true"
    >
      {/* Stats floating card */}
      <div className="absolute -top-6 -left-2 sm:-left-8 z-20 bg-card rounded-xl shadow-lg border border-border p-3 sm:p-4 w-32 sm:w-40">
        <p className="text-[9px] sm:text-[10px] text-muted-foreground flex items-center gap-1">
          <TrendingUp className="h-3 w-3 text-primary" />
          Active Learners
        </p>
        <p className="text-lg sm:text-2xl font-bold text-foreground mt-0.5">
          124,500
        </p>
        <p className="text-[9px] sm:text-[10px] text-green-600 font-medium">
          +32% this month
        </p>
      </div>

      {/* Phone frame - larger and taller */}
      <div className="relative mx-auto w-56 sm:w-64 bg-foreground rounded-[2.5rem] shadow-2xl p-1.5 sm:p-2 z-10">
        <div className="bg-card rounded-[2.2rem] overflow-hidden min-h-[420px] sm:min-h-[480px]">
          {/* Notch */}
          <div className="bg-foreground h-6 sm:h-7 rounded-t-[2.2rem] flex items-center justify-center">
            <div className="w-16 sm:w-20 h-2 bg-foreground/80 rounded-full" />
          </div>

          {/* Phone screen content */}
          <div className="bg-card px-3 sm:px-4 pb-4">
            {/* Header */}
            <div className="flex items-center justify-between py-2 sm:py-3 border-b border-border">
              <ArrowLeft className="h-4 w-4 text-foreground" />
              <span className="text-[10px] sm:text-xs font-semibold text-foreground">
                Course Details
              </span>
              <Bookmark className="h-4 w-4 text-foreground" />
            </div>

            {/* Course info */}
            <div className="flex items-center justify-between mt-3">
              <div>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground">
                  EvokeNext LMS
                </p>
                <p className="text-xs sm:text-sm font-bold text-foreground">
                  UX Design Mastery
                </p>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">
                  4.2k enrolled
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs sm:text-sm font-bold text-primary">
                  $49.99
                </p>
                <Badge variant="secondary" className="text-[8px] mt-1">
                  Bestseller
                </Badge>
              </div>
            </div>

            {/* Instructor */}
            <div className="mt-3 sm:mt-4 bg-accent/50 rounded-xl p-3 flex items-center gap-3">
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-primary/20">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm font-bold">
                  JK
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-[11px] sm:text-xs font-bold text-foreground">
                  James Korsgaard
                </p>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground">
                  Senior UX Designer
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <GraduationCap className="h-3 w-3 text-primary" />
                  <p className="text-[9px] sm:text-[10px] text-primary font-medium">
                    12 Courses
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mt-3 sm:mt-4">
              <p className="text-[10px] sm:text-xs font-bold text-foreground">
                About This Course
              </p>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground leading-relaxed mt-1 line-clamp-2">
                Master modern UX design principles, wireframing techniques, and
                user research methods...
              </p>
            </div>

            {/* Lessons */}
            <div className="mt-3 sm:mt-4">
              <p className="text-[10px] sm:text-xs font-bold text-foreground">
                32 Lessons
              </p>
              <div className="mt-2 space-y-2">
                {[
                  "Introduction to UX",
                  "User Research Basics",
                  "Wireframing 101",
                ].map((lesson, i) => (
                  <div key={lesson} className="flex items-center gap-2">
                    <div
                      className={`h-5 w-5 sm:h-6 sm:w-6 rounded-full flex items-center justify-center ${i === 0 ? "bg-primary" : "bg-muted"}`}
                    >
                      <Play
                        className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${i === 0 ? "text-primary-foreground" : "text-muted-foreground"}`}
                        fill="currentColor"
                      />
                    </div>
                    <p className="text-[9px] sm:text-[10px] text-foreground">
                      {lesson}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Enroll button */}
            <div className="mt-4 sm:mt-5 bg-primary rounded-full py-2.5 text-center shadow-md">
              <p className="text-[10px] sm:text-xs font-bold text-primary-foreground">
                Start Learning Now
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat list overlay card */}
      <div className="absolute bottom-8 -right-2 sm:-right-10 z-20 bg-card rounded-xl shadow-lg border border-border w-40 sm:w-48 overflow-hidden">
        <div className="bg-muted px-3 py-2 border-b border-border">
          <p className="text-[9px] sm:text-[10px] font-bold text-foreground uppercase tracking-wide">
            Community Chat
          </p>
        </div>
        <div className="divide-y divide-border">
          {chatMessages.map((chat) => (
            <div
              key={chat.name}
              className="flex items-center gap-2 px-2.5 py-2"
            >
              <Avatar className="h-6 w-6 shrink-0">
                <AvatarFallback className="bg-accent text-primary text-[8px] font-medium">
                  {chat.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] sm:text-[10px] font-semibold text-foreground truncate">
                  {chat.name}
                </p>
                <p className="text-[8px] sm:text-[9px] text-muted-foreground truncate">
                  {chat.msg}
                </p>
              </div>
              <div className="flex flex-col items-end gap-0.5 shrink-0">
                <p className="text-[7px] sm:text-[8px] text-muted-foreground">
                  {chat.time}
                </p>
                {chat.unread > 0 && (
                  <Badge className="h-4 min-w-4 px-1 text-[7px] bg-green-500 hover:bg-green-500 text-white rounded-full flex items-center justify-center">
                    {chat.unread}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Decorative gradient blur */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none">
        <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-primary/8 blur-3xl" />
      </div>
    </div>
  );
}

export function StatCard({ icon: Icon, value, label }: StatCardProps) {
  return (
    <Card className="border border-border/60 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200 bg-card">
      <CardContent className="flex items-center gap-3 p-4 sm:p-5">
        <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full bg-accent">
          <Icon
            className="h-4 w-4 sm:h-5 sm:w-5 text-primary"
            strokeWidth={1.75}
          />
        </div>
        <div>
          <p className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
            {value}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
