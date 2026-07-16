import { useCallback } from "react";
import { useConfirmStore, type ConfirmOptions } from "@/store/useConfirmStore";

/** Zeigt einen modalen Bestätigungsdialog und löst mit true/false auf. */
export function useConfirm() {
  const request = useConfirmStore((s) => s.request);
  return useCallback((options: ConfirmOptions) => request(options), [request]);
}
