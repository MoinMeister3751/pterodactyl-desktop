import { useCallback, useEffect, useState } from "react";
import { useApplicationApi, useClientApi } from "@/hooks/useApi";
import { ApiError } from "@/lib/api/errors";
import type {
  AdminServerAttributes,
  AdminUserAttributes,
  EggAttributes,
  LocationAttributes,
  NestAttributes,
  NodeAllocationAttributes,
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

export function useAdminNests(): AdminListResult<NestAttributes> {
  return useAdminList((api) => api.listNests());
}

/** Lädt die Eggs eines Nests neu, sobald sich die Nest-Auswahl ändert (z. B. im Server-Erstellen-Formular). */
export function useAdminEggs(nestId: number | null): AdminListResult<EggAttributes> {
  const api = useApplicationApi();
  const [data, setData] = useState<EggAttributes[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!api || nestId === null) {
      setData([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setData(await api.listEggs(nestId));
    } catch (err) {
      setError(err instanceof ApiError ? err.userMessage : "Eggs konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, [api, nestId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

/** Lädt die Allokationen eines Nodes neu, sobald sich die Node-Auswahl ändert. */
export function useAdminNodeAllocations(nodeId: number | null): AdminListResult<NodeAllocationAttributes> {
  const api = useApplicationApi();
  const [data, setData] = useState<NodeAllocationAttributes[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!api || nodeId === null) {
      setData([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setData(await api.listNodeAllocations(nodeId));
    } catch (err) {
      setError(err instanceof ApiError ? err.userMessage : "Allokationen konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, [api, nodeId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

/**
 * Zählt pro E-Mail-Adresse, bei wie vielen der EIGENEN Server (über die Client-API
 * abrufbar) ein Nutzer als Subuser eingetragen ist. Die Application API bietet
 * keinen panelweiten Subuser-Endpoint - Subuser sind rein ein Client-API-/
 * Server-Owner-Konzept. Ein Rundum-Bild über ALLE Server des Panels ist damit
 * grundsätzlich nicht abrufbar; diese Funktion liefert daher bewusst nur die
 * Zahlen für die vom aktuell angemeldeten Account besessenen Server (klar so
 * beschriftet in der UI, siehe UsersTable "Can Access"-Spalte).
 */
export function useSubuserAccessCounts(): { counts: Map<string, number>; loading: boolean } {
  const clientApi = useClientApi();
  const [counts, setCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientApi) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const ownServers = await clientApi.listServers();
        const results = await Promise.allSettled(
          ownServers.map((s) => clientApi.listSubusers(s.identifier)),
        );
        if (cancelled) return;
        const next = new Map<string, number>();
        for (const result of results) {
          if (result.status !== "fulfilled") continue;
          for (const subuser of result.value) {
            next.set(subuser.email, (next.get(subuser.email) ?? 0) + 1);
          }
        }
        setCounts(next);
      } catch {
        // Kein hartes Fehlerbanner nötig - Spalte zeigt dann einfach "0" statt zu crashen.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clientApi]);

  return { counts, loading };
}

/** Eigene Account-ID (über die Client-API), um "nur meine Server" filtern zu können. */
export function useOwnAccountId(): number | null {
  const clientApi = useClientApi();
  const [id, setId] = useState<number | null>(null);

  useEffect(() => {
    if (!clientApi) {
      setId(null);
      return;
    }
    let cancelled = false;
    clientApi
      .getAccount()
      .then((account) => {
        if (!cancelled) setId(account.id);
      })
      .catch(() => {
        if (!cancelled) setId(null);
      });
    return () => {
      cancelled = true;
    };
  }, [clientApi]);

  return id;
}
