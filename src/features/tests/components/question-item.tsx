"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { QuizQuestionLite } from "@/features/tests/types";

interface QuestionItemProps {
  question: QuizQuestionLite;
  questionNumber: number;
  selectedOptionId?: string;
  onSelect: (optionId: string) => void;
}

export function QuestionItem({
  question,
  questionNumber,
  selectedOptionId,
  onSelect,
}: QuestionItemProps) {
  return (
    <Card className="border-border/70">
      <CardHeader className="flex flex-row items-start justify-between gap-2 border-b bg-muted/20">
        <div className="flex flex-col gap-2">
          <Badge variant="outline">Question {questionNumber}</Badge>
          <CardTitle className="text-base leading-6">{question.question}</CardTitle>
        </div>
        <Badge variant="secondary">{question.marks} marks</Badge>
      </CardHeader>
      <CardContent>
        <RadioGroup value={selectedOptionId} onValueChange={onSelect} className="flex flex-col gap-3">
          {question.options.map((option, index) => (
            <Label
              key={option.id}
              htmlFor={option.id}
              className="flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm transition-colors hover:bg-muted/30"
            >
              <RadioGroupItem id={option.id} value={option.id} />
              <span className="flex-1">
                <span className="mr-2 font-medium text-muted-foreground">
                  {String.fromCharCode(65 + index)}.
                </span>
                {option.text}
              </span>
            </Label>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
