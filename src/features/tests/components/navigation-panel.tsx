"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface NavigationPanelProps {
  totalQuestions: number;
  questionIds: string[];
  currentIndex: number;
  answeredCount: number;
  answeredQuestionIds: Set<string>;
  timeLabel: string | null;
  isDangerTime: boolean;
  onJump: (index: number) => void;
}

export function NavigationPanel({
  totalQuestions,
  questionIds,
  currentIndex,
  answeredCount,
  answeredQuestionIds,
  timeLabel,
  isDangerTime,
  onJump,
}: NavigationPanelProps) {
  const progress = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  return (
    <Card className="border-border/70">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm">Question map</CardTitle>
        <Badge variant="outline">
          {answeredCount}/{totalQuestions}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Progress value={progress} />
        {timeLabel ? (
          <div className="rounded-md border bg-muted/20 px-3 py-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Time remaining</p>
            <Badge variant={isDangerTime ? "destructive" : "secondary"} className="mt-1">
              {timeLabel}
            </Badge>
          </div>
        ) : null}
        <ScrollArea className="h-56">
          <div className="grid grid-cols-5 gap-2 pr-3">
            {Array.from({ length: totalQuestions }).map((_, index) => {
              const isCurrent = index === currentIndex;
              const questionId = questionIds[index];
              const isAnswered = answeredQuestionIds.has(questionId);
              return (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-8 px-0",
                    isCurrent && "border-primary bg-primary text-primary-foreground",
                    !isCurrent && isAnswered && "border-primary text-primary",
                  )}
                  onClick={() => onJump(index)}
                >
                  {index + 1}
                </Button>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
