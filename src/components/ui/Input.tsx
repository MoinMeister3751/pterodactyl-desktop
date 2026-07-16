import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={cn(
            "w-full h-9 rounded-md border bg-base-850 px-3 text-sm text-base-100 placeholder:text-base-400",
            "focus:outline-none focus:ring-2 focus:ring-accent-400/60 focus:border-accent-500",
            "transition-colors",
            error ? "border-danger" : "border-base-600",
            className,
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </div>
    );
  },
);
Input.displayName = "Input";
