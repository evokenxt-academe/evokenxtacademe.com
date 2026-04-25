import { StorySection } from "@/components/story-section";
import { HeroSection } from "@/components/hero-section";
import { HowProcessSection } from "@/components/how-process-section";
import { HowItWorksSection } from "@/components/how-it-works-section";
import { TestimonialsSection } from "@/components/testimonials-section";
import { FaqSection } from "@/components/faq-section";
import { LmsClassesStripSection } from "@/components/lms-classes-strip-section";
import { TeacherCoursesSection } from "@/components/teacher-courses-section";
import { CourseSection } from "@/components/course-section";


export default function Home() {
  const bodyTheme = {
    backgroundColor: "#F8FAFC",
    backgroundImage: `
      radial-gradient(at 0% 0%, rgba(56, 189, 248, 0.15) 0px, transparent 50%),
      radial-gradient(at 100% 0%, rgba(251, 146, 60, 0.12) 0px, transparent 50%),
      radial-gradient(at 100% 100%, rgba(16, 185, 129, 0.12) 0px, transparent 50%),
      radial-gradient(at 0% 100%, rgba(255, 255, 255, 0.8) 0px, transparent 50%)
    `,
  } as const;

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <HeroSection />
      <div style={bodyTheme}>
        <StorySection />
        <CourseSection />
        <TestimonialsSection />
        <FaqSection />
        <LmsClassesStripSection />
        <HowProcessSection />
      </div>
    </main>
  );
}


