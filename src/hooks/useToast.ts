import { useCallback } from "react";
import { useToastStore } from "@/store/useToastStore";
import { ApiError } from "@/lib/api/errors";

export function useToast() {
  const push = useToastStore((s) => s.push);

  const success = useCallback(
    (title: string, description?: string) => push({ variant: "success", title, description }),
    [push],
  );
  const info = useCallback(
    (title: string, description?: string) => push({ variant: "info", title, description }),
    [push],
  );
  const warning = useCallback(
    (title: string, description?: string) => push({ variant: "warning", title, description }),
    [push],
  );
  const error = useCallback(
    (title: string, err?: unknown) => {
      const description = err instanceof ApiError ? err.userMessage : err instanceof Error ? err.message : undefined;
      return push({ variant: "error", title, description });
    },
    [push],
  );

  return { success, info, warning, error };
}
