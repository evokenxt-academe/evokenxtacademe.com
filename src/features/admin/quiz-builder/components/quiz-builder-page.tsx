"use client";

import * as React from "react";
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconListCheck,
  IconPencil,
  IconClipboardText,
  IconFileTypePdf,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";

import {
  useCourseSections,
  useQuizForSection,
  useQuizQuestions,
  useAddQuestionsToQuiz,
  useToggleQuizPublish,
} from "../hooks/use-quiz-builder";
import { CourseQuizSelector } from "./course-quiz-selector";
import { TabManual } from "./tab-manual";
import { TabPaste } from "./tab-paste";
import { TabImportPdf } from "./tab-import-pdf";
import { QuestionBankPanel } from "./question-bank-panel";
import { QuizQuestionList } from "./quiz-question-list";

// ── Main Page ─────────────────────────────────────────────────

export function QuizBuilderPage() {
  const [selectedCourseId, setSelectedCourseId] = React.useState<string>("");
  const [selectedSectionId, setSelectedSectionId] = React.useState<string>("");
  const [activeTab, setActiveTab] = React.useState("manual");

  // ── Data fetching ─────────────────────────────────────────

  const { data: courseSectionsData, isLoading: isLoadingCourses } =
    useCourseSections();
  const courseSections = courseSectionsData?.courseSections ?? [];

  // This hook calls getOrCreateQuiz — the API auto-creates a quiz
  // when a section is selected and no quiz exists yet.
  const { data: quizData, isLoading: isLoadingQuiz } = useQuizForSection(
    selectedSectionId || null
  );
  const quiz = quizData?.quiz ?? null;

  const { data: quizQuestionsData } = useQuizQuestions(quiz?.id ?? null);
  const existingQuestionIds = React.useMemo(
    () =>
      new Set(
        (quizQuestionsData?.questions ?? []).map((q) => q.questionId)
      ),
    [quizQuestionsData]
  );

  const addQuestionsMutation = useAddQuestionsToQuiz();
  const togglePublishMutation = useToggleQuizPublish();

  // ── Derived state ─────────────────────────────────────────

  const selectedCourse = courseSections.find(
    (c) => c.courseId === selectedCourseId
  );
  const sections = selectedCourse?.sections ?? [];

  // Auto-select first section when course changes
  React.useEffect(() => {
    if (selectedCourseId && sections.length > 0 && !selectedSectionId) {
      setSelectedSectionId(sections[0].id);
    }
  }, [selectedCourseId, sections, selectedSectionId]);

  function handleCourseChange(courseId: string) {
    setSelectedCourseId(courseId);
    setSelectedSectionId("");
  }

  // ── Handlers ──────────────────────────────────────────────

  function handleAddToQuiz(questionIds: string[]) {
    if (!quiz?.id) {
      toast.error("No test available");
      return;
    }
    addQuestionsMutation.mutate({ quizId: quiz.id, questionIds });
  }

  function handleTogglePublish() {
    if (!quiz?.id) return;
    togglePublishMutation.mutate({
      quizId: quiz.id,
      isPublished: !quiz.isPublished,
    });
  }

  const hasQuiz = !!quiz;
  const hasSection = !!selectedSectionId;

  return (
    <AdminPageShell
      title="Test Builder"
      description="Create and manage questions efficiently"
      actions={
        quiz && (
          <div className="flex items-center gap-2">
            <Badge
              variant={quiz.isPublished ? "default" : "secondary"}
              className="rounded-full px-3 py-1"
            >
              {quiz.isPublished ? "Published" : "Draft"}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTogglePublish}
              disabled={togglePublishMutation.isPending}
              className="rounded-xl"
            >
              {quiz.isPublished ? (
                <>
                  <IconPlayerPause className="mr-1.5 size-4" />
                  Unpublish
                </>
              ) : (
                <>
                  <IconPlayerPlay className="mr-1.5 size-4" />
                  Publish
                </>
              )}
            </Button>
          </div>
        )
      }
    >
      {/* Course / Section / Quiz Selector */}
      <CourseQuizSelector
        courseSections={courseSections}
        isLoadingCourses={isLoadingCourses}
        selectedCourseId={selectedCourseId}
        selectedSectionId={selectedSectionId}
        selectedQuizId={quiz?.id ?? null}
        quiz={quiz}
        isLoadingQuiz={isLoadingQuiz}
        onCourseChange={handleCourseChange}
        onSectionChange={setSelectedSectionId}
      />

      {/* Loading state while quiz is being fetched / auto-created */}
      {hasSection && isLoadingQuiz && (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      )}

      {/* Main two-column layout — shown once quiz is loaded */}
      {hasSection && !isLoadingQuiz && hasQuiz && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
          {/* Left column: Tabs + Quiz Questions */}
          <div className="flex flex-col gap-6">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex flex-col"
            >
              <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-grid">
                <TabsTrigger value="manual" className="gap-1.5">
                  <IconPencil className="size-4" />
                  Manual
                </TabsTrigger>
                <TabsTrigger value="paste" className="gap-1.5">
                  <IconClipboardText className="size-4" />
                  Paste
                </TabsTrigger>
                <TabsTrigger value="pdf" className="gap-1.5">
                  <IconFileTypePdf className="size-4" />
                  Import PDF
                </TabsTrigger>
              </TabsList>

              <div className="mt-4">
                <TabsContent value="manual" className="mt-0">
                  <div className="rounded-xl border border-border/60 bg-card p-5">
                    <TabManual quizId={quiz.id} />
                  </div>
                </TabsContent>

                <TabsContent value="paste" className="mt-0">
                  <div className="rounded-xl border border-border/60 bg-card p-5">
                    <TabPaste quizId={quiz.id} />
                  </div>
                </TabsContent>

                <TabsContent value="pdf" className="mt-0">
                  <div className="rounded-xl border border-border/60 bg-card p-5">
                    <TabImportPdf quizId={quiz.id} />
                  </div>
                </TabsContent>
              </div>
            </Tabs>

            {/* Quiz Questions list below tabs */}
            <Separator />
            <QuizQuestionList quizId={quiz.id} />
          </div>

          {/* Right column: Question Bank */}
          <div className="flex flex-col rounded-xl border border-border/60 bg-card p-4 lg:sticky lg:top-24 lg:h-[calc(100vh-120px)] overflow-hidden self-start">
            <QuestionBankPanel
              onAddToQuiz={handleAddToQuiz}
              isAddingToQuiz={addQuestionsMutation.isPending}
              existingQuestionIds={existingQuestionIds}
            />
          </div>
        </div>
      )}

      {/* No section selected */}
      {!hasSection && !isLoadingCourses && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <IconListCheck className="mb-4 size-12 text-muted-foreground/20" />
          <p className="text-sm font-medium text-muted-foreground">
            Select a course and section to get started
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Choose a course above, then select a section to load or create a
            quiz.
          </p>
        </div>
      )}
    </AdminPageShell>
  );
}
