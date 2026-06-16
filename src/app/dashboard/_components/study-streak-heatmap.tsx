"use client";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type HeatDay = {
  date: string;
  seconds: number;
};

function intensity(seconds: number): 0 | 1 | 2 | 3 {
  if (seconds <= 0) return 0;
  const lectures = Math.max(1, Math.round(seconds / 1200));
  if (lectures <= 2) return 1;
  if (lectures <= 5) return 2;
  return 3;
}

const levelClass = (lvl: 0 | 1 | 2 | 3) => {
  switch (lvl) {
    case 0:
      return "bg-muted";
    case 1:
      return "bg-primary/20";
    case 2:
      return "bg-primary/50";
    case 3:
      return "bg-primary";
  }
};

export function StudyStreakHeatmap({
  days,
  lecturesByDate = {},
}: {
  days: HeatDay[];
  lecturesByDate?: Record<string, number>;
}) {
  const reversed = [...days].reverse();
  const paddedDays: (HeatDay | null)[] = [];
  if (reversed.length > 0) {
    const firstDayDate = new Date(reversed[0].date);
    const firstDayOfWeek = firstDayDate.getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
      paddedDays.push(null);
    }
    paddedDays.push(...reversed);
  }

  const weeks: (HeatDay | null)[][] = [];
  for (let i = 0; i < paddedDays.length; i += 7) {
    weeks.push(paddedDays.slice(i, i + 7));
  }

  const monthLabels: { label: string; colIndex: number }[] = [];
  let currentMonth = -1;
  weeks.forEach((week, wIdx) => {
    const firstValidDay = week.find((d) => d !== null);
    if (firstValidDay) {
      const month = new Date(firstValidDay.date).getMonth();
      if (month !== currentMonth) {
        monthLabels.push({
          label: new Date(firstValidDay.date).toLocaleString("en-US", { month: "short" }),
          colIndex: wIdx,
        });
        currentMonth = month;
      }
    }
  });

  return (
    <div className="flex w-full flex-col gap-3" role="img" aria-label="Study activity heatmap for the past year">
      <div className="overflow-x-auto scrollbar-hide pb-2">
        <div className="flex min-w-max flex-col">
          <div className="relative mb-2 ml-10 flex h-4 text-[10px] text-muted-foreground">
            {monthLabels.map((m, i) => (
              <div key={i} className="absolute" style={{ left: `${m.colIndex * 16}px` }}>
                {m.label}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="relative w-8 text-[10px] text-muted-foreground">
              <span className="absolute top-2 right-0">Mon</span>
              <span className="absolute top-[38px] right-0">Wed</span>
              <span className="absolute top-[74px] right-0">Fri</span>
            </div>
            <div className="flex gap-[3px]">
              <TooltipProvider delayDuration={80}>
                {weeks.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-[3px]">
                    {week.map((d, dIdx) => {
                      if (!d) {
                        return (
                          <div
                            key={`empty-${dIdx}`}
                            className="size-1 rounded-sm bg-transparent sm:size-3"
                          />
                        );
                      }
                      const lvl = intensity(d.seconds);
                      const lectures =
                        lecturesByDate[d.date] ??
                        (d.seconds > 0 ? Math.max(1, Math.round(d.seconds / 1200)) : 0);
                      const formattedDate = new Date(d.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      });
                      return (
                        <Tooltip key={d.date}>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "size-1 rounded-sm transition-colors sm:size-3",
                                levelClass(lvl),
                              )}
                              aria-label={`${formattedDate}: ${lectures} lectures watched`}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            <span className="font-semibold">
                              {lectures} lecture{lectures !== 1 ? "s" : ""} watched
                            </span>
                            {" · "}
                            {formattedDate}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                ))}
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
        <span>Less</span>
        <div className="flex items-center gap-1">
          {([0, 1, 2, 3] as const).map((lvl) => (
            <div key={lvl} className={cn("size-2 rounded-sm sm:size-3", levelClass(lvl))} />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
