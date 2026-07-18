import { ServerCard } from "./ServerCard";
import { SkeletonServerCard } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import type { ServerAttributes, ServerResourcesAttributes } from "@/lib/types/pterodactyl";
import type { NodeLocationLookup } from "@/lib/types/application";

interface ServerListProps {
  servers: ServerAttributes[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  hasAnyServers: boolean;
  nodeLocationLookup: Map<string, NodeLocationLookup> | null;
  resourcesMap: Map<string, ServerResourcesAttributes>;
}

export function ServerList({
  servers,
  loading,
  error,
  onRetry,
  hasAnyServers,
  nodeLocationLookup,
  resourcesMap,
}: ServerListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonServerCard key={i} />
        ))}
      </div>
    );
  }

  // Ein Fehler beim Hintergrund-Refresh (z. B. kurzzeitiges Rate-Limit) darf eine
  // bereits erfolgreich geladene Liste nicht mehr komplett durch eine Fehlerseite
  // ersetzen - das wirkte wie ein Absturz, obwohl die Daten noch da waren. Die
  // volle Fehlerseite gibt es nur, wenn wirklich noch nichts geladen werden konnte.
  if (error && servers.length === 0) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  if (servers.length === 0 && !hasAnyServers) {
    return (
      <EmptyState
        title="Keine Server gefunden"
        description="Diesem Account sind auf dem Panel keine Server zugewiesen."
      />
    );
  }

  if (servers.length === 0) {
    return (
      <EmptyState
        title="Keine Treffer"
        description="Keine Server entsprechen der aktuellen Suche/Filterung."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <div className="flex items-center justify-between rounded-md border border-warning/30 bg-warning-bg px-3 py-2 text-xs text-warning">
          <span>Aktualisierung fehlgeschlagen: {error}</span>
          <button onClick={onRetry} className="shrink-0 font-medium underline hover:no-underline">
            Erneut versuchen
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {servers.map((server) => (
          <ServerCard
            key={server.identifier}
            server={server}
            locationInfo={nodeLocationLookup?.get(server.node)}
            resources={resourcesMap.get(server.identifier)}
          />
        ))}
      </div>
    </div>
  );
}
