import { useCallback, useEffect, useState } from "react";
import { useClientApi } from "@/hooks/useApi";
import { ApiError } from "@/lib/api/errors";
import type { BackupAttributes } from "@/lib/types/pterodactyl";

export function useBackups(identifier: string) {
  const api = useClientApi();
  const [backups, setBackups] = useState<BackupAttributes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!api) return;
    setError(null);
    try {
      const data = await api.listBackups(identifier);
      data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setBackups(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.userMessage : "Backups konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, [api, identifier]);

  useEffect(() => {
    setLoading(true);
    void refetch();
  }, [refetch]);

  // Läuft ein Backup gerade (kein completed_at), regelmäßig aktualisieren, bis es fertig ist.
  useEffect(() => {
    const hasPending = backups.some((b) => !b.completed_at);
    if (!hasPending) return;
    const id = setInterval(() => void refetch(), 5000);
    return () => clearInterval(id);
  }, [backups, refetch]);

  return { backups, loading, error, refetch };
}
