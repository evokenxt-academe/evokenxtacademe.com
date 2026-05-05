"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { QuestionFormData } from "@/types/quiz";

interface Props { data: QuestionFormData; onChange: (d: Partial<QuestionFormData>) => void; }

export function TrueFalseEditor({ data, onChange }: Props) {
  const options = data.options ?? [
    { option_text: "True", is_correct: true, position: 0 },
    { option_text: "False", is_correct: false, position: 1 },
  ];

  const correctIdx = options.findIndex((o) => o.is_correct);

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Correct Answer</Label>
      <RadioGroup value={String(correctIdx)} onValueChange={(v) => {
        const idx = Number(v);
        onChange({ options: options.map((o, i) => ({ ...o, is_correct: i === idx })) });
      }}>
        <div className="flex items-center gap-3"><RadioGroupItem value="0" /><Label>True</Label></div>
        <div className="flex items-center gap-3"><RadioGroupItem value="1" /><Label>False</Label></div>
      </RadioGroup>
    </div>
  );
}
