"use client";

import { cn } from "@/lib/utils";

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
  const weeks: HeatDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const levelClass = (lvl: 0 | 1 | 2 | 3 | 4) => {
    switch (lvl) {
      case 0:
        return "bg-transparent border-border/60";
      case 1:
        return "bg-[color-mix(in_oklab,var(--chart-1),transparent_70%)] border-[color-mix(in_oklab,var(--chart-1),transparent_55%)]";
      case 2:
        return "bg-[color-mix(in_oklab,var(--chart-1),transparent_55%)] border-[color-mix(in_oklab,var(--chart-1),transparent_40%)]";
      case 3:
        return "bg-[color-mix(in_oklab,var(--chart-1),transparent_35%)] border-[color-mix(in_oklab,var(--chart-1),transparent_25%)]";
      case 4:
        return "bg-[color-mix(in_oklab,var(--chart-1),transparent_15%)] border-[color-mix(in_oklab,var(--chart-1),transparent_10%)]";
    }
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max gap-1">
        {weeks.map((week, wIdx) => (
          <div key={wIdx} className="flex flex-col gap-1">
            {week.map((d) => {
              const lvl = intensity(d.seconds);
              const minutes = Math.round(d.seconds / 60);
              return (
                <div
                  key={d.date}
                  className={cn(
                    "size-3 rounded-sm border transition-colors",
                    levelClass(lvl),
                  )}
                  role="img"
                  aria-label={`${d.date}: ${minutes} minutes`}
                  title={`${d.date}: ${minutes} min`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex items-center gap-1">
          {[0, 1, 2, 3, 4].map((lvl) => (
            <div
              key={lvl}
              className={cn(
                "size-3 rounded-sm border",
                levelClass(lvl as 0 | 1 | 2 | 3 | 4),
              )}
            />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
}

