"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { QuestionFormData } from "@/types/quiz";

interface Props { data: QuestionFormData; onChange: (d: Partial<QuestionFormData>) => void; }

export function SubjectiveEditor({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Model Answer (instructor reference)</Label>
        <Textarea value={data.model_answer || ""} onChange={(e) => onChange({ model_answer: e.target.value })} placeholder="This is the reference answer for manual grading..." className="min-h-[120px]" />
        <p className="text-xs text-muted-foreground">Not shown to students. Used as a grading reference.</p>
      </div>
    </div>
  );
}
