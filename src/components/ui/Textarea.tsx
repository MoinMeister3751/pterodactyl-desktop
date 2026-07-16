import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full rounded-md border border-base-600 bg-base-950 px-3 py-2 font-mono text-sm text-base-100",
          "focus:outline-none focus:ring-2 focus:ring-accent-400/60 focus:border-accent-500",
          "resize-none",
          className,
        )}
        spellCheck={false}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";
