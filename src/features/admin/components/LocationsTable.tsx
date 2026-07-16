import { useAdminLocations } from "../hooks";
import { SkeletonServerCard } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTime } from "@/lib/utils/format";
import type { NodeAttributes } from "@/lib/types/application";

interface LocationsTableProps {
  nodes: NodeAttributes[];
}

export function LocationsTable({ nodes }: LocationsTableProps) {
  const { data: locations, loading, error, refetch } = useAdminLocations();

  if (loading) return <SkeletonServerCard />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (locations.length === 0) {
    return <EmptyState title="Keine Standorte" description="Auf diesem Panel sind keine Locations eingerichtet." />;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-base-700">
      <table className="w-full text-sm">
        <thead className="bg-base-900 text-xs text-base-400">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Kurzname</th>
            <th className="px-3 py-2 text-left font-medium">Beschreibung</th>
            <th className="px-3 py-2 text-right font-medium">Nodes</th>
            <th className="px-3 py-2 text-right font-medium">Erstellt</th>
          </tr>
        </thead>
        <tbody>
          {locations.map((location) => (
            <tr key={location.id} className="border-t border-base-800 hover:bg-base-900/60">
              <td className="px-3 py-2 font-medium text-base-100">{location.short}</td>
              <td className="px-3 py-2 text-base-300">{location.long || "—"}</td>
              <td className="px-3 py-2 text-right font-mono text-xs text-base-300">
                {nodes.filter((n) => n.location_id === location.id).length}
              </td>
              <td className="px-3 py-2 text-right text-xs text-base-400">{formatDateTime(location.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
