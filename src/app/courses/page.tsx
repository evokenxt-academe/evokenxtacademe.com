import { Metadata } from "next";
import { CourseCatalog } from "./_components/course-catalog";

export const metadata: Metadata = {
  title: "Course Catalog — Evoke Edu Global",
  description:
    "Browse professional ACCA courses with expert instruction, structured study plans, and globally recognized qualifications. Start your journey today.",
};

export default function CoursesCatalogPage() {
  return (
    <div className="min-h-screen bg-background">

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-24 pt-40 md:px-6 lg:pt-48">
        {/* Page header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Course Catalog
          </h1>
          <p className="text-sm text-muted-foreground">
            Browse professional courses designed to accelerate your ACCA career.
          </p>
        </div>

        <CourseCatalog />
      </main>
    </div>
  );
}
