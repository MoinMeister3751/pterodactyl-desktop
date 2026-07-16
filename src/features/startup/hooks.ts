import { useCallback, useEffect, useState } from "react";
import { useClientApi } from "@/hooks/useApi";
import { ApiError } from "@/lib/api/errors";
import type { EggVariableAttributes, StartupMeta } from "@/lib/types/pterodactyl";

export function useStartup(identifier: string) {
  const api = useClientApi();
  const [variables, setVariables] = useState<EggVariableAttributes[]>([]);
  const [meta, setMeta] = useState<StartupMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!api) return;
    setError(null);
    try {
      const result = await api.getStartup(identifier);
      setVariables(result.variables);
      setMeta(result.meta);
    } catch (err) {
      setError(err instanceof ApiError ? err.userMessage : "Startup-Konfiguration konnte nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, [api, identifier]);

  useEffect(() => {
    setLoading(true);
    void refetch();
  }, [refetch]);

  return { variables, meta, loading, error, refetch };
}
