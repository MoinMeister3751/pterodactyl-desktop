import { useCallback, useEffect, useState } from "react";
import { useClientApi } from "@/hooks/useApi";
import { ApiError } from "@/lib/api/errors";
import type { SubuserAttributes } from "@/lib/types/pterodactyl";

export function useSubusers(identifier: string) {
  const api = useClientApi();
  const [subusers, setSubusers] = useState<SubuserAttributes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!api) return;
    setError(null);
    try {
      setSubusers(await api.listSubusers(identifier));
    } catch (err) {
      setError(err instanceof ApiError ? err.userMessage : "Nutzer konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, [api, identifier]);

  useEffect(() => {
    setLoading(true);
    void refetch();
  }, [refetch]);

  return { subusers, loading, error, refetch };
}

/** Vereinfachte Berechtigungsgruppen, die auf die tatsächlichen Pterodactyl-Permission-Strings abbilden. */
export const PERMISSION_GROUPS: Array<{ key: string; label: string; permissions: string[] }> = [
  { key: "control", label: "Konsole & Power", permissions: ["control.console", "control.start", "control.stop", "control.restart"] },
  { key: "files", label: "Dateien", permissions: ["file.create", "file.read", "file.read-content", "file.update", "file.delete", "file.archive", "file.sftp"] },
  { key: "backups", label: "Backups", permissions: ["backup.create", "backup.read", "backup.delete", "backup.download", "backup.restore"] },
  { key: "databases", label: "Datenbanken", permissions: ["database.create", "database.read", "database.update", "database.delete", "database.view_password"] },
  { key: "schedules", label: "Zeitpläne", permissions: ["schedule.create", "schedule.read", "schedule.update", "schedule.delete"] },
  { key: "allocations", label: "Netzwerk", permissions: ["allocation.read", "allocation.create", "allocation.update", "allocation.delete"] },
  { key: "startup", label: "Startup", permissions: ["startup.read", "startup.update", "startup.docker-image"] },
  { key: "users", label: "Subuser verwalten", permissions: ["user.create", "user.read", "user.update", "user.delete"] },
  { key: "settings", label: "Einstellungen", permissions: ["settings.rename", "settings.reinstall"] },
  { key: "activity", label: "Aktivitätsprotokoll", permissions: ["activity.read"] },
];
