import { useMemo, useState } from "react";
import { useAdminUsers, useAdminServers, useSubuserAccessCounts } from "../hooks";
import { CreateUserModal } from "./CreateUserModal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SkeletonServerCard } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { useApplicationApi } from "@/hooks/useApi";
import { useConfirm } from "@/hooks/useConfirm";
import { useToast } from "@/hooks/useToast";
import { formatDateTime } from "@/lib/utils/format";
import type { AdminUserAttributes } from "@/lib/types/application";

export function UsersTable() {
  const { data: users, loading, error, refetch } = useAdminUsers();
  const { data: adminServers } = useAdminServers();
  const { counts: canAccessCounts } = useSubuserAccessCounts();
  const api = useApplicationApi();
  const confirm = useConfirm();
  const toast = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const ownedCountByUserId = useMemo(() => {
    const map = new Map<number, number>();
    for (const server of adminServers) {
      map.set(server.user, (map.get(server.user) ?? 0) + 1);
    }
    return map;
  }, [adminServers]);

  async function handleDelete(user: AdminUserAttributes) {
    if (!api) return;
    const confirmed = await confirm({
      title: `Nutzer "${user.username}" löschen?`,
      description:
        "Der Account wird endgültig gelöscht. Server, die ausschließlich diesem Nutzer gehören, muss das Panel-Setup vorher berücksichtigen - Pterodactyl verweigert das Löschen, solange dem Nutzer noch Server zugeordnet sind.",
      confirmLabel: "Löschen",
      destructive: true,
    });
    if (!confirmed) return;
    setBusyId(user.id);
    try {
      await api.deleteUser(user.id);
      toast.success("Nutzer gelöscht", user.username);
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
      <div className="flex items-center justify-between">
        <p className="text-xs text-base-400">{users.length} Nutzer</p>
        <Button size="sm" variant="primary" onClick={() => setCreateOpen(true)}>
          + Nutzer hinzufügen
        </Button>
      </div>

      {users.length === 0 ? (
        <EmptyState title="Keine Nutzer" description="Keine Nutzer gefunden." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-base-700">
          <table className="w-full text-sm">
            <thead className="bg-base-900 text-xs text-base-400">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Nutzername</th>
                <th className="px-3 py-2 text-left font-medium">E-Mail</th>
                <th className="px-3 py-2 text-left font-medium">Name</th>
                <th className="px-3 py-2 text-right font-medium">Rolle</th>
                <th className="px-3 py-2 text-right font-medium" title="Server, die dieser Nutzer besitzt">
                  Server Owned
                </th>
                <th
                  className="px-3 py-2 text-right font-medium"
                  title="Als Subuser zu Servern hinzugefügt, die DEIN Account besitzt (die Application API kennt keine panelweite Subuser-Übersicht)"
                >
                  Can Access
                </th>
                <th className="px-3 py-2 text-right font-medium">Registriert</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-base-800 hover:bg-base-900/60">
                  <td className="px-3 py-2 font-medium text-base-100">{user.username}</td>
                  <td className="px-3 py-2 text-base-300">{user.email}</td>
                  <td className="px-3 py-2 text-base-300">
                    {user.first_name} {user.last_name}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1.5">
                      {user.root_admin && <Badge tone="accent">Admin</Badge>}
                      {user["2fa"] && <Badge tone="success">2FA</Badge>}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs text-base-300">
                    {ownedCountByUserId.get(user.id) ?? 0}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs text-base-300">
                    {canAccessCounts.get(user.email) ?? 0}
                  </td>
                  <td className="px-3 py-2 text-right text-xs text-base-400">{formatDateTime(user.created_at)}</td>
                  <td className="px-3 py-2 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-danger hover:text-danger"
                      loading={busyId === user.id}
                      onClick={() => void handleDelete(user)}
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

      <CreateUserModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={refetch} />
    </div>
  );
}
