import { CreateCourseForm } from "./_components/create-course-form";

export default function NewCoursePage() {
  return (
    <div className="flex flex-col gap-6 md:p-10 p-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Create Course</h1>
      </div>

      <CreateCourseForm />
    </div>
  );
}
