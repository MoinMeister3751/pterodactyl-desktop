import { useCallback, useEffect, useState } from "react";
import { useApplicationApi } from "@/hooks/useApi";
import { ApiError } from "@/lib/api/errors";
import type {
  AdminServerAttributes,
  AdminUserAttributes,
  LocationAttributes,
  NodeAttributes,
} from "@/lib/types/application";

interface AdminListResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

function useAdminList<T>(
  fetcher: (api: NonNullable<ReturnType<typeof useApplicationApi>>) => Promise<T[]>,
): AdminListResult<T> {
  const api = useApplicationApi();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!api) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      setData(await fetcher(api));
    } catch (err) {
      if (err instanceof ApiError && (err.kind === "unauthorized" || err.kind === "forbidden")) {
        setError(
          "Application-API-Key hat keine Leserechte für diese Ressource. Prüfe die Key-Berechtigungen im Panel (Admin -> Application API).",
        );
      } else {
        setError(err instanceof ApiError ? err.userMessage : "Daten konnten nicht geladen werden.");
      }
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api]);

  useEffect(() => {
    setLoading(true);
    void refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

export function useAdminNodes(): AdminListResult<NodeAttributes> {
  return useAdminList((api) => api.listNodes());
}

export function useAdminLocations(): AdminListResult<LocationAttributes> {
  return useAdminList((api) => api.listLocations());
}

export function useAdminUsers(): AdminListResult<AdminUserAttributes> {
  return useAdminList((api) => api.listUsers());
}

export function useAdminServers(): AdminListResult<AdminServerAttributes> {
  return useAdminList((api) => api.listServers());
}
