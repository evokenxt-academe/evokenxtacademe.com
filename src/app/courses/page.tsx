import { FeaturesSection } from "@/components/feature-section";
import { LmsClassesStripSection } from "@/components/lms-classes-strip-section";

export default function CoursesPage() {
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
    <main className="relative min-h-screen " style={bodyTheme}>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8 tracking-tight">Our Courses</h1>
        <p className="text-lg text-slate-600 mb-12 max-w-2xl">
          Explore our wide range of professional courses designed to help you master your field. From ACCA to Data Science, we have something for everyone.
        </p>
        
        <div className="space-y-24">
          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-6">Course Features</h2>
            <FeaturesSection />
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-6">Current Offerings</h2>
            <LmsClassesStripSection />
          </section>
        </div>
      </div>
    </main>
  );
}
