import { useState } from "react";
import { useSubusers } from "../hooks";
import { AddSubuserModal } from "./AddSubuserModal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SkeletonServerCard } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { useClientApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/useToast";
import { useConfirm } from "@/hooks/useConfirm";
import type { SubuserAttributes } from "@/lib/types/pterodactyl";

export function SubusersPanel({ identifier }: { identifier: string }) {
  const { subusers, loading, error, refetch } = useSubusers(identifier);
  const api = useClientApi();
  const toast = useToast();
  const confirm = useConfirm();
  const [addOpen, setAddOpen] = useState(false);
  const [busyUuid, setBusyUuid] = useState<string | null>(null);

  async function handleRemove(subuser: SubuserAttributes) {
    if (!api) return;
    const confirmed = await confirm({
      title: `Zugriff für "${subuser.username}" entfernen?`,
      confirmLabel: "Entfernen",
      destructive: true,
    });
    if (!confirmed) return;
    setBusyUuid(subuser.uuid);
    try {
      await api.removeSubuser(identifier, subuser.uuid);
      toast.success("Zugriff entfernt", subuser.username);
      void refetch();
    } catch (err) {
      toast.error("Entfernen fehlgeschlagen", err);
    } finally {
      setBusyUuid(null);
    }
  }

  if (loading) return <SkeletonServerCard />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-base-400">{subusers.length} Nutzer mit Zugriff (ohne dich selbst als Besitzer)</p>
        <Button size="sm" variant="primary" onClick={() => setAddOpen(true)}>
          + Nutzer hinzufügen
        </Button>
      </div>

      {subusers.length === 0 ? (
        <EmptyState title="Keine weiteren Nutzer" description="Diesem Server wurden noch keine Subuser hinzugefügt." />
      ) : (
        <div className="flex flex-col gap-2">
          {subusers.map((subuser) => (
            <div
              key={subuser.uuid}
              className="flex items-center justify-between rounded-lg border border-base-700 bg-base-850 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-base-100">{subuser.username}</p>
                  {subuser["2fa_enabled"] && <Badge tone="success">2FA</Badge>}
                </div>
                <p className="mt-0.5 truncate text-[11px] text-base-500">{subuser.permissions.length} Berechtigungen</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-danger hover:text-danger"
                loading={busyUuid === subuser.uuid}
                onClick={() => void handleRemove(subuser)}
              >
                Entfernen
              </Button>
            </div>
          ))}
        </div>
      )}

      <AddSubuserModal identifier={identifier} open={addOpen} onClose={() => setAddOpen(false)} onAdded={refetch} />
    </div>
  );
}
