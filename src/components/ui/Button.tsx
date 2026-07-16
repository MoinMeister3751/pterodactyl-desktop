import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-accent-500 text-white hover:bg-accent-600 focus-visible:ring-accent-400",
  secondary: "bg-base-700 text-base-100 hover:bg-base-600 focus-visible:ring-base-400",
  ghost: "bg-transparent text-base-300 hover:bg-base-800 hover:text-base-100 focus-visible:ring-base-500",
  danger: "bg-danger text-white hover:bg-danger/90 focus-visible:ring-danger",
  outline: "border border-base-600 bg-transparent text-base-100 hover:bg-base-800 focus-visible:ring-base-400",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-sm gap-2",
  icon: "h-9 w-9 p-0",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "secondary", size = "md", loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-base-900",
          "disabled:opacity-50 disabled:pointer-events-none select-none",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {loading && <Spinner className="h-3.5 w-3.5" />}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
