import { useNavigate } from "react-router-dom";
import { useAdminServers } from "../hooks";
import { Badge } from "@/components/ui/Badge";
import { SkeletonServerCard } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatBytes } from "@/lib/utils/format";
import type { AdminUserAttributes, NodeAttributes } from "@/lib/types/application";

interface AdminServersTableProps {
  nodes: NodeAttributes[];
  users: AdminUserAttributes[];
}

export function AdminServersTable({ nodes, users }: AdminServersTableProps) {
  const { data: servers, loading, error, refetch } = useAdminServers();
  const navigate = useNavigate();
  const nodesById = new Map(nodes.map((n) => [n.id, n]));
  const usersById = new Map(users.map((u) => [u.id, u]));

  if (loading) return <SkeletonServerCard />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (servers.length === 0) {
    return <EmptyState title="Keine Server" description="Auf diesem Panel sind keine Server eingerichtet." />;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-base-700">
      <table className="w-full text-sm">
        <thead className="bg-base-900 text-xs text-base-400">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Name</th>
            <th className="px-3 py-2 text-left font-medium">Besitzer</th>
            <th className="px-3 py-2 text-left font-medium">Node</th>
            <th className="px-3 py-2 text-right font-medium">RAM-Limit</th>
            <th className="px-3 py-2 text-right font-medium">Disk-Limit</th>
            <th className="px-3 py-2 text-right font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {servers.map((server) => (
            <tr
              key={server.id}
              onClick={() => navigate(`/servers/${server.identifier}`)}
              className="cursor-pointer border-t border-base-800 hover:bg-base-900/60"
            >
              <td className="px-3 py-2 text-base-100">{server.name}</td>
              <td className="px-3 py-2 text-base-300">{usersById.get(server.user)?.username ?? `#${server.user}`}</td>
              <td className="px-3 py-2 text-base-300">{nodesById.get(server.node)?.name ?? `#${server.node}`}</td>
              <td className="px-3 py-2 text-right font-mono text-xs text-base-300">
                {server.limits.memory === 0 ? "∞" : formatBytes(server.limits.memory * 1024 * 1024)}
              </td>
              <td className="px-3 py-2 text-right font-mono text-xs text-base-300">
                {server.limits.disk === 0 ? "∞" : formatBytes(server.limits.disk * 1024 * 1024)}
              </td>
              <td className="px-3 py-2 text-right">
                {server.suspended ? (
                  <Badge tone="danger">Gesperrt</Badge>
                ) : server.status ? (
                  <Badge tone="warning">{server.status}</Badge>
                ) : (
                  <Badge tone="success">Aktiv</Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
