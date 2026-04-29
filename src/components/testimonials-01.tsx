import type { TestimonialType } from "@/components/testimonial-list";
import { TestimonialList } from "@/components/testimonial-list";

export function Testimonials01() {
  return (
    <div className="bg-background py-16 md:py-20 lg:py-24">
      <div className="mx-auto mb-10 max-w-6xl px-4 md:px-6 lg:px-8">
        <p className="mb-2 text-center text-sm font-medium text-muted-foreground">
          Student Success
        </p>
        <h2 className="text-center text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Trusted by future leaders
        </h2>
      </div>
      <div className="flex flex-col gap-4 [&_.rfm-initial-child-container]:items-stretch! [&_.rfm-marquee]:items-stretch!">
        <TestimonialList data={TESTIMONIALS_1} />
        <TestimonialList data={TESTIMONIALS_2} direction="right" />
      </div>
    </div>
  );
}

const TESTIMONIALS_1: TestimonialType[] = [
  {
    authorAvatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
    authorName: "Sarah J.",
    authorTagline: "ACCA Affiliate",
    url: "#",
    quote: "Evoke EduGlobal transformed how I study. The recorded sessions are crystal clear, and the tutors explain complex topics beautifully.",
  },
  {
    authorAvatar: "https://i.pravatar.cc/150?u=a042581f4e29026703d",
    authorName: "Michael T.",
    authorTagline: "SBR Top Scorer",
    url: "#",
    quote: "The mock exams perfectly mirrored the actual ACCA papers. I felt incredibly confident walking into the exam hall.",
  },
  {
    authorAvatar: "https://i.pravatar.cc/150?u=a04258114e29026702d",
    authorName: "Aisha M.",
    authorTagline: "P-Level Student",
    url: "#",
    quote: "Finding high-quality lectures in Urdu was a game-changer for me. Concepts I struggled with for months suddenly made sense.",
  },
  {
    authorAvatar: "https://i.pravatar.cc/150?u=a048581f4e29026701d",
    authorName: "David O.",
    authorTagline: "Taxation Specialist",
    url: "#",
    quote: "The 24/7 tutor support is unmatched. Whenever I got stuck on a past paper question, help was just a message away.",
  },
  {
    authorAvatar: "https://i.pravatar.cc/150?u=a092581d4ef9026700d",
    authorName: "Priya K.",
    authorTagline: "Audit Associate",
    url: "#",
    quote: "Clean, intuitive platform. No distractions, just pure learning. The best investment I've made in my career so far.",
  },
  {
    authorAvatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
    authorName: "James R.",
    authorTagline: "Skill Level Student",
    url: "#",
    quote: "Their focus on exam technique rather than just theory makes all the difference. Highly recommended for any serious ACCA student.",
  },
];

const TESTIMONIALS_2: TestimonialType[] = [
  {
    authorAvatar: "https://i.pravatar.cc/150?u=a04258a2462d826712d",
    authorName: "Zainab F.",
    authorTagline: "Finance Manager",
    url: "#",
    quote: "Balancing work and studies is tough, but the flexible recorded sessions let me study at my own pace. Passed AFM on my first attempt!",
  },
  {
    authorAvatar: "https://i.pravatar.cc/150?u=a042581f4e29026704e",
    authorName: "Ali H.",
    authorTagline: "ACCA Finalist",
    url: "#",
    quote: "The detailed analytics after each mock exam helped me pinpoint exactly where I was losing marks. Truly an intelligent platform.",
  },
  {
    authorAvatar: "https://i.pravatar.cc/150?u=a042581f4e29026704f",
    authorName: "Emma W.",
    authorTagline: "Knowledge Level",
    url: "#",
    quote: "Started from absolute basics. The foundation courses laid the perfect groundwork for my accounting journey.",
  },
  {
    authorAvatar: "https://i.pravatar.cc/150?u=a042581f4e29026704g",
    authorName: "Omar S.",
    authorTagline: "Business Analyst",
    url: "#",
    quote: "World-class instructors. You can tell they actually care about your success, not just finishing the syllabus.",
  },
  {
    authorAvatar: "https://i.pravatar.cc/150?u=a042581f4e29026704h",
    authorName: "Fatima B.",
    authorTagline: "Audit Senior",
    url: "#",
    quote: "I've tried other platforms, but Evoke's structured learning path and focused materials are in a league of their own.",
  },
  {
    authorAvatar: "https://i.pravatar.cc/150?u=a042581f4e29026704i",
    authorName: "Rahul V.",
    authorTagline: "CFO",
    url: "#",
    quote: "I now send my entire junior team to Evoke for their professional development. The results speak for themselves.",
  },
];
