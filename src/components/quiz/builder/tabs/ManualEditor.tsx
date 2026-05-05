"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ImageUploadZone } from "@/components/quiz/ImageUploadZone";
import { McqEditor } from "@/components/quiz/editors/McqEditor";
import { MultiSelectEditor } from "@/components/quiz/editors/MultiSelectEditor";
import { TrueFalseEditor } from "@/components/quiz/editors/TrueFalseEditor";
import { AssertionReasonEditor } from "@/components/quiz/editors/AssertionReasonEditor";
import { FillBlankEditor } from "@/components/quiz/editors/FillBlankEditor";
import { NumericalEditor } from "@/components/quiz/editors/NumericalEditor";
import { SubjectiveEditor } from "@/components/quiz/editors/SubjectiveEditor";
import { useSaveQuestion } from "@/hooks/useQuestions";
import { toast } from "sonner";
import type { QuestionFormData, QuestionType, QuestionWithOptions } from "@/types/quiz";
import { ListChecks, CheckSquare, ToggleLeft, Scale, TextCursorInput, Hash, FileText, Save, ArrowRight } from "lucide-react";

const TYPE_OPTIONS: { value: QuestionType; label: string; icon: any }[] = [
  { value: "mcq", label: "MCQ", icon: ListChecks },
  { value: "multiple_select", label: "Multi Select", icon: CheckSquare },
  { value: "true_false", label: "True/False", icon: ToggleLeft },
  { value: "assertion_reasoning", label: "Assertion", icon: Scale },
  { value: "fill_blank", label: "Fill Blank", icon: TextCursorInput },
  { value: "numerical", label: "Numerical", icon: Hash },
  { value: "subjective", label: "Subjective", icon: FileText },
];

interface ManualEditorProps {
  quizId: string;
  question: QuestionWithOptions | null;
  onSaved?: () => void;
}

export function ManualEditor({ quizId, question, onSaved }: ManualEditorProps) {
  const saveMutation = useSaveQuestion(quizId);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const [form, setForm] = useState<QuestionFormData>(() => {
    if (question) return {
      type: question.type, question_text: question.question_text,
      question_image_url: question.question_image_url, marks: question.marks,
      negative_marks: question.negative_marks, source_ref: question.source_ref,
      is_mandatory: question.is_mandatory, explanation: question.explanation,
      explanation_image_url: question.explanation_image_url,
      blank_placeholder: question.blank_placeholder, assertion_text: question.assertion_text,
      reason_text: question.reason_text, numerical_answer: question.numerical_answer,
      numerical_tolerance: question.numerical_tolerance, model_answer: question.model_answer,
      options: question.options?.map((o) => ({ option_text: o.option_text, is_correct: o.is_correct, position: o.position, explanation: o.explanation })) ?? [],
    };
    return {
      type: "mcq", question_text: "", marks: 1, negative_marks: 0, is_mandatory: true,
      options: [
        { option_text: "", is_correct: false, position: 0 },
        { option_text: "", is_correct: false, position: 1 },
        { option_text: "", is_correct: false, position: 2 },
        { option_text: "", is_correct: false, position: 3 },
      ],
    };
  });

  // Reset form when question changes
  useEffect(() => {
    if (question) {
      setForm({
        type: question.type, question_text: question.question_text,
        question_image_url: question.question_image_url, marks: question.marks,
        negative_marks: question.negative_marks, source_ref: question.source_ref,
        is_mandatory: question.is_mandatory, explanation: question.explanation,
        explanation_image_url: question.explanation_image_url,
        blank_placeholder: question.blank_placeholder, assertion_text: question.assertion_text,
        reason_text: question.reason_text, numerical_answer: question.numerical_answer,
        numerical_tolerance: question.numerical_tolerance, model_answer: question.model_answer,
        options: question.options?.map((o) => ({ option_text: o.option_text, is_correct: o.is_correct, position: o.position, explanation: o.explanation })) ?? [],
      });
    }
  }, [question?.id]);

  const update = useCallback((partial: Partial<QuestionFormData>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleSave = useCallback(async (andNext = false) => {
    if (!form.question_text) { toast.error("Question text is required"); return; }
    try {
      await saveMutation.mutateAsync({ questionId: question?.id ?? null, data: form });
      setLastSaved(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      if (andNext) {
        setForm({ type: "mcq", question_text: "", marks: 1, negative_marks: 0, is_mandatory: true, options: [{ option_text: "", is_correct: false, position: 0 }, { option_text: "", is_correct: false, position: 1 }, { option_text: "", is_correct: false, position: 2 }, { option_text: "", is_correct: false, position: 3 }] });
      }
      onSaved?.();
    } catch {}
  }, [form, question?.id, saveMutation, onSaved]);

  const renderTypeEditor = () => {
    switch (form.type) {
      case "mcq": return <McqEditor data={form} onChange={update} />;
      case "multiple_select": return <MultiSelectEditor data={form} onChange={update} />;
      case "true_false": return <TrueFalseEditor data={form} onChange={update} />;
      case "assertion_reasoning": return <AssertionReasonEditor data={form} onChange={update} />;
      case "fill_blank": return <FillBlankEditor data={form} onChange={update} />;
      case "numerical": return <NumericalEditor data={form} onChange={update} />;
      case "subjective": return <SubjectiveEditor data={form} onChange={update} />;
    }
  };

  return (
    <div className="space-y-6 p-1">
      {/* Type Selector */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Question Type</Label>
        <div className="grid grid-cols-4 lg:grid-cols-7 gap-2">
          {TYPE_OPTIONS.map((t) => (
            <button key={t.value} onClick={() => update({ type: t.value })}
              className={`flex flex-col items-center gap-1 rounded-lg border p-2.5 text-xs transition-all ${form.type === t.value ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50"}`}>
              <t.icon className="h-4 w-4" />{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Common Fields */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5"><Label className="text-xs">Marks *</Label><Input type="number" value={form.marks} onChange={(e) => update({ marks: Number(e.target.value) || 1 })} /></div>
        <div className="space-y-1.5"><Label className="text-xs">Negative Marks</Label><Input type="number" value={form.negative_marks} onChange={(e) => update({ negative_marks: Number(e.target.value) || 0 })} /></div>
        <div className="space-y-1.5"><Label className="text-xs">Source Ref</Label><Input value={form.source_ref || ""} onChange={(e) => update({ source_ref: e.target.value })} placeholder="ACCA BT 2021 Q5" /></div>
      </div>

      <div className="space-y-2">
        <Label>Question Text *</Label>
        <Textarea value={form.question_text} onChange={(e) => update({ question_text: e.target.value })} placeholder="Enter your question..." className="min-h-[100px]" />
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Question Image (optional)</Label>
        <ImageUploadZone value={form.question_image_url ?? null} onChange={(url) => update({ question_image_url: url })} />
      </div>

      <Separator />

      {/* Type-specific editor */}
      {renderTypeEditor()}

      <Separator />

      {/* Explanation */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Explanation</Label>
        <Textarea value={form.explanation || ""} onChange={(e) => update({ explanation: e.target.value })} placeholder="Explain the correct answer..." className="min-h-[80px]" />
        <Label className="text-xs text-muted-foreground">Explanation Image</Label>
        <ImageUploadZone value={form.explanation_image_url ?? null} onChange={(url) => update({ explanation_image_url: url })} folder="explanation-images" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t">
        {lastSaved && <p className="text-xs text-muted-foreground">Last saved at {lastSaved}</p>}
        <div className="flex items-center gap-2 ml-auto">
          <Button variant="outline" onClick={() => onSaved?.()}>Cancel</Button>
          <Button onClick={() => handleSave(false)} disabled={saveMutation.isPending}>
            <Save className="mr-1.5 h-3.5 w-3.5" />{saveMutation.isPending ? "Saving..." : "Save Question"}
          </Button>
          <Button variant="secondary" onClick={() => handleSave(true)} disabled={saveMutation.isPending}>
            Save & Add Next<ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
