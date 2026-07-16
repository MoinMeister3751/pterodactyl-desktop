import { useAdminUsers } from "../hooks";
import { Badge } from "@/components/ui/Badge";
import { SkeletonServerCard } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTime } from "@/lib/utils/format";

export function UsersTable() {
  const { data: users, loading, error, refetch } = useAdminUsers();

  if (loading) return <SkeletonServerCard />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (users.length === 0) return <EmptyState title="Keine Nutzer" description="Keine Nutzer gefunden." />;

  return (
    <div className="overflow-x-auto rounded-lg border border-base-700">
      <table className="w-full text-sm">
        <thead className="bg-base-900 text-xs text-base-400">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Nutzername</th>
            <th className="px-3 py-2 text-left font-medium">E-Mail</th>
            <th className="px-3 py-2 text-left font-medium">Name</th>
            <th className="px-3 py-2 text-right font-medium">Rolle</th>
            <th className="px-3 py-2 text-right font-medium">Registriert</th>
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
              <td className="px-3 py-2 text-right text-xs text-base-400">{formatDateTime(user.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
