import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import {
  IconBroadcast,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconCircleCheckFilled,
  IconClock,
  IconFileText,
  IconPlayerPlay,
} from "@tabler/icons-react";
import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MarkLectureCompleteButton } from "@/features/student/components/mark-lecture-complete-button";
import {
  buildYoutubeEmbedUrl,
  fetchStudentCoursePlayerData,
  formatDurationCompact,
} from "@/features/student/lib/lms-data";

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

  const embedUrl = buildYoutubeEmbedUrl(currentLecture.videoUrl);

  const currentProgress = playerData.lectureProgressMap.get(currentLecture.id);
  const isCurrentCompleted = currentProgress?.isCompleted === true;
  const currentWatchedSeconds = currentProgress?.watchedSeconds ?? 0;

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-black overflow-hidden border-t border-white/5">
      <div className="w-full lg:w-96 shrink-0 border-r border-white/5 bg-zinc-950 flex flex-col order-2 lg:order-1">
        <div className="p-6 border-b border-white/5 space-y-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-zinc-500 hover:text-white text-xs font-bold transition-colors"
          >
            <IconChevronLeft className="size-3" /> BACK TO DASHBOARD
          </Link>

          <h1 className="text-lg font-black text-white line-clamp-2 leading-tight">
            {playerData.course.name}
          </h1>

          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              <span>Your Progress</span>
              <span>
                {playerData.courseProgress.completedLectures}/
                {playerData.courseProgress.totalLectures} Lessons
              </span>
            </div>
            <Progress
              value={playerData.courseProgress.progressPercent}
              className="h-1.5 bg-zinc-900"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <Accordion
            type="multiple"
            defaultValue={playerData.sections.map((section) => section.id)}
            className="p-2 space-y-2"
          >
            {playerData.sections.map((section, index) => (
              <AccordionItem
                key={section.id}
                value={section.id}
                className="border-none bg-zinc-900/50 rounded-2xl px-2 overflow-hidden"
              >
                <AccordionTrigger className="hover:no-underline py-4 px-2 group">
                  <div className="flex items-center gap-3 text-left">
                    <div className="size-7 rounded-lg bg-zinc-800 border border-white/5 flex items-center justify-center text-[10px] font-bold text-zinc-500 shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white group-hover:text-primary transition-colors truncate">
                        {section.title}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-medium">
                        {section.lectures.length} lessons
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-3 px-1">
                  <div className="space-y-1">
                    {section.lectures.map((lecture) => {
                      const isActive = lecture.id === currentLecture.id;
                      const lectureProgress = playerData.lectureProgressMap.get(
                        lecture.id,
                      );
                      const isCompleted = lectureProgress?.isCompleted === true;

                      return (
                        <Link
                          key={lecture.id}
                          href={`/learn/${slug}/${lecture.id}`}
                          className={`flex items-center gap-3 p-3 rounded-xl transition-all group ${
                            isActive
                              ? "bg-primary text-black"
                              : "hover:bg-white/5 text-zinc-400 hover:text-white"
                          }`}
                        >
                          <div
                            className={`size-6 rounded-full flex items-center justify-center shrink-0 ${
                              isActive
                                ? "bg-black/20"
                                : "bg-black/40 border border-white/5"
                            }`}
                          >
                            {isCompleted ? (
                              <IconCircleCheckFilled className="size-3 text-emerald-400" />
                            ) : isActive ? (
                              <IconPlayerPlay className="size-3 fill-current" />
                            ) : (
                              <IconCheck className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[11px] font-bold truncate leading-tight">
                              {lecture.title}
                            </span>
                            <span
                              className={`text-[9px] font-medium ${
                                isActive ? "text-black/60" : "text-zinc-600"
                              }`}
                            >
                              {formatDurationCompact(lecture.durationSec)}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col bg-black order-1 lg:order-2 overflow-hidden">
        <div className="flex-1 bg-black relative flex flex-col overflow-y-auto">
          {embedUrl ? (
            <div className="w-full aspect-video bg-zinc-950">
              <iframe
                title={currentLecture.title}
                src={embedUrl}
                className="w-full h-full border-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="w-full aspect-video bg-zinc-950 flex items-center justify-center">
              <div className="text-center px-6">
                <IconPlayerPlay className="size-10 text-zinc-700 mx-auto mb-3" />
                <p className="text-sm font-semibold text-zinc-400">
                  No valid video URL for this lecture
                </p>
              </div>
            </div>
          )}

          <div className="p-6 lg:p-10 max-w-5xl mx-auto w-full space-y-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2 max-w-3xl">
                <Badge className="bg-primary/10 text-primary border-primary/20 uppercase tracking-widest text-[9px] font-black">
                  {isCurrentCompleted ? "COMPLETED" : "IN PROGRESS"}
                </Badge>
                <h2 className="text-2xl lg:text-3xl font-black text-white">
                  {currentLecture.title}
                </h2>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  {currentLecture.description ||
                    "This lecture focuses on key ACCA concepts with practical walkthroughs and exam-oriented strategy."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <MarkLectureCompleteButton
                  lectureId={currentLecture.id}
                  isCompleted={isCurrentCompleted}
                  watchedSeconds={currentWatchedSeconds}
                />
                {playerData.previousLectureId ? (
                  <Link href={`/learn/${slug}/${playerData.previousLectureId}`}>
                    <Button
                      variant="outline"
                      className="h-12 rounded-xl border-white/10"
                    >
                      <IconChevronLeft className="size-4 mr-1" />
                      Previous
                    </Button>
                  </Link>
                ) : null}
                {playerData.nextLectureId ? (
                  <Link href={`/learn/${slug}/${playerData.nextLectureId}`}>
                    <Button
                      variant="outline"
                      className="h-12 rounded-xl border-white/10"
                    >
                      Next
                      <IconChevronRight className="size-4 ml-1" />
                    </Button>
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 rounded-2xl border border-white/5 bg-zinc-900/60 p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <IconFileText className="size-4 text-primary" />
                  Study Materials & Resources
                </h3>

                {playerData.resources.length > 0 ? (
                  <div className="space-y-2">
                    {playerData.resources.map((resource) => (
                      <a
                        key={resource.id}
                        href={resource.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between rounded-xl border border-white/5 bg-black/30 p-3 hover:border-primary/30 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {resource.title}
                          </p>
                          <p className="text-[11px] text-zinc-500">
                            Open resource
                          </p>
                        </div>
                        <IconChevronRight className="size-4 text-zinc-500" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">
                    No resources uploaded for this lecture yet.
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-white/5 bg-zinc-900/60 p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <IconClock className="size-4 text-sky-400" />
                  Course Snapshot
                </h3>
                <div className="space-y-2 text-sm text-zinc-400">
                  <div className="flex items-center justify-between">
                    <span>Progress</span>
                    <span className="font-bold text-white">
                      {playerData.courseProgress.progressPercent}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Completed Lessons</span>
                    <span className="font-bold text-white">
                      {playerData.courseProgress.completedLectures}/
                      {playerData.courseProgress.totalLectures}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Total Duration</span>
                    <span className="font-bold text-white">
                      {formatDurationCompact(
                        playerData.courseProgress.totalDurationSec,
                      )}
                    </span>
                  </div>
                </div>

                <Progress
                  value={playerData.courseProgress.progressPercent}
                  className="h-2 bg-zinc-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-white/5 bg-zinc-900/60 p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <IconBroadcast className="size-4 text-red-400" />
                  Live Sessions
                </h3>

                {playerData.relatedLiveStreams.length > 0 ? (
                  <div className="space-y-2">
                    {playerData.relatedLiveStreams.map((stream) => (
                      <div
                        key={stream.id}
                        className="rounded-xl border border-white/5 bg-black/30 p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-white truncate">
                            {stream.title}
                          </p>
                          <Badge
                            variant="outline"
                            className="text-[10px] uppercase tracking-widest border-white/10 text-zinc-300"
                          >
                            {stream.status}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-1">
                          {stream.startedAt ||
                          stream.endedAt ||
                          stream.scheduledAt
                            ? new Date(
                                stream.startedAt ||
                                  stream.endedAt ||
                                  stream.scheduledAt ||
                                  "",
                              ).toLocaleString("en-IN", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })
                            : "Awaiting broadcast"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">
                    No live sessions for this course.
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-white/5 bg-zinc-900/60 p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <IconFileText className="size-4 text-emerald-400" />
                  Recent Quiz Attempts
                </h3>

                {playerData.quizAttempts.length > 0 ? (
                  <div className="space-y-2">
                    {playerData.quizAttempts.map((attempt) => (
                      <div
                        key={`${attempt.quizId}-${attempt.submittedAt || "latest"}`}
                        className="rounded-xl border border-white/5 bg-black/30 p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-white truncate">
                            {attempt.quizTitle}
                          </p>
                          <Badge
                            variant="outline"
                            className={`text-[10px] uppercase tracking-widest border-white/10 ${
                              attempt.passed
                                ? "text-emerald-300"
                                : "text-amber-300"
                            }`}
                          >
                            {attempt.passed ? "Passed" : "Pending"}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-1">
                          Score: {attempt.score}/{attempt.totalMarks}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">
                    No quiz attempts recorded yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
