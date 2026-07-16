import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SkeletonServerCard } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { useClientApi } from "@/hooks/useApi";
import { ApiError } from "@/lib/api/errors";
import { formatDateTime } from "@/lib/utils/format";
import type { ActivityLogAttributes } from "@/lib/types/pterodactyl";

export function ActivityPanel({ identifier }: { identifier: string }) {
  const api = useClientApi();
  const [entries, setEntries] = useState<ActivityLogAttributes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  async function load(targetPage: number) {
    if (!api) return;
    setError(null);
    try {
      const data = await api.listServerActivity(identifier, targetPage);
      setEntries(data);
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

  if (loading) return <SkeletonServerCard />;
  if (error) return <ErrorState message={error} onRetry={() => load(page)} />;
  if (entries.length === 0) {
    return (
      <EmptyState
        title="Keine Aktivitäten"
        description="Für diesen Server liegen keine protokollierten Aktivitäten vor (oder dein Panel unterstützt dieses Feature nicht)."
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {entries.map((entry) => (
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

      <div className="mt-2 flex justify-center gap-2">
        <Button size="sm" variant="ghost" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
          Zurück
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setPage((p) => p + 1)}>
          Weiter
        </Button>
      </div>
    </div>
  );
}
