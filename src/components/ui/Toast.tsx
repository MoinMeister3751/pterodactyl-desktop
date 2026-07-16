import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useToastStore, type Toast, type ToastVariant } from "@/store/useToastStore";
import { cn } from "@/lib/utils/cn";

const variantStyles: Record<ToastVariant, { border: string; icon: string; iconColor: string }> = {
  success: { border: "border-l-success", icon: "M5 13l4 4L19 7", iconColor: "text-success" },
  error: { border: "border-l-danger", icon: "M6 18L18 6M6 6l12 12", iconColor: "text-danger" },
  warning: {
    border: "border-l-warning",
    icon: "M12 9v3.75m0 3.75h.008v.008H12v-.008zM10.29 3.86l-8.18 14.18A1.5 1.5 0 003.5 20h17a1.5 1.5 0 001.39-2.06L13.71 3.86a1.5 1.5 0 00-2.42 0z",
    iconColor: "text-warning",
  },
  info: {
    border: "border-l-accent-500",
    icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    iconColor: "text-accent-400",
  },
};

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const style = variantStyles[toast.variant];

  useEffect(() => {
    const id = setTimeout(() => dismiss(toast.id), toast.durationMs);
    return () => clearTimeout(id);
  }, [toast.id, toast.durationMs, dismiss]);

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto flex w-80 items-start gap-3 rounded-md border border-base-600 border-l-4 bg-base-800 p-3 shadow-panel animate-slide-in",
        style.border,
      )}
    >
      <svg className={cn("mt-0.5 h-4 w-4 shrink-0", style.iconColor)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={style.icon} />
      </svg>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-base-100">{toast.title}</p>
        {toast.description && <p className="mt-0.5 text-xs text-base-300 break-words">{toast.description}</p>}
      </div>
      <button
        onClick={() => dismiss(toast.id)}
        className="shrink-0 text-base-400 hover:text-base-100"
        aria-label="Schließen"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  return createPortal(
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>,
    document.body,
  );
}
