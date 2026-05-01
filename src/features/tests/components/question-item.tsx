"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
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
    <Card className="rounded-xl border-border/60">
      <CardHeader className="flex flex-row items-start justify-between gap-3 border-b bg-muted/20 px-5 py-4">
        <div className="flex flex-col gap-2">
          <Badge variant="outline" className="w-fit text-xs">
            Question {questionNumber}
          </Badge>
          <CardTitle className="text-base leading-relaxed md:text-lg">
            {question.question}
          </CardTitle>
        </div>
        <Badge variant="secondary" className="shrink-0">{question.marks} marks</Badge>
      </CardHeader>
      <CardContent className="px-5 py-5">
        <RadioGroup
          value={selectedOptionId}
          onValueChange={onSelect}
          className="flex flex-col gap-3"
        >
          {question.options.map((option, index) => {
            const isSelected = selectedOptionId === option.id;
            return (
              <Label
                key={option.id}
                htmlFor={option.id}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3.5 text-sm transition-all md:py-4",
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "hover:bg-muted/40 hover:border-border",
                )}
              >
                <RadioGroupItem id={option.id} value={option.id} className="mt-0.5" />
                <span className="flex-1 leading-relaxed">
                  <span className="mr-2 font-semibold text-muted-foreground">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  {option.text}
                </span>
              </Label>
            );
          })}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
