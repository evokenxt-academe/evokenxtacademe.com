"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import type { QuestionFormData } from "@/types/quiz";

interface Props { data: QuestionFormData; onChange: (d: Partial<QuestionFormData>) => void; }

export function FillBlankEditor({ data, onChange }: Props) {
  const options = data.options ?? [{ option_text: "", is_correct: true, position: 0 }];

  return (
    <div className="space-y-4">
      <Alert><Info className="h-4 w-4" /><AlertDescription>Use ___ in the question text to mark where the blank should appear.</AlertDescription></Alert>
      <div className="space-y-2">
        <Label>Correct Answer</Label>
        <Input value={options[0]?.option_text || ""} onChange={(e) => onChange({ options: [{ option_text: e.target.value, is_correct: true, position: 0 }] })} placeholder="Exact answer text" />
      </div>
      <div className="space-y-2">
        <Label>Hint (optional)</Label>
        <Input value={data.blank_placeholder || ""} onChange={(e) => onChange({ blank_placeholder: e.target.value })} placeholder="Hint shown to student" />
      </div>
    </div>
  );
}
