"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type HeatDay = {
  date: string; // YYYY-MM-DD
  seconds: number;
};

function intensity(seconds: number): 0 | 1 | 2 | 3 | 4 {
  if (seconds <= 0) return 0;
  const minutes = seconds / 60;
  if (minutes < 15) return 1;
  if (minutes < 45) return 2;
  if (minutes < 90) return 3;
  return 4;
}

export function StudyStreakHeatmap({
  days,
}: {
  days: HeatDay[]; // continuous 365 days
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to the end (right) on mount so today is visible
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [days]);

  // Pad days so the first day aligns with its weekday (0 = Sunday)
  const paddedDays: (HeatDay | null)[] = [];
  if (days.length > 0) {
    const firstDayDate = new Date(days[0].date);
    const firstDayOfWeek = firstDayDate.getDay(); // 0 (Sun) to 6 (Sat)
    for (let i = 0; i < firstDayOfWeek; i++) {
      paddedDays.push(null);
    }
    paddedDays.push(...days);
  }

  const weeks: (HeatDay | null)[][] = [];
  for (let i = 0; i < paddedDays.length; i += 7) {
    weeks.push(paddedDays.slice(i, i + 7));
  }

  const levelClass = (lvl: 0 | 1 | 2 | 3 | 4) => {
    switch (lvl) {
      case 0:
        return "bg-secondary/30 border-border/40";
      case 1:
        return "bg-[color-mix(in_oklab,var(--chart-1),transparent_75%)] border-[color-mix(in_oklab,var(--chart-1),transparent_60%)]";
      case 2:
        return "bg-[color-mix(in_oklab,var(--chart-1),transparent_55%)] border-[color-mix(in_oklab,var(--chart-1),transparent_40%)]";
      case 3:
        return "bg-[color-mix(in_oklab,var(--chart-1),transparent_35%)] border-[color-mix(in_oklab,var(--chart-1),transparent_25%)]";
      case 4:
        return "bg-[color-mix(in_oklab,var(--chart-1),transparent_10%)] border-[color-mix(in_oklab,var(--chart-1),transparent_0%)]";
    }
  };

  // Month labels logic
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
    <div className="flex w-full flex-col gap-2">
      <div 
        ref={scrollRef}
        className="flex w-full overflow-x-auto pb-4 scroll-smooth [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full"
      >
        <div className="flex min-w-max flex-col pr-4">
          {/* Months Header */}
          <div className="relative mb-2 ml-8 flex h-4 text-xs text-muted-foreground">
            {monthLabels.map((m, i) => (
              <div
                key={i}
                className="absolute"
                style={{ left: `${m.colIndex * 16}px` }} // 12px width + 4px gap = 16px per column
              >
                {m.label}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            {/* Weekdays Side Labels */}
            <div className="relative h-[108px] w-6 text-[10px] text-muted-foreground">
              <span className="absolute right-1 top-[14px]">Mon</span>
              <span className="absolute right-1 top-[46px]">Wed</span>
              <span className="absolute right-1 top-[78px]">Fri</span>
            </div>

            {/* Heatmap Grid */}
            <div className="flex h-[108px] gap-1">
              <TooltipProvider delayDuration={100}>
                {weeks.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-1">
                    {week.map((d, dIdx) => {
                      if (!d) {
                        return <div key={`empty-${dIdx}`} className="size-[12px] rounded-[3px] bg-transparent" />;
                      }
                      
                      const lvl = intensity(d.seconds);
                      const minutes = Math.round(d.seconds / 60);
                      const dateObj = new Date(d.date);
                      const formattedDate = dateObj.toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric"
                      });

                      return (
                        <Tooltip key={d.date}>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "size-[12px] rounded-[3px] border transition-all hover:ring-2 hover:ring-ring hover:ring-offset-1 hover:ring-offset-background",
                                levelClass(lvl)
                              )}
                              role="img"
                              aria-label={`${formattedDate}: ${minutes} minutes`}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs font-medium">
                            <p>
                              <span className="font-bold text-foreground">
                                {minutes} min{minutes !== 1 ? 's' : ''}
                              </span>{" "}
                              on {formattedDate}
                            </p>
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

      <div className="mt-1 flex items-center justify-end gap-2 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex items-center gap-1">
          {[0, 1, 2, 3, 4].map((lvl) => (
            <div
              key={lvl}
              className={cn(
                "size-[12px] rounded-[3px] border",
                levelClass(lvl as 0 | 1 | 2 | 3 | 4)
              )}
            />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
}

