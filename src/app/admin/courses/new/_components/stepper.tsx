"use client";

import { cn } from "@/lib/utils";
import { IconCheck } from "@tabler/icons-react";

export type StepItem = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

interface StepperProps {
  steps: StepItem[];
  currentStep: number;
  completedSteps: number[];
  onStepClick?: (index: number) => void;
}

export function Stepper({ steps, currentStep, completedSteps, onStepClick }: StepperProps) {
  return (
    <nav className="flex flex-col gap-0" aria-label="Progress">
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = completedSteps.includes(index);
        const isLast = index === steps.length - 1;
        const StepIcon = step.icon;

        return (
          <div key={step.label} className="flex gap-3">
            {/* Line + circle column */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => onStepClick?.(index)}
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  isCompleted && "border-green-500 bg-green-500 text-white",
                  isActive && !isCompleted && "border-primary bg-primary text-primary-foreground",
                  !isActive && !isCompleted && "border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <IconCheck className="size-4" />
                ) : (
                  <StepIcon className="size-4" />
                )}
              </button>
              {!isLast && (
                <div
                  className={cn(
                    "w-0.5 flex-1 min-h-8",
                    isCompleted ? "bg-green-500" : "bg-border"
                  )}
                />
              )}
            </div>

            {/* Label */}
            <div className="pb-8 pt-1">
              <span
                className={cn(
                  "text-sm",
                  isActive && "font-medium text-foreground",
                  isCompleted && !isActive && "text-muted-foreground line-through",
                  !isActive && !isCompleted && "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </nav>
  );
}
