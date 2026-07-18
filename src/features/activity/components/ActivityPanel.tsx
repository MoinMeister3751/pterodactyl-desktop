import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SkeletonServerCard } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { useClientApi } from "@/hooks/useApi";
import { ApiError } from "@/lib/api/errors";
import { formatDateTime } from "@/lib/utils/format";
import type { PaginationMeta } from "@/lib/types/api";
import type { ActivityLogAttributes } from "@/lib/types/pterodactyl";

export function ActivityPanel({ identifier }: { identifier: string }) {
  const api = useClientApi();
  const [entries, setEntries] = useState<ActivityLogAttributes[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  async function load(targetPage: number) {
    if (!api) return;
    setError(null);
    try {
      const result = await api.listServerActivity(identifier, targetPage);
      setEntries(result.entries);
      setPagination(result.pagination ?? null);
    } catch (err) {
      // Ältere Panel-Versionen (<1.11) kennen diesen Endpunkt evtl. nicht - sauber als
      // "nicht verfügbar" behandeln statt einen harten Fehler zu zeigen.
      if (err instanceof ApiError && err.kind === "not_found") {
        setEntries([]);
      } else {
        setError(err instanceof ApiError ? err.userMessage : "Aktivitätsprotokoll konnte nicht geladen werden.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    void load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, identifier, page]);

  // Panel liefert Einträge nicht immer garantiert absteigend sortiert -
  // hier clientseitig erzwingen, damit neueste Aktivität immer oben steht.
  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [entries],
  );

  const isFirstPage = page <= 1;
  const isLastPage = pagination ? page >= pagination.total_pages : entries.length === 0;

  if (loading) return <SkeletonServerCard />;
  if (error) return <ErrorState message={error} onRetry={() => load(page)} />;
  if (entries.length === 0 && page === 1) {
    return (
      <EmptyState
        title="Keine Aktivitäten"
        description="Für diesen Server liegen keine protokollierten Aktivitäten vor (oder dein Panel unterstützt dieses Feature nicht)."
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {sortedEntries.map((entry) => (
        <div key={entry.id} className="flex items-start gap-3 rounded-md border border-base-700 bg-base-850 px-3 py-2.5">
          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-400" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm text-base-100">{entry.event}</p>
              {entry.is_api && <Badge tone="neutral">API</Badge>}
            </div>
            {entry.description && <p className="text-xs text-base-400">{entry.description}</p>}
            <p className="mt-0.5 text-[11px] text-base-500">
              {formatDateTime(entry.timestamp)}
              {entry.relationships?.actor && ` · ${entry.relationships.actor.attributes.username}`}
              {entry.ip && ` · ${entry.ip}`}
            </p>
          </div>
        </div>
      ))}

      <div className="mt-2 flex items-center justify-center gap-2">
        <Button size="sm" variant="ghost" disabled={isFirstPage} onClick={() => setPage((p) => Math.max(1, p - 1))}>
          Zurück
        </Button>
        {pagination && (
          <span className="text-xs text-base-400">
            Seite {pagination.current_page} von {pagination.total_pages}
          </span>
        )}
        <Button size="sm" variant="ghost" disabled={isLastPage} onClick={() => setPage((p) => p + 1)}>
          Weiter
        </Button>
      </div>
    </div>
  );
}
