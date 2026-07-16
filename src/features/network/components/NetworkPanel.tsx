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
import { ApiError } from "@/lib/api/errors";
import type { AllocationAttributes } from "@/lib/types/pterodactyl";

export function NetworkPanel({ identifier }: { identifier: string }) {
  const api = useClientApi();
  const toast = useToast();
  const [allocations, setAllocations] = useState<AllocationAttributes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);

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
  if (allocations.length === 0) {
    return <EmptyState title="Keine Allokationen" description="Diesem Server sind keine Netzwerk-Ports zugewiesen." />;
  }

  return (
    <div className="flex flex-col gap-3">
      {allocations.map((allocation) => (
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
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
