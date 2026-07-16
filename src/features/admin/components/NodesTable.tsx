import { useAdminNodes } from "../hooks";
import { Badge } from "@/components/ui/Badge";
import { SkeletonServerCard } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatBytes } from "@/lib/utils/format";
import type { LocationAttributes } from "@/lib/types/application";

interface NodesTableProps {
  locations: LocationAttributes[];
}

export function NodesTable({ locations }: NodesTableProps) {
  const { data: nodes, loading, error, refetch } = useAdminNodes();
  const locationsById = new Map(locations.map((l) => [l.id, l]));

  if (loading) return <SkeletonServerCard />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (nodes.length === 0) return <EmptyState title="Keine Nodes" description="Auf diesem Panel sind keine Nodes eingerichtet." />;

  return (
    <div className="overflow-x-auto rounded-lg border border-base-700">
      <table className="w-full text-sm">
        <thead className="bg-base-900 text-xs text-base-400">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Name</th>
            <th className="px-3 py-2 text-left font-medium">Standort</th>
            <th className="px-3 py-2 text-left font-medium">FQDN</th>
            <th className="px-3 py-2 text-right font-medium">RAM (Kapazität)</th>
            <th className="px-3 py-2 text-right font-medium">Disk (Kapazität)</th>
            <th className="px-3 py-2 text-right font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {nodes.map((node) => {
            const location = locationsById.get(node.location_id);
            return (
              <tr key={node.id} className="border-t border-base-800 hover:bg-base-900/60">
                <td className="px-3 py-2 text-base-100">{node.name}</td>
                <td className="px-3 py-2 text-base-300">{location ? location.short : "—"}</td>
                <td className="px-3 py-2 font-mono text-xs text-base-400">
                  {node.scheme}://{node.fqdn}:{node.daemon_listen}
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs text-base-300">
                  {formatBytes(node.memory * 1024 * 1024)}
                  {node.memory_overallocate > 0 && (
                    <span className="text-base-500"> (+{node.memory_overallocate}%)</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs text-base-300">
                  {formatBytes(node.disk * 1024 * 1024)}
                  {node.disk_overallocate > 0 && (
                    <span className="text-base-500"> (+{node.disk_overallocate}%)</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="flex justify-end gap-1.5">
                    {node.maintenance_mode && <Badge tone="warning">Wartung</Badge>}
                    <Badge tone={node.public ? "success" : "neutral"}>{node.public ? "Öffentlich" : "Privat"}</Badge>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
