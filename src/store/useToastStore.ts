import { create } from "zustand";

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  durationMs: number;
}

interface ToastState {
  toasts: Toast[];
  push: (toast: Omit<Toast, "id" | "durationMs"> & { durationMs?: number }) => string;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (toast) => {
    const id = crypto.randomUUID();
    const durationMs = toast.durationMs ?? (toast.variant === "error" ? 7000 : 4000);
    set((state) => ({ toasts: [...state.toasts, { ...toast, id, durationMs }] }));
    return id;
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
