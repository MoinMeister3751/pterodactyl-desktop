import { create } from "zustand";

export type UpdaterStatus = "idle" | "checking" | "available" | "downloading" | "ready" | "error" | "up_to_date";

interface UpdaterState {
  status: UpdaterStatus;
  version: string | null;
  notes: string | null;
  progress: number;
  errorMessage: string | null;
  set: (patch: Partial<UpdaterState>) => void;
}

export const useUpdaterStore = create<UpdaterState>((set) => ({
  status: "idle",
  version: null,
  notes: null,
  progress: 0,
  errorMessage: null,
  set: (patch) => set(patch),
}));
