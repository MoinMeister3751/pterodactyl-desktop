import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn } from "@/lib/utils/cn";

interface ResourceGaugeProps {
  label: string;
  valueLabel: string;
  percent: number | null;
  className?: string;
}

export function ResourceGauge({ label, valueLabel, percent, className }: ResourceGaugeProps) {
  const tone = percent === null ? "accent" : percent > 90 ? "danger" : percent > 70 ? "warning" : "accent";
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-center justify-between text-[11px] text-base-400">
        <span>{label}</span>
        <span className="font-mono text-base-200">{valueLabel}</span>
      </div>
      <ProgressBar value={percent ?? 0} tone={tone} />
    </div>
  );
}
