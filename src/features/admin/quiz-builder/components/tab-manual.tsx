"use client";

import * as React from "react";
import { toast } from "sonner";
import { IconCheck, IconPlus, IconX } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { FileUploader } from "@/components/file-uploader";

import type {
  CreateQuestionPayload,
  DifficultyLevel,
  QuestionBankItem,
  QuestionType,
} from "../types";
import {
  DIFFICULTY_LABELS,
  QUESTION_TYPE_LABELS,
  questionTypeHasFreeAnswer,
  questionTypeHasOptions,
} from "../types";
import {
  useCreateQuestion,
  useUpdateQuestion,
} from "../hooks/use-quiz-builder";

// ── Types ─────────────────────────────────────────────────────

interface TabManualProps {
  quizId: string | null;
  editingQuestion?: QuestionBankItem | null;
  onSaved?: () => void;
  onCancel?: () => void;
}

interface OptionInput {
  text: string;
  isCorrect: boolean;
}

const defaultOptions: OptionInput[] = [
  { text: "", isCorrect: false },
  { text: "", isCorrect: false },
  { text: "", isCorrect: false },
  { text: "", isCorrect: false },
];

// ── Component ─────────────────────────────────────────────────

export function TabManual({
  quizId,
  editingQuestion,
  onSaved,
  onCancel,
}: TabManualProps) {
  const createMutation = useCreateQuestion();
  const updateMutation = useUpdateQuestion();
  const isEditing = !!editingQuestion;

  const [questionText, setQuestionText] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [type, setType] = React.useState<QuestionType>("mcq");
  const [difficulty, setDifficulty] = React.useState<DifficultyLevel>("medium");
  const [explanation, setExplanation] = React.useState("");
  const [explanationImageUrl, setExplanationImageUrl] = React.useState<
    string | null
  >(null);
  const [marks, setMarks] = React.useState(1);
  const [tags, setTags] = React.useState("");
  const [options, setOptions] = React.useState<OptionInput[]>(defaultOptions);

  // Populate form when editing
  React.useEffect(() => {
    if (editingQuestion) {
      setQuestionText(editingQuestion.question);
      setImageUrl(editingQuestion.imageUrl ?? null);
      setType(editingQuestion.type);
      setDifficulty(editingQuestion.difficulty);
      setExplanation(editingQuestion.explanation ?? "");
      setExplanationImageUrl(editingQuestion.explanationImageUrl ?? null);
      setMarks(editingQuestion.marks);
      setTags(editingQuestion.tags.join(", "));
      setOptions(
        editingQuestion.options.length > 0
          ? editingQuestion.options.map((option) => ({
              text: option.text,
              isCorrect: option.isCorrect,
            }))
          : defaultOptions
      );
      return;
    }

    setQuestionText("");
    setImageUrl(null);
    setType("mcq");
    setDifficulty("medium");
    setExplanation("");
    setExplanationImageUrl(null);
    setMarks(1);
    setTags("");
    setOptions(defaultOptions);
  }, [editingQuestion]);

  // Auto-set options for True/False
  React.useEffect(() => {
    if (type === "true_or_false") {
      setOptions([
        { text: "True", isCorrect: false },
        { text: "False", isCorrect: false },
      ]);
    } else if (questionTypeHasFreeAnswer(type)) {
      setOptions([]);
    } else if (options.length === 0) {
      setOptions(defaultOptions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  function handleOptionChange(
    index: number,
    field: keyof OptionInput,
    value: string | boolean
  ) {
    setOptions((prev) =>
      prev.map((option, optionIndex) => {
        if (optionIndex !== index) {
          if (
            field === "isCorrect" &&
            value === true &&
            (type === "mcq" || type === "true_or_false")
          ) {
            return { ...option, isCorrect: false };
          }
          return option;
        }

        if (
          field === "isCorrect" &&
          value === true &&
          (type === "mcq" || type === "true_or_false")
        ) {
          return { ...option, isCorrect: true };
        }

        return { ...option, [field]: value };
      })
    );
  }

  function addOption() {
    setOptions((prev) => [...prev, { text: "", isCorrect: false }]);
  }

  function removeOption(index: number) {
    if (options.length <= 2) return;
    setOptions((prev) =>
      prev.filter((_, optionIndex) => optionIndex !== index)
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!questionText.trim()) {
      toast.error("Question text is required");
      return;
    }

    const requiresOptions = questionTypeHasOptions(type);
    const normalizedOptions = options.filter((option) => option.text.trim());

    if (requiresOptions) {
      if (normalizedOptions.length < 2) {
        toast.error("At least 2 options are required");
        return;
      }

      if (!normalizedOptions.some((option) => option.isCorrect)) {
        toast.error("At least one option must be marked correct");
        return;
      }
    }

    const payload: CreateQuestionPayload = {
      quizId: quizId ?? undefined,
      question: questionText.trim(),
      imageUrl: imageUrl || undefined,
      type,
      explanation: explanation.trim() || undefined,
      explanationImageUrl: explanationImageUrl || undefined,
      difficulty,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      marks,
      options: requiresOptions
        ? normalizedOptions.map((option, optionIndex) => ({
            text: option.text.trim(),
            isCorrect: option.isCorrect,
            position: optionIndex,
          }))
        : [],
    };

    try {
      if (isEditing && editingQuestion) {
        await updateMutation.mutateAsync({
          id: editingQuestion.id,
          ...payload,
        });
      } else {
        await createMutation.mutateAsync(payload);
      }

      // Reset form after successful create
      if (!isEditing) {
        setQuestionText("");
        setImageUrl(null);
        setType("mcq");
        setDifficulty("medium");
        setExplanation("");
        setExplanationImageUrl(null);
        setMarks(1);
        setTags("");
        setOptions(defaultOptions);
      }

      onSaved?.();
    } catch {
      // Mutation handles toast feedback.
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Question Text */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Question *</label>
        <Textarea
          placeholder="Enter the question text..."
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          className="min-h-[120px] resize-y rounded-xl"
        />
        {imageUrl ? (
          <div className="relative mt-2 max-w-sm overflow-hidden rounded-xl border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Question Diagram"
              className="h-auto w-full object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute right-2 top-2 size-7"
              onClick={() => setImageUrl(null)}
            >
              <IconX className="size-4" />
            </Button>
          </div>
        ) : (
          <div className="mt-1">
            <FileUploader
              accept="image/jpeg, image/png, image/webp"
              maxSizeMB={5}
              folder="question-bank-images"
              onUploadComplete={setImageUrl}
            />
          </div>
        )}
      </div>

      {/* Type / Difficulty / Marks */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Type</label>
          <Select
            value={type}
            onValueChange={(value) => setType(value as QuestionType)}
          >
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
          <Select
            value={difficulty}
            onValueChange={(value) =>
              setDifficulty(value as DifficultyLevel)
            }
          >
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

      {/* Options */}
      {!questionTypeHasFreeAnswer(type) && (
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 border-b bg-muted/20 px-5 py-3.5">
            <div>
              <CardTitle className="text-sm font-semibold">
                Options{" "}
                {type === "multiple_select"
                  ? "(select all correct)"
                  : "(select one correct)"}
              </CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Mark the correct answer(s) for this question.
              </p>
            </div>
            {type !== "true_or_false" ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
                className="rounded-xl text-xs"
              >
                <IconPlus className="mr-1.5 size-3.5" />
                Add Option
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="flex flex-col gap-3 p-5">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    handleOptionChange(index, "isCorrect", !option.isCorrect)
                  }
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center border transition-colors",
                    option.isCorrect
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input hover:bg-accent hover:text-accent-foreground",
                    type === "mcq" || type === "true_or_false"
                      ? "rounded-full"
                      : "rounded-sm"
                  )}
                >
                  {option.isCorrect ? (
                    <IconCheck className="size-3.5" />
                  ) : null}
                </button>
                <Input
                  placeholder={`Option ${index + 1}`}
                  value={option.text}
                  onChange={(e) =>
                    handleOptionChange(index, "text", e.target.value)
                  }
                  className="flex-1 rounded-xl"
                  disabled={type === "true_or_false"}
                />
                {type !== "true_or_false" && options.length > 2 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOption(index)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <IconX className="size-4" />
                  </Button>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Explanation */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Explanation (optional)</label>
        <Textarea
          placeholder="Add an explanation for the correct answer..."
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          className="min-h-[100px] resize-y rounded-xl"
        />
        {explanationImageUrl ? (
          <div className="relative mt-2 max-w-sm overflow-hidden rounded-xl border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={explanationImageUrl}
              alt="Explanation Diagram"
              className="h-auto w-full object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute right-2 top-2 size-7"
              onClick={() => setExplanationImageUrl(null)}
            >
              <IconX className="size-4" />
            </Button>
          </div>
        ) : (
          <div className="mt-1">
            <FileUploader
              accept="image/jpeg, image/png, image/webp"
              maxSizeMB={5}
              folder="question-bank-images"
              onUploadComplete={setExplanationImageUrl}
            />
          </div>
        )}
      </div>

      <Separator />

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl">
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={isPending} className="rounded-xl">
          {isPending
            ? "Saving..."
            : isEditing
              ? "Update Question"
              : "Create Question"}
        </Button>
      </div>
    </form>
  );
}
