import { create } from "zustand";
import type { Update } from "@tauri-apps/plugin-updater";

export type UpdaterStatus = "idle" | "checking" | "available" | "downloading" | "ready" | "error" | "up_to_date";

interface UpdaterState {
  status: UpdaterStatus;
  version: string | null;
  notes: string | null;
  progress: number;
  errorMessage: string | null;
  /**
   * Das tatsächliche Update-Objekt des Tauri-Plugins. Lebt bewusst im geteilten
   * Store statt in einem lokalen useRef innerhalb von useUpdater(): useUpdater()
   * wird an mehreren Stellen unabhängig aufgerufen (App.tsx für den stillen
   * Check beim Start, SettingsPage, UpdateBadge) - mit einem lokalen Ref sah
   * jede dieser Stellen ihre eigene, leere Instanz, wodurch "Update
   * installieren" in Settings/TopBar ins Leere lief, wenn der Check zuvor in
   * App.tsx passiert war.
   */
  pendingUpdate: Update | null;
  set: (patch: Partial<UpdaterState>) => void;
}

export const useUpdaterStore = create<UpdaterState>((set) => ({
  status: "idle",
  version: null,
  notes: null,
  progress: 0,
  errorMessage: null,
  pendingUpdate: null,
  set: (patch) => set(patch),
}));
