"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import type { QuestionFormData } from "@/types/quiz";

interface Props { data: QuestionFormData; onChange: (d: Partial<QuestionFormData>) => void; }

export function MultiSelectEditor({ data, onChange }: Props) {
  const options = data.options ?? [
    { option_text: "", is_correct: false, position: 0 },
    { option_text: "", is_correct: false, position: 1 },
    { option_text: "", is_correct: false, position: 2 },
    { option_text: "", is_correct: false, position: 3 },
  ];

  const updateOption = (i: number, field: string, value: any) => {
    const next = options.map((o, idx) => idx === i ? { ...o, [field]: value } : o);
    onChange({ options: next });
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Options (check all correct answers)</Label>
      {options.map((opt, i) => (
        <div key={i} className="flex items-center gap-2">
          <Checkbox checked={opt.is_correct} onCheckedChange={(c) => updateOption(i, "is_correct", !!c)} />
          <span className="text-xs font-mono text-muted-foreground w-5">{String.fromCharCode(65 + i)}.</span>
          <Input value={opt.option_text} onChange={(e) => updateOption(i, "option_text", e.target.value)} placeholder={`Option ${String.fromCharCode(65 + i)}`} className="flex-1" />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { if (options.length > 2) onChange({ options: options.filter((_, idx) => idx !== i) }); }} disabled={options.length <= 2}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange({ options: [...options, { option_text: "", is_correct: false, position: options.length }] })}><Plus className="mr-1 h-3.5 w-3.5" />Add Option</Button>
    </div>
  );
}
