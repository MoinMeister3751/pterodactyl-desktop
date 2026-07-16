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

  if (error) {
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
  );
}
