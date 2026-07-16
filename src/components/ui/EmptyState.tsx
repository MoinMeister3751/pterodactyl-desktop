import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-base-600 px-6 py-14 text-center">
      {icon && <div className="mb-1 text-base-400">{icon}</div>}
      <p className="text-sm font-medium text-base-100">{title}</p>
      {description && <p className="max-w-sm text-xs text-base-400">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
