"use client";

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

export function StudyStreakHeatmap({
  days,
}: {
  days: HeatDay[]; // continuous 365 days, oldest first
}) {
  // Reverse so most recent is on the LEFT
  const reversed = [...days].reverse();

  // Pad so the first day (today) aligns with its weekday row
  const paddedDays: (HeatDay | null)[] = [];
  if (reversed.length > 0) {
    const firstDayDate = new Date(reversed[0].date);
    const firstDayOfWeek = firstDayDate.getDay(); // 0 (Sun) to 6 (Sat)
    for (let i = 0; i < firstDayOfWeek; i++) {
      paddedDays.push(null);
    }
    paddedDays.push(...reversed);
  }

  // Build weeks (columns)
  const weeks: (HeatDay | null)[][] = [];
  for (let i = 0; i < paddedDays.length; i += 7) {
    weeks.push(paddedDays.slice(i, i + 7));
  }

  // Month labels — derive from first valid day in each week
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
      <div className="flex w-full overflow-x-auto pb-2 scroll-smooth [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border/50 [&::-webkit-scrollbar-thumb]:rounded-full">
        <div className="flex min-w-max flex-col">
          {/* Months Header */}
          <div className="relative mb-1.5 ml-8 flex h-4 text-[10px] text-muted-foreground">
            {monthLabels.map((m, i) => (
              <div
                key={i}
                className="absolute"
                style={{ left: `${m.colIndex * 15}px` }}
              >
                {m.label}
              </div>
            ))}
          </div>

          <div className="flex gap-1.5">
            {/* Weekdays Side Labels */}
            <div className="relative h-[96px] w-5 text-[9px] text-muted-foreground/70">
              <span className="absolute right-0 top-[12px]">Mo</span>
              <span className="absolute right-0 top-[40px]">We</span>
              <span className="absolute right-0 top-[68px]">Fr</span>
            </div>

            {/* Heatmap Grid */}
            <div className="flex h-[96px] gap-[3px]">
              <TooltipProvider delayDuration={80}>
                {weeks.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-[3px]">
                    {week.map((d, dIdx) => {
                      if (!d) {
                        return <div key={`empty-${dIdx}`} className="size-[11px] rounded-[2px] bg-transparent" />;
                      }

                      const lvl = intensity(d.seconds);
                      const minutes = Math.round(d.seconds / 60);
                      const dateObj = new Date(d.date);
                      const formattedDate = dateObj.toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      });

                      return (
                        <Tooltip key={d.date}>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "size-[11px] rounded-[2px] border transition-colors hover:ring-1 hover:ring-ring hover:ring-offset-1 hover:ring-offset-background",
                                levelClass(lvl)
                              )}
                              role="img"
                              aria-label={`${formattedDate}: ${minutes} minutes`}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            <span className="font-semibold">{minutes} min{minutes !== 1 ? "s" : ""}</span>
                            {" · "}{formattedDate}
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

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground/70">
        <span>Less</span>
        <div className="flex items-center gap-[3px]">
          {([0, 1, 2, 3, 4] as const).map((lvl) => (
            <div
              key={lvl}
              className={cn("size-[10px] rounded-[2px] border", levelClass(lvl))}
            />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
