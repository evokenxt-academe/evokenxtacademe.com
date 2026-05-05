"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import type { QuestionFormData } from "@/types/quiz";

interface McqEditorProps {
  data: QuestionFormData;
  onChange: (data: Partial<QuestionFormData>) => void;
}

export function McqEditor({ data, onChange }: McqEditorProps) {
  const options = data.options ?? [
    { option_text: "", is_correct: false, position: 0 },
    { option_text: "", is_correct: false, position: 1 },
    { option_text: "", is_correct: false, position: 2 },
    { option_text: "", is_correct: false, position: 3 },
  ];

  const updateOption = (index: number, field: string, value: any) => {
    const next = options.map((o, i) => {
      if (field === "is_correct") return { ...o, is_correct: i === index };
      return i === index ? { ...o, [field]: value } : o;
    });
    onChange({ options: next });
  };

  const addOption = () => {
    onChange({ options: [...options, { option_text: "", is_correct: false, position: options.length }] });
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    onChange({ options: options.filter((_, i) => i !== index).map((o, i) => ({ ...o, position: i })) });
  };

  const correctIndex = options.findIndex((o) => o.is_correct);

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Options (select correct answer)</Label>
      <RadioGroup value={String(correctIndex)} onValueChange={(v) => updateOption(Number(v), "is_correct", true)}>
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground/40 cursor-grab" />
            <RadioGroupItem value={String(i)} />
            <span className="text-xs font-mono text-muted-foreground w-5">{String.fromCharCode(65 + i)}.</span>
            <Input
              value={opt.option_text}
              onChange={(e) => updateOption(i, "option_text", e.target.value)}
              placeholder={`Option ${String.fromCharCode(65 + i)}`}
              className="flex-1"
            />
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => removeOption(i)} disabled={options.length <= 2}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </RadioGroup>
      <Button variant="outline" size="sm" onClick={addOption}><Plus className="mr-1 h-3.5 w-3.5" />Add Option</Button>
    </div>
  );
}
