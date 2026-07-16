import { useCallback, useEffect, useRef, useState } from "react";
import { useClientApi, useApplicationApi } from "@/hooks/useApi";
import { ApiError } from "@/lib/api/errors";
import type { ServerAttributes, ServerResourcesAttributes } from "@/lib/types/pterodactyl";
import type { NodeLocationLookup } from "@/lib/types/application";

interface UseServersResult {
  servers: ServerAttributes[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useServers(): UseServersResult {
  const api = useClientApi();
  const [servers, setServers] = useState<ServerAttributes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServers = useCallback(async () => {
    if (!api) return;
    setError(null);
    try {
      const data = await api.listServers();
      setServers(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.userMessage : "Server konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    setLoading(true);
    void fetchServers();
  }, [fetchServers]);

  return { servers, loading, error, refetch: fetchServers };
}

/**
 * Live-Ressourcennutzung ALLER übergebenen Server, zentral in einem Intervall gepollt.
 * Wird vom Dashboard verwendet, damit Status-Filter/-Suche den echten Live-State
 * (running/offline/...) kennen und nicht jede ServerCard einen eigenen Timer betreibt.
 */
export function useServerResourcesMap(identifiers: string[], intervalSeconds: number) {
  const api = useClientApi();
  const [resourcesMap, setResourcesMap] = useState<Map<string, ServerResourcesAttributes>>(new Map());
  const idsKey = identifiers.join(",");

  useEffect(() => {
    if (!api || identifiers.length === 0 || intervalSeconds <= 0) return;

    let cancelled = false;
    const tick = async () => {
      const results = await Promise.allSettled(
        identifiers.map(async (id) => [id, await api.getServerResources(id)] as const),
      );
      if (cancelled) return;
      setResourcesMap((prev) => {
        const next = new Map(prev);
        for (const result of results) {
          if (result.status === "fulfilled") {
            const [id, data] = result.value;
            next.set(id, data);
          }
        }
        return next;
      });
    };

    void tick();
    const id = setInterval(tick, intervalSeconds * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, idsKey, intervalSeconds]);

  return resourcesMap;
}

/** Live-Ressourcennutzung eines einzelnen Servers, per Intervall gepollt (z. B. Server-Detailseite). */
export function useServerResources(identifier: string | null, intervalSeconds: number) {
  const api = useClientApi();
  const [resources, setResources] = useState<ServerResourcesAttributes | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!api || !identifier || intervalSeconds <= 0) return;

    let cancelled = false;
    const tick = async () => {
      try {
        const data = await api.getServerResources(identifier);
        if (!cancelled && mounted.current) {
          setResources(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled && mounted.current) {
          setError(err instanceof ApiError ? err.userMessage : "Ressourcen nicht verfügbar.");
        }
      }
    };

    void tick();
    const id = setInterval(tick, intervalSeconds * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [api, identifier, intervalSeconds]);

  return { resources, error };
}

/** Node -> Location Lookup, nur wenn eine Application API verfügbar ist. Lädt genau einmal. */
export function useNodeLocationLookup() {
  const appApi = useApplicationApi();
  const [lookup, setLookup] = useState<Map<string, NodeLocationLookup> | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    if (!appApi) {
      setLookup(null);
      return;
    }
    let cancelled = false;
    appApi
      .buildNodeLocationLookup()
      .then((result) => {
        if (!cancelled) setLookup(result);
      })
      .catch(() => {
        // Application-API-Key evtl. ohne ausreichende Rechte - Feature einfach ausblenden.
        if (!cancelled) setUnavailable(true);
      });
    return () => {
      cancelled = true;
    };
  }, [appApi]);

  return { lookup, unavailable };
}
