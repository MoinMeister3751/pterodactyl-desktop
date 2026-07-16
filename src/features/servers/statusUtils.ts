import type { ServerAttributes, ServerPowerState } from "@/lib/types/pterodactyl";

export type DisplayStatus =
  | "running"
  | "starting"
  | "stopping"
  | "offline"
  | "installing"
  | "install_failed"
  | "suspended"
  | "restoring_backup"
  | "unknown";

const STATUS_META: Record<DisplayStatus, { label: string; tone: "success" | "warning" | "danger" | "neutral" }> = {
  running: { label: "Online", tone: "success" },
  starting: { label: "Startet…", tone: "warning" },
  stopping: { label: "Stoppt…", tone: "warning" },
  offline: { label: "Offline", tone: "neutral" },
  installing: { label: "Installiert…", tone: "warning" },
  install_failed: { label: "Installation fehlgeschlagen", tone: "danger" },
  suspended: { label: "Gesperrt", tone: "danger" },
  restoring_backup: { label: "Backup wird wiederhergestellt…", tone: "warning" },
  unknown: { label: "Unbekannt", tone: "neutral" },
};

/**
 * Kombiniert den Lebenszyklus-Status aus der Serverliste (installing/suspended/…)
 * mit dem Live-Power-State aus /resources (running/starting/…), da beide APIs
 * unterschiedliche Ausschnitte desselben Zustands liefern.
 */
export function deriveDisplayStatus(
  server: Pick<ServerAttributes, "status" | "is_suspended" | "is_installing" | "is_transferring">,
  liveState: ServerPowerState | null,
): DisplayStatus {
  if (server.is_suspended || server.status === "suspended") return "suspended";
  if (server.is_installing || server.status === "installing") return "installing";
  if (server.status === "install_failed" || server.status === "reinstall_failed") return "install_failed";
  if (server.status === "restoring_backup") return "restoring_backup";
  if (liveState) return liveState;
  return "unknown";
}

export function statusMeta(status: DisplayStatus) {
  return STATUS_META[status];
}
