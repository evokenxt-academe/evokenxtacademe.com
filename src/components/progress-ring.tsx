"use client";

import { cn } from "@/lib/utils";

interface ProgressRingProps {
  /** Progress value from 0 to 100 */
  value: number;
  /** Diameter of the ring in pixels */
  size?: number;
  /** Thickness of the ring stroke */
  strokeWidth?: number;
  /** Additional class names for the wrapper */
  className?: string;
  /** Whether to show the percentage text inside */
  showValue?: boolean;
  /** Custom label to show instead of percentage */
  label?: string;
}

export function ProgressRing({
  value,
  size = 64,
  strokeWidth = 5,
  className,
  showValue = true,
  label,
}: ProgressRingProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;

  // Determine ring color based on progress
  const ringColorClass =
    clampedValue >= 100
      ? "text-emerald-500"
      : clampedValue >= 60
        ? "text-primary"
        : clampedValue >= 30
          ? "text-amber-500"
          : "text-muted-foreground/40";

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${clampedValue}% complete`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/50"
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={cn(
            "transition-[stroke-dashoffset] duration-500 ease-out",
            ringColorClass,
          )}
        />
      </svg>

      {showValue && (
        <span className="absolute text-xs font-semibold tabular-nums text-foreground">
          {label ?? `${clampedValue}%`}
        </span>
      )}
    </div>
  );
}
