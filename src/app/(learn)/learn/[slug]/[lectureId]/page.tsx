import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import {
  fetchStudentCoursePlayerData,
} from "@/features/student/lib/lms-data";
import { LearnPage } from "@/features/learn/components/learn-page";
import type { SerializablePlayerData } from "@/features/learn/components/learn-page";

interface Props {
  params: Promise<{
    slug: string;
    lectureId: string;
  }>;
}

export default async function CoursePlayerPage({ params }: Props) {
  const { slug, lectureId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const playerData = await fetchStudentCoursePlayerData(
    supabase,
    user.id,
    slug,
    lectureId,
  );

  if (!playerData) {
    redirect("/dashboard");
  }

  if (!playerData.enrollment) {
    redirect("/courses");
  }

  if (playerData.shouldRedirectToLectureId) {
    redirect(`/learn/${slug}/${playerData.shouldRedirectToLectureId}`);
  }

  const currentLecture = playerData.currentLecture;
  if (!currentLecture) {
    redirect("/dashboard");
  }

  // Convert Map → Record for serialization across server/client boundary
  const progressRecord: Record<
    string,
    {
      lectureId: string;
      isCompleted: boolean;
      watchedSeconds: number;
      lastWatchedAt: string | null;
    }
  > = {};
  for (const [key, value] of playerData.lectureProgressMap.entries()) {
    progressRecord[key] = value;
  }

  const serializedData: SerializablePlayerData = {
    course: playerData.course,
    enrollment: playerData.enrollment,
    sections: playerData.sections,
    orderedLectures: playerData.orderedLectures,
    lectureProgressMap: progressRecord,
    currentLecture: playerData.currentLecture,
    resources: playerData.resources,
    courseProgress: playerData.courseProgress,
    previousLectureId: playerData.previousLectureId,
    nextLectureId: playerData.nextLectureId,
  };

  return <LearnPage initialData={serializedData} slug={slug} />;
}
