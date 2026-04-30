"use client"

import * as React from "react"
import { toast } from "sonner"
import {
    IconPlus,
    IconX,
    IconGripVertical,
    IconTrash,
    IconCopy,
    IconEdit,
    IconCheck,
    IconCircleCheck,
    IconAlertCircle,
} from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import type {
    QuestionBankItem,
    QuestionType,
    DifficultyLevel,
    CreateQuestionPayload,
} from "@/features/admin/quiz-builder/types"
import {
    QUESTION_TYPE_LABELS,
    DIFFICULTY_LABELS,
    questionTypeHasOptions,
} from "@/features/admin/quiz-builder/types"
import {
    useCreateQuestion,
    useUpdateQuestion,
} from "@/features/admin/quiz-builder/hooks/use-quiz-builder"

// ── Difficulty Badge ──────────────────────────────────────────

const difficultyStyles: Record<DifficultyLevel, string> = {
    easy: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    medium: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    hard: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
}

export function DifficultyBadge({ difficulty }: { difficulty: DifficultyLevel }) {
    return (
        <Badge className={cn("rounded-full border px-2.5 py-0.5 text-[11px] capitalize", difficultyStyles[difficulty])}>
            {DIFFICULTY_LABELS[difficulty]}
        </Badge>
    )
}

// ── Type Badge ────────────────────────────────────────────────

const typeStyles: Record<string, string> = {
    mcq: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    multiple_select: "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300",
    subjective: "border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-300",
    fill_in_the_blanks: "border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
    true_or_false: "border-teal-500/20 bg-teal-500/10 text-teal-700 dark:text-teal-300",
    assertion_reasoning: "border-pink-500/20 bg-pink-500/10 text-pink-700 dark:text-pink-300",
    number: "border-indigo-500/20 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
}

export function TypeBadge({ type }: { type: QuestionType }) {
    return (
        <Badge className={cn("rounded-full border px-2.5 py-0.5 text-[11px]", typeStyles[type] ?? "")}>
            {QUESTION_TYPE_LABELS[type]}
        </Badge>
    )
}

// ── Question Form Dialog ──────────────────────────────────────

interface QuestionFormProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    editingQuestion?: QuestionBankItem | null
}

interface OptionInput {
    text: string
    isCorrect: boolean
}

export function QuestionFormDialog({
    open,
    onOpenChange,
    editingQuestion,
}: QuestionFormProps) {
    const createMutation = useCreateQuestion()
    const updateMutation = useUpdateQuestion()
    const isEditing = !!editingQuestion

    const [questionText, setQuestionText] = React.useState("")
    const [type, setType] = React.useState<QuestionType>("mcq")
    const [difficulty, setDifficulty] = React.useState<DifficultyLevel>("medium")
    const [explanation, setExplanation] = React.useState("")
    const [marks, setMarks] = React.useState(1)
    const [tags, setTags] = React.useState("")
    const [options, setOptions] = React.useState<OptionInput[]>([
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
    ])

    // Populate form when editing
    React.useEffect(() => {
        if (editingQuestion) {
            setQuestionText(editingQuestion.question)
            setType(editingQuestion.type)
            setDifficulty(editingQuestion.difficulty)
            setExplanation(editingQuestion.explanation ?? "")
            setMarks(editingQuestion.marks)
            setTags(editingQuestion.tags.join(", "))
            if (editingQuestion.options.length > 0) {
                setOptions(
                    editingQuestion.options.map((o) => ({
                        text: o.text,
                        isCorrect: o.isCorrect,
                    }))
                )
            }
        } else {
            resetForm()
        }
    }, [editingQuestion, open])

    function resetForm() {
        setQuestionText("")
        setType("mcq")
        setDifficulty("medium")
        setExplanation("")
        setMarks(1)
        setTags("")
        setOptions([
            { text: "", isCorrect: false },
            { text: "", isCorrect: false },
            { text: "", isCorrect: false },
            { text: "", isCorrect: false },
        ])
    }

    function handleOptionChange(index: number, field: keyof OptionInput, value: string | boolean) {
        setOptions((prev) =>
            prev.map((opt, i) => {
                if (i !== index) {
                    // For MCQ/T-F, only one correct
                    if (field === "isCorrect" && value === true && (type === "mcq" || type === "true_or_false")) {
                        return { ...opt, isCorrect: false }
                    }
                    return opt
                }
                return { ...opt, [field]: value }
            })
        )
    }

    function addOption() {
        setOptions((prev) => [...prev, { text: "", isCorrect: false }])
    }

    function removeOption(index: number) {
        if (options.length <= 2) return
        setOptions((prev) => prev.filter((_, i) => i !== index))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!questionText.trim()) {
            toast.error("Question text is required")
            return
        }

        const hasOptions = questionTypeHasOptions(type)

        if (hasOptions) {
            const filledOptions = options.filter((o) => o.text.trim())
            if (filledOptions.length < 2) {
                toast.error("At least 2 options are required")
                return
            }
            if (!filledOptions.some((o) => o.isCorrect)) {
                toast.error("At least one option must be marked correct")
                return
            }
        }

        const parsedTags = tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)

        const payload: CreateQuestionPayload = {
            question: questionText.trim(),
            type,
            explanation: explanation.trim() || undefined,
            difficulty,
            tags: parsedTags,
            marks,
            options: hasOptions
                ? options
                    .filter((o) => o.text.trim())
                    .map((o, i) => ({
                        text: o.text.trim(),
                        isCorrect: o.isCorrect,
                        position: i,
                    }))
                : [],
        }

        try {
            if (isEditing) {
                await updateMutation.mutateAsync({ id: editingQuestion.id, ...payload })
            } else {
                await createMutation.mutateAsync(payload)
            }
            onOpenChange(false)
            resetForm()
        } catch {
            // Error handled by mutation
        }
    }

    const isPending = createMutation.isPending || updateMutation.isPending
    const showOptions = questionTypeHasOptions(type)

    // Auto-populate True/False options
    React.useEffect(() => {
        if (type === "true_or_false") {
            setOptions([
                { text: "True", isCorrect: false },
                { text: "False", isCorrect: false },
            ])
        }
    }, [type])

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-xl md:max-w-4xl p-3 flex flex-col m-2">
                <SheetHeader className="p-6 pb-2">
                    <SheetTitle>{isEditing ? "Edit Question" : "Create New Question"}</SheetTitle>
                    <SheetDescription>
                        {isEditing ? "Update the question details" : "Add a new question to the question bank"}
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="flex-1 -mx-6 px-6">
                    <form id="question-form" onSubmit={handleSubmit} className="flex flex-col gap-5 pb-4">
                        {/* Question Text */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">Question *</label>
                            <Textarea
                                placeholder="Enter the question text..."
                                value={questionText}
                                onChange={(e) => setQuestionText(e.target.value)}
                                className="min-h-[80px] resize-none rounded-xl"
                            />
                        </div>

                        {/* Type + Difficulty + Marks row */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium">Type</label>
                                <Select value={type} onValueChange={(v) => setType(v as QuestionType)}>
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(QUESTION_TYPE_LABELS).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium">Difficulty</label>
                                <Select value={difficulty} onValueChange={(v) => setDifficulty(v as DifficultyLevel)}>
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(DIFFICULTY_LABELS).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium">Marks</label>
                                <Input
                                    type="number"
                                    min={1}
                                    value={marks}
                                    onChange={(e) => setMarks(Number(e.target.value) || 1)}
                                    className="rounded-xl"
                                />
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">Tags</label>
                            <Input
                                placeholder="comma-separated: algebra, geometry, chapter-3"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                className="rounded-xl"
                            />
                        </div>

                        {/* Options (only for applicable types) */}
                        {showOptions && (
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium">
                                        Options {type === "multiple_select" ? "(select all correct)" : "(select one correct)"}
                                    </label>
                                    {type !== "true_or_false" && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={addOption}
                                            className="rounded-lg text-xs"
                                        >
                                            <IconPlus data-icon="inline-start" />
                                            Add option
                                        </Button>
                                    )}
                                </div>

                                {options.map((opt, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleOptionChange(idx, "isCorrect", !opt.isCorrect)
                                            }
                                            className={cn(
                                                "flex shrink-0 items-center justify-center rounded-full size-6 border-2 transition-colors",
                                                opt.isCorrect
                                                    ? "border-emerald-500 bg-emerald-500 text-white"
                                                    : "border-border hover:border-muted-foreground"
                                            )}
                                        >
                                            {opt.isCorrect && <IconCheck className="size-3.5" />}
                                        </button>
                                        <Input
                                            placeholder={`Option ${idx + 1}`}
                                            value={opt.text}
                                            onChange={(e) =>
                                                handleOptionChange(idx, "text", e.target.value)
                                            }
                                            className="rounded-xl flex-1"
                                            disabled={type === "true_or_false"}
                                        />
                                        {type !== "true_or_false" && options.length > 2 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeOption(idx)}
                                                className="size-8 shrink-0 rounded-lg text-muted-foreground hover:text-destructive"
                                            >
                                                <IconX />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Explanation */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">Explanation (optional)</label>
                            <Textarea
                                placeholder="Add an explanation for the correct answer..."
                                value={explanation}
                                onChange={(e) => setExplanation(e.target.value)}
                                className="min-h-[60px] resize-none rounded-xl"
                            />
                        </div>
                    </form>
                </ScrollArea>

                <div className="flex items-center justify-end gap-2 p-6 pt-2 border-t">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="rounded-xl"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="question-form"
                        disabled={isPending}
                        className="rounded-xl"
                    >
                        {isPending ? "Saving..." : isEditing ? "Update Question" : "Create Question"}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}

// ── Question Card (used in Bank panel & Quiz list) ────────────

interface QuestionCardProps {
    question: QuestionBankItem
    index?: number
    isDraggable?: boolean
    isSelected?: boolean
    onSelect?: () => void
    onEdit?: () => void
    onDuplicate?: () => void
    onDelete?: () => void
    onRemove?: () => void
    dragHandleProps?: Record<string, unknown>
    compact?: boolean
}

export function QuestionCard({
    question,
    index,
    isDraggable = false,
    isSelected = false,
    onSelect,
    onEdit,
    onDuplicate,
    onDelete,
    onRemove,
    dragHandleProps,
    compact = false,
}: QuestionCardProps) {
    const correctOptions = question.options.filter((o) => o.isCorrect)

    return (
        <div
            className={cn(
                "group relative rounded-xl border border-border/70 bg-card transition-all",
                isSelected && "border-primary/50 bg-primary/5 ring-1 ring-primary/20",
                isDraggable && "hover:border-border",
                !compact && "p-4"
            )}
        >
            <div className={cn("flex gap-3", compact && "p-3")}>
                {/* Drag handle */}
                {isDraggable && (
                    <div
                        {...dragHandleProps}
                        className="flex shrink-0 cursor-grab items-center text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
                    >
                        <IconGripVertical className="size-4" />
                    </div>
                )}

                {/* Checkbox for bank selection */}
                {onSelect && (
                    <div className="flex shrink-0 items-start pt-0.5">
                        <Checkbox
                            checked={isSelected}
                            onCheckedChange={onSelect}
                        />
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <p className={cn("font-medium leading-snug", compact ? "text-sm" : "text-sm")}>
                            {index !== undefined && (
                                <span className="text-muted-foreground mr-1.5">Q{index + 1}.</span>
                            )}
                            {question.question}
                        </p>

                        {/* Actions */}
                        <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {onEdit && (
                                <Button variant="ghost" size="icon" className="size-7 rounded-lg" onClick={onEdit}>
                                    <IconEdit className="size-3.5" />
                                </Button>
                            )}
                            {onDuplicate && (
                                <Button variant="ghost" size="icon" className="size-7 rounded-lg" onClick={onDuplicate}>
                                    <IconCopy className="size-3.5" />
                                </Button>
                            )}
                            {onDelete && (
                                <Button variant="ghost" size="icon" className="size-7 rounded-lg text-destructive hover:text-destructive" onClick={onDelete}>
                                    <IconTrash className="size-3.5" />
                                </Button>
                            )}
                            {onRemove && (
                                <Button variant="ghost" size="icon" className="size-7 rounded-lg text-destructive hover:text-destructive" onClick={onRemove}>
                                    <IconX className="size-3.5" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Meta */}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <TypeBadge type={question.type} />
                        <DifficultyBadge difficulty={question.difficulty} />
                        <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[11px]">
                            {question.marks} {question.marks === 1 ? "mark" : "marks"}
                        </Badge>
                        {question.tags.map((tag) => (
                            <Badge
                                key={tag}
                                variant="secondary"
                                className="rounded-full px-2 py-0.5 text-[11px] font-normal"
                            >
                                {tag}
                            </Badge>
                        ))}
                    </div>

                    {/* Options preview */}
                    {!compact && question.options.length > 0 && (
                        <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
                            {question.options.map((opt) => (
                                <div
                                    key={opt.id}
                                    className={cn(
                                        "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs",
                                        opt.isCorrect
                                            ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
                                            : "border-border/60 text-muted-foreground"
                                    )}
                                >
                                    {opt.isCorrect && <IconCircleCheck className="size-3.5 shrink-0" />}
                                    <span className="truncate">{opt.text}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Explanation */}
                    {!compact && question.explanation && (
                        <div className="mt-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                            <span className="font-medium">Explanation:</span> {question.explanation}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
