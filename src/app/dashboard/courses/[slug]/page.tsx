import { CourseDetailContent } from "@/features/courses/course-detail-content";

interface CourseDetailPageProps {
  params: {
    slug: string;
  };
}

export default function CourseDetailPage({ params }: CourseDetailPageProps) {
  return <CourseDetailContent slug={params.slug} />;
}
