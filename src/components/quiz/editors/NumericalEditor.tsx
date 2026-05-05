"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { QuestionFormData } from "@/types/quiz";

interface Props { data: QuestionFormData; onChange: (d: Partial<QuestionFormData>) => void; }

export function NumericalEditor({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Correct Answer *</Label>
          <Input type="number" value={data.numerical_answer ?? ""} onChange={(e) => onChange({ numerical_answer: e.target.value ? Number(e.target.value) : null })} placeholder="e.g., 42.5" />
        </div>
        <div className="space-y-2">
          <Label>Tolerance (±)</Label>
          <Input type="number" value={data.numerical_tolerance ?? 0} onChange={(e) => onChange({ numerical_tolerance: Number(e.target.value) || 0 })} placeholder="e.g., 0.5" />
          <p className="text-xs text-muted-foreground">Accepted range: {(data.numerical_answer ?? 0) - (data.numerical_tolerance ?? 0)} to {(data.numerical_answer ?? 0) + (data.numerical_tolerance ?? 0)}</p>
        </div>
      </div>
    </div>
  );
}
