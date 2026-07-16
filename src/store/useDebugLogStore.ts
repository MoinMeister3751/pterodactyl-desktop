import { create } from "zustand";

export interface DebugLogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error";
  message: string;
}

const MAX_ENTRIES = 500;

interface DebugLogState {
  entries: DebugLogEntry[];
  addLog: (level: DebugLogEntry["level"], message: string) => void;
  clear: () => void;
}

export const useDebugLogStore = create<DebugLogState>((set) => ({
  entries: [],
  addLog: (level, message) =>
    set((state) => {
      const entry: DebugLogEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        level,
        message,
      };
      const next = [...state.entries, entry];
      return { entries: next.length > MAX_ENTRIES ? next.slice(next.length - MAX_ENTRIES) : next };
    }),
  clear: () => set({ entries: [] }),
}));
