import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface TabItem {
  key: string;
  label: string;
  icon?: ReactNode;
  badge?: ReactNode;
}

interface TabsProps {
  items: TabItem[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
}

export function Tabs({ items, active, onChange, className }: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn("flex gap-1 overflow-x-auto border-b border-base-700 px-2", className)}
    >
      {items.map((item) => {
        const isActive = item.key === active;
        return (
          <button
            key={item.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item.key)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/60 rounded-t-sm",
              isActive
                ? "border-accent-500 text-base-100"
                : "border-transparent text-base-300 hover:text-base-100 hover:border-base-500",
            )}
          >
            {item.icon}
            {item.label}
            {item.badge}
          </button>
        );
      })}
    </div>
  );
}
