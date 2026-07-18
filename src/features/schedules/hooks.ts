import { useCallback, useEffect, useState } from "react";
import { useClientApi } from "@/hooks/useApi";
import { ApiError } from "@/lib/api/errors";
import type { ScheduleAttributes } from "@/lib/types/pterodactyl";

export function useSchedules(identifier: string) {
  const api = useClientApi();
  const [schedules, setSchedules] = useState<ScheduleAttributes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!api) return;
    setError(null);
    try {
      setSchedules(await api.listSchedules(identifier));
    } catch (err) {
      setError(err instanceof ApiError ? err.userMessage : "Zeitpläne konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, [api, identifier]);

  useEffect(() => {
    setLoading(true);
    void refetch();
  }, [refetch]);

  return { schedules, loading, error, refetch };
}
