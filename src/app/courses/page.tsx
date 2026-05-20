import { Metadata } from "next";
import { CourseCatalog } from "./_components/course-catalog";
import CourseHeroSection from "@/components/hero-sections-05";
import { CourseFaqSection } from "./_components/course-faq-section";

export const metadata: Metadata = {
  title: "Course Catalog — Evoke Edu Global",
  description:
    "Browse professional ACCA courses with expert instruction, structured study plans, and globally recognized qualifications. Start your journey today.",
};

export default function CoursesCatalogPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="flex w-full flex-col gap-8 pb-4 pt-12 md:pt-20">
        {/* Hero Section */}
        <CourseHeroSection />

        {/* Catalog Section */}
        <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
          <CourseCatalog />
        </div>

        {/* Minimalist FAQ Section */}
        <div className="border-t border-border/45 mt-8">
          <CourseFaqSection />
        </div>
      </main>
    </div>
  );
}
