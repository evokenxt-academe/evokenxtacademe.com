"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { QuestionFormData } from "@/types/quiz";

const AR_OPTIONS = [
  "Both A and R are true, and R is the correct explanation of A",
  "Both A and R are true, but R is NOT the correct explanation of A",
  "A is true but R is false",
  "A is false but R is true",
  "Both A and R are false",
];

interface Props { data: QuestionFormData; onChange: (d: Partial<QuestionFormData>) => void; }

export function AssertionReasonEditor({ data, onChange }: Props) {
  const options = data.options ?? AR_OPTIONS.map((text, i) => ({ option_text: text, is_correct: i === 0, position: i }));
  const correctIdx = options.findIndex((o) => o.is_correct);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Assertion (A)</Label>
        <Textarea value={data.assertion_text || ""} onChange={(e) => onChange({ assertion_text: e.target.value })} placeholder="Enter the assertion statement..." />
      </div>
      <div className="space-y-2">
        <Label>Reason (R)</Label>
        <Textarea value={data.reason_text || ""} onChange={(e) => onChange({ reason_text: e.target.value })} placeholder="Enter the reason statement..." />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">Correct Answer</Label>
        <RadioGroup value={String(correctIdx)} onValueChange={(v) => {
          const idx = Number(v);
          onChange({ options: options.map((o, i) => ({ ...o, is_correct: i === idx })) });
        }}>
          {AR_OPTIONS.map((text, i) => (
            <div key={i} className="flex items-start gap-2">
              <RadioGroupItem value={String(i)} className="mt-0.5" />
              <Label className="text-sm">{String.fromCharCode(65 + i)}. {text}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
}
