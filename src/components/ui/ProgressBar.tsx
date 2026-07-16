import { cn } from "@/lib/utils/cn";

interface ProgressBarProps {
  value: number;
  max?: number;
  tone?: "accent" | "success" | "warning" | "danger";
  className?: string;
}

const toneClasses = {
  accent: "bg-accent-500",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

export function ProgressBar({ value, max = 100, tone = "accent", className }: ProgressBarProps) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-base-700", className)}>
      <div
        className={cn("h-full rounded-full transition-all duration-500", toneClasses[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
