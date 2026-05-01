"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { IconClockHour4 } from "@tabler/icons-react";

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
  const unanswered = totalQuestions - answeredCount;

  return (
    <Card className="rounded-xl border-border/60">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm">Question Map</CardTitle>
        <Badge variant="outline" className="text-xs">
          {answeredCount}/{totalQuestions}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-0">
        {/* Progress */}
        <div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>Answered</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Timer */}
        {timeLabel ? (
          <>
            <Separator />
            <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <IconClockHour4 className="size-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Time Left</span>
              </div>
              <Badge
                variant={isDangerTime ? "destructive" : "secondary"}
                className="font-mono text-sm tabular-nums px-2.5"
              >
                {timeLabel}
              </Badge>
            </div>
          </>
        ) : null}

        {/* Unanswered indicator */}
        {unanswered > 0 && (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-amber-600">{unanswered}</span> unanswered
          </p>
        )}

        {/* Question Grid */}
        <ScrollArea className="h-52 md:h-56">
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
                    "h-8 px-0 text-xs font-medium",
                    isCurrent && "border-primary bg-primary text-primary-foreground",
                    !isCurrent && isAnswered && "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
                    !isCurrent && !isAnswered && "text-muted-foreground",
                  )}
                  onClick={() => onJump(index)}
                >
                  {index + 1}
                </Button>
              );
            })}
          </div>
        </ScrollArea>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="size-3 rounded border-2 border-primary bg-primary" />
            <span>Current</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-3 rounded border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10" />
            <span>Answered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-3 rounded border-2 border-border" />
            <span>Unanswered</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
