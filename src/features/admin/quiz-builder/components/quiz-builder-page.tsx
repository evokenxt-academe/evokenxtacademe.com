"use client"

import * as React from "react"
import {
    IconBuildingBroadcastTower,
    IconPlayerPlay,
    IconPlayerPause,
    IconSettings,
    IconChevronDown,
    IconListCheck,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { AdminPageShell } from "@/features/admin/components/admin-page-shell"

import {
    useCourseSections,
    useQuizForSection,
    useCreateQuiz,
    useQuizQuestions,
    useAddQuestionsToQuiz,
    useToggleQuizPublish,
} from "../hooks/use-quiz-builder"
import { QuestionBankPanel } from "./question-bank-panel"
import { QuizQuestionList } from "./quiz-question-list"

export function QuizBuilderPage() {
    const [selectedCourseId, setSelectedCourseId] = React.useState<string>("")
    const [selectedSectionId, setSelectedSectionId] = React.useState<string>("")

    // ── Data fetching ─────────────────────────────────────────

    const { data: courseSectionsData, isLoading: isLoadingCourses } = useCourseSections()
    const courseSections = courseSectionsData?.courseSections ?? []

    const { data: quizData, isLoading: isLoadingQuiz } = useQuizForSection(
        selectedSectionId || null
    )
    const quiz = quizData?.quiz ?? null

    const { data: quizQuestionsData } = useQuizQuestions(quiz?.id ?? null)
    const existingQuestionIds = React.useMemo(
        () =>
            new Set(
                (quizQuestionsData?.questions ?? []).map((q) => q.questionId)
            ),
        [quizQuestionsData]
    )

    const addQuestionsMutation = useAddQuestionsToQuiz()
    const togglePublishMutation = useToggleQuizPublish()
    const createQuizMutation = useCreateQuiz()

    // ── Derived state ─────────────────────────────────────────

    const selectedCourse = courseSections.find((c) => c.courseId === selectedCourseId)
    const sections = selectedCourse?.sections ?? []

    // Auto-select first section when course changes
    React.useEffect(() => {
        if (selectedCourseId && sections.length > 0 && !selectedSectionId) {
            setSelectedSectionId(sections[0].id)
        }
    }, [selectedCourseId, sections])

    // Reset section when course changes
    function handleCourseChange(courseId: string) {
        setSelectedCourseId(courseId)
        setSelectedSectionId("")
    }

    // ── Handlers ──────────────────────────────────────────────

    function handleAddToQuiz(questionIds: string[]) {
        if (!quiz?.id) {
            toast.error("No test available")
            return
        }
        addQuestionsMutation.mutate({
            quizId: quiz.id,
            questionIds,
        })
    }

    function handleTogglePublish() {
        if (!quiz?.id) return
        togglePublishMutation.mutate({
            quizId: quiz.id,
            isPublished: !quiz.isPublished,
        })
    }

    function handleCreateTest(type: "manual" | "pdf") {
        if (!selectedSectionId) return
        
        if (type === "pdf") {
            toast.info("PDF question extraction is coming soon!")
            return
        }

        const section = sections.find(s => s.id === selectedSectionId)
        createQuizMutation.mutate({
            sectionId: selectedSectionId,
            title: section?.title ? `${section.title} — Test` : "Section Test",
            type: "practice"
        })
    }

    return (
        <AdminPageShell
            title="Test Builder"
            description="Build tests from your question bank. Select a course and section to get started."
        >
            {/* Course + Section Selectors */}
            <div className="flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1.5 min-w-[200px] flex-1 max-w-xs">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Course
                    </label>
                    {isLoadingCourses ? (
                        <Skeleton className="h-10 rounded-xl" />
                    ) : (
                        <Select value={selectedCourseId} onValueChange={handleCourseChange}>
                            <SelectTrigger className="h-10 rounded-xl">
                                <SelectValue placeholder="Select a course" />
                            </SelectTrigger>
                            <SelectContent>
                                {courseSections.map((cs) => (
                                    <SelectItem key={cs.courseId} value={cs.courseId}>
                                        {cs.courseName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                <div className="flex flex-col gap-1.5 min-w-[200px] flex-1 max-w-xs">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Section
                    </label>
                    <Select
                        value={selectedSectionId}
                        onValueChange={setSelectedSectionId}
                        disabled={!selectedCourseId}
                    >
                        <SelectTrigger className="h-10 rounded-xl">
                            <SelectValue placeholder={selectedCourseId ? "Select a section" : "Select course first"} />
                        </SelectTrigger>
                        <SelectContent>
                            {sections.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                    {s.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Quiz status */}
                {quiz && (
                    <div className="flex items-center gap-2 ml-auto">
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
                                    <IconPlayerPause data-icon="inline-start" />
                                    Unpublish
                                </>
                            ) : (
                                <>
                                    <IconPlayerPlay data-icon="inline-start" />
                                    Publish
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </div>

            <Separator />

            {/* Main Content: Test Questions (left) + Question Bank (right) */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 min-h-[500px]">
                {/* Left: Test Questions */}
                <div className="flex flex-col">
                    {isLoadingQuiz && selectedSectionId ? (
                        <div className="flex flex-col gap-3">
                            <Skeleton className="h-8 w-48 rounded-xl" />
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Skeleton key={i} className="h-24 rounded-xl" />
                            ))}
                        </div>
                    ) : quiz ? (
                        <QuizQuestionList quizId={quiz.id} />
                    ) : selectedSectionId ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-border/50 rounded-2xl bg-muted/20">
                            <IconListCheck className="size-12 text-muted-foreground/30 mb-4" />
                            <p className="text-sm font-medium text-muted-foreground mb-6">
                                No test exists for this section.
                            </p>
                            <div className="flex gap-3">
                                <Button 
                                    onClick={() => handleCreateTest("manual")} 
                                    className="rounded-xl"
                                    disabled={createQuizMutation.isPending}
                                >
                                    Create Manually
                                </Button>
                                <Button 
                                    variant="outline" 
                                    onClick={() => handleCreateTest("pdf")} 
                                    className="rounded-xl"
                                    disabled={createQuizMutation.isPending}
                                >
                                    Upload Question PDF
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <IconListCheck className="size-12 text-muted-foreground/20 mb-4" />
                            <p className="text-sm font-medium text-muted-foreground">
                                Select a section to load or create a test
                            </p>
                        </div>
                    )}
                </div>

                {/* Right: Question Bank */}
                <div className="border-l border-border/60 pl-6 flex flex-col min-h-0">
                    <QuestionBankPanel
                        onAddToQuiz={handleAddToQuiz}
                        isAddingToQuiz={addQuestionsMutation.isPending}
                        existingQuestionIds={existingQuestionIds}
                    />
                </div>
            </div>
        </AdminPageShell>
    )
}
