import { create } from "zustand";

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (confirmed: boolean) => void;
}

interface ConfirmState {
  pending: PendingConfirm | null;
  request: (options: ConfirmOptions) => Promise<boolean>;
  resolve: (confirmed: boolean) => void;
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  pending: null,
  request: (options) =>
    new Promise<boolean>((resolve) => {
      set({ pending: { ...options, resolve } });
    }),
  resolve: (confirmed) => {
    get().pending?.resolve(confirmed);
    set({ pending: null });
  },
}));
