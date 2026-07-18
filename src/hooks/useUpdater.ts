import { useCallback } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { useUpdaterStore } from "@/store/useUpdaterStore";

/**
 * Kapselt den Tauri-Updater-Plugin-Workflow: prüfen -> herunterladen -> installieren
 * -> App neu starten. Updates werden über GitHub Releases (latest.json) bezogen,
 * siehe src-tauri/tauri.conf.json ("plugins.updater") und .github/workflows/release.yml.
 *
 * Das gefundene Update-Objekt liegt in useUpdaterStore (nicht in einem lokalen
 * Ref), damit "Update installieren" auch dann funktioniert, wenn der Check von
 * einer anderen Komponente ausgelöst wurde (z. B. stiller Check in App.tsx,
 * Installieren-Klick in Settings oder im TopBar-Badge).
 */
export function useUpdater() {
  const set = useUpdaterStore((s) => s.set);

  const checkForUpdates = useCallback(async (silent = false) => {
    set({ status: "checking", errorMessage: null });
    try {
      const update = await check();
      if (update) {
        set({ status: "available", version: update.version, notes: update.body ?? null, pendingUpdate: update });
      } else {
        set({ status: silent ? "idle" : "up_to_date", pendingUpdate: null });
      }
    } catch (error) {
      set({
        status: "error",
        errorMessage: error instanceof Error ? error.message : "Update-Prüfung fehlgeschlagen.",
      });
    }
  }, [set]);

  const installUpdate = useCallback(async () => {
    const update = useUpdaterStore.getState().pendingUpdate;
    if (!update) {
      set({ status: "error", errorMessage: "Kein Update zum Installieren gefunden. Bitte erneut prüfen." });
      return;
    }
    set({ status: "downloading", progress: 0 });
    try {
      let downloaded = 0;
      let total = 0;
      await update.downloadAndInstall((event) => {
        if (event.event === "Started") {
          total = event.data.contentLength ?? 0;
        } else if (event.event === "Progress") {
          downloaded += event.data.chunkLength;
          set({ progress: total > 0 ? Math.round((downloaded / total) * 100) : 0 });
        } else if (event.event === "Finished") {
          set({ progress: 100 });
        }
      });
      set({ status: "ready" });
      await relaunch();
    } catch (error) {
      set({
        status: "error",
        errorMessage: error instanceof Error ? error.message : "Update konnte nicht installiert werden.",
      });
    }
  }, [set]);

  return { checkForUpdates, installUpdate };
}
