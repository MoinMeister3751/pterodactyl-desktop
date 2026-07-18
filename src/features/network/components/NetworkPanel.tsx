import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SkeletonServerCard } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { useClientApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/useToast";
import { useConfirm } from "@/hooks/useConfirm";
import { ApiError } from "@/lib/api/errors";
import type { AllocationAttributes } from "@/lib/types/pterodactyl";

interface NetworkPanelProps {
  identifier: string;
  /** feature_limits.allocations des Servers - 0 bedeutet "keine zusätzlichen Allokationen erlaubt". */
  allocationLimit: number;
}

export function NetworkPanel({ identifier, allocationLimit }: NetworkPanelProps) {
  const api = useClientApi();
  const toast = useToast();
  const confirm = useConfirm();
  const [allocations, setAllocations] = useState<AllocationAttributes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const atLimit = allocationLimit > 0 && allocations.length >= allocationLimit;

  async function load() {
    if (!api) return;
    setError(null);
    try {
      const data = await api.listAllocations(identifier);
      setAllocations(data);
      setNotesDraft(Object.fromEntries(data.map((a) => [a.id, a.notes ?? ""])));
    } catch (err) {
      setError(err instanceof ApiError ? err.userMessage : "Netzwerkdaten konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, identifier]);

  async function handleCreate() {
    if (!api) return;
    setCreating(true);
    try {
      const allocation = await api.createAllocation(identifier);
      toast.success("Allokation hinzugefügt", `${allocation.ip}:${allocation.port}`);
      void load();
    } catch (err) {
      toast.error("Allokation konnte nicht hinzugefügt werden", err);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(allocation: AllocationAttributes) {
    if (!api) return;
    if (allocation.is_default) {
      toast.warning("Primäre Allokation kann nicht gelöscht werden", "Setze zuerst eine andere Allokation als primär.");
      return;
    }
    const confirmed = await confirm({
      title: `Allokation ${allocation.ip}:${allocation.port} löschen?`,
      description: "Der Server ist über diesen Port danach nicht mehr erreichbar.",
      confirmLabel: "Löschen",
      destructive: true,
    });
    if (!confirmed) return;
    setBusyId(allocation.id);
    try {
      await api.deleteAllocation(identifier, allocation.id);
      toast.success("Allokation gelöscht");
      void load();
    } catch (err) {
      toast.error("Löschen fehlgeschlagen", err);
    } finally {
      setBusyId(null);
    }
  }

  async function handleSetPrimary(allocation: AllocationAttributes) {
    if (!api) return;
    setBusyId(allocation.id);
    try {
      await api.setPrimaryAllocation(identifier, allocation.id);
      toast.success("Primäre Allokation gesetzt", `${allocation.ip}:${allocation.port}`);
      void load();
    } catch (err) {
      toast.error("Konnte nicht gesetzt werden", err);
    } finally {
      setBusyId(null);
    }
  }

  async function handleSaveNotes(allocation: AllocationAttributes) {
    if (!api) return;
    setBusyId(allocation.id);
    try {
      await api.updateAllocationNotes(identifier, allocation.id, notesDraft[allocation.id] ?? "");
      toast.success("Notiz gespeichert");
      void load();
    } catch (err) {
      toast.error("Notiz konnte nicht gespeichert werden", err);
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <SkeletonServerCard />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-base-400">
          {allocations.length} von {allocationLimit > 0 ? allocationLimit : "∞"} Allokationen verwendet
        </p>
        <Button
          size="sm"
          variant="primary"
          onClick={() => void handleCreate()}
          loading={creating}
          disabled={atLimit}
          title={atLimit ? "Allokations-Limit erreicht" : undefined}
        >
          + Allokation hinzufügen
        </Button>
      </div>
      {atLimit && (
        <p className="text-xs text-warning">
          Allokations-Limit erreicht ({allocationLimit}/{allocationLimit}).
        </p>
      )}

      {allocations.length === 0 ? (
        <EmptyState title="Keine Allokationen" description="Diesem Server sind keine Netzwerk-Ports zugewiesen." />
      ) : (
        allocations.map((allocation) => (
          <Card key={allocation.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-mono text-sm text-base-100">
                    {allocation.ip_alias ?? allocation.ip}:{allocation.port}
                  </p>
                  {allocation.is_default && <Badge tone="accent">Primär</Badge>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Notiz…"
                  value={notesDraft[allocation.id] ?? ""}
                  onChange={(e) => setNotesDraft((prev) => ({ ...prev, [allocation.id]: e.target.value }))}
                  className="w-48"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  loading={busyId === allocation.id}
                  onClick={() => void handleSaveNotes(allocation)}
                >
                  Speichern
                </Button>
                {!allocation.is_default && (
                  <Button
                    size="sm"
                    variant="outline"
                    loading={busyId === allocation.id}
                    onClick={() => void handleSetPrimary(allocation)}
                  >
                    Als primär setzen
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-danger hover:text-danger"
                  disabled={allocation.is_default}
                  loading={busyId === allocation.id}
                  onClick={() => void handleDelete(allocation)}
                >
                  Löschen
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
