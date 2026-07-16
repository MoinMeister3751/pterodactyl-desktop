import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type Tone = "success" | "warning" | "danger" | "neutral" | "accent";

const toneClasses: Record<Tone, string> = {
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  danger: "bg-danger-bg text-danger",
  neutral: "bg-neutral-bg text-neutral",
  accent: "bg-accent-900/50 text-accent-300",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  dot?: boolean;
}

export function Badge({ className, tone = "neutral", dot, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full bg-current")} />}
      {children}
    </span>
  );
}
