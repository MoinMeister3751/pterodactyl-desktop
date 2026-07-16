import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminServers, useOwnAccountId } from "../hooks";
import { CreateServerModal } from "./CreateServerModal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { SkeletonServerCard } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { useApplicationApi } from "@/hooks/useApi";
import { useConfirm } from "@/hooks/useConfirm";
import { useToast } from "@/hooks/useToast";
import { formatBytes } from "@/lib/utils/format";
import type { AdminServerAttributes, AdminUserAttributes, NodeAttributes } from "@/lib/types/application";

interface AdminServersTableProps {
  nodes: NodeAttributes[];
  users: AdminUserAttributes[];
}

export function AdminServersTable({ nodes, users }: AdminServersTableProps) {
  const { data: servers, loading, error, refetch } = useAdminServers();
  const ownAccountId = useOwnAccountId();
  const api = useApplicationApi();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const toast = useToast();
  const nodesById = new Map(nodes.map((n) => [n.id, n]));
  const usersById = new Map(users.map((u) => [u.id, u]));

  const [showAll, setShowAll] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const visibleServers = useMemo(() => {
    if (showAll || ownAccountId === null) return servers;
    return servers.filter((s) => s.user === ownAccountId);
  }, [servers, showAll, ownAccountId]);

  async function handleDelete(server: AdminServerAttributes) {
    if (!api) return;
    const confirmed = await confirm({
      title: `Server "${server.name}" löschen?`,
      description: "Der Server, alle Dateien und Backups werden auf dem Node endgültig gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.",
      confirmLabel: "Endgültig löschen",
      destructive: true,
    });
    if (!confirmed) return;
    setBusyId(server.id);
    try {
      await api.deleteServer(server.id);
      toast.success("Server gelöscht", server.name);
      void refetch();
    } catch (err) {
      toast.error("Löschen fehlgeschlagen", err);
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <SkeletonServerCard />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Switch checked={showAll} onChange={setShowAll} label="Alle Server anzeigen" />
          <span className="text-xs text-base-300">{showAll ? "Alle Server (panelweit)" : "Nur meine Server"}</span>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-base-400">{visibleServers.length} Server</p>
          <Button size="sm" variant="primary" onClick={() => setCreateOpen(true)}>
            + Server hinzufügen
          </Button>
        </div>
      </div>

      {visibleServers.length === 0 ? (
        <EmptyState
          title={showAll ? "Keine Server" : "Keine eigenen Server"}
          description={showAll ? "Auf diesem Panel sind keine Server eingerichtet." : "Dir sind auf diesem Panel keine Server zugeordnet."}
        />
      ) : (
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
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {visibleServers.map((server) => (
                <tr key={server.id} className="border-t border-base-800 hover:bg-base-900/60">
                  <td
                    className="cursor-pointer px-3 py-2 text-base-100"
                    onClick={() => navigate(`/servers/${server.identifier}`)}
                  >
                    {server.name}
                  </td>
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
                  <td className="px-3 py-2 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-danger hover:text-danger"
                      loading={busyId === server.id}
                      onClick={() => void handleDelete(server)}
                    >
                      Löschen
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateServerModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={refetch} users={users} />
    </div>
  );
}
