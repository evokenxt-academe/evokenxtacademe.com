import { StorySection } from "@/components/story-section";
import { HeroSection } from "@/components/hero-section";
import { HowProcessSection } from "@/components/how-process-section";
import { FooterSection } from "@/components/footer-section";
import { FaqSection } from "@/components/faq-section";
import { Navigation } from "@/components/navigation";
import { LmsClassesStripSection } from "@/components/lms-classes-strip-section";
import { CourseSection } from "@/components/course-section";
import { Separator } from "@/components/ui/separator";
import { Testimonials01 } from "@/components/testimonials-01";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-background">
      <HeroSection />
      <StorySection />
      <Separator />
      <CourseSection />
      <Separator />
      <Testimonials01 />
      <Separator />
      <FaqSection />
      <HowProcessSection />
    </main>
  );
}
