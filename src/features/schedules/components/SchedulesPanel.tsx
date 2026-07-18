import { useState } from "react";
import { useSchedules } from "../hooks";
import { ScheduleFormModal } from "./ScheduleFormModal";
import { ScheduleTaskList } from "./ScheduleTaskList";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SkeletonServerCard } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { useClientApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/useToast";
import { useConfirm } from "@/hooks/useConfirm";
import { formatDateTime } from "@/lib/utils/format";
import type { ScheduleAttributes } from "@/lib/types/pterodactyl";

export function SchedulesPanel({ identifier }: { identifier: string }) {
  const { schedules, loading, error, refetch } = useSchedules(identifier);
  const api = useClientApi();
  const toast = useToast();
  const confirm = useConfirm();
  const [formOpen, setFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleAttributes | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function handleDelete(schedule: ScheduleAttributes) {
    if (!api) return;
    const confirmed = await confirm({
      title: `Zeitplan "${schedule.name}" löschen?`,
      confirmLabel: "Löschen",
      destructive: true,
    });
    if (!confirmed) return;
    setBusyId(schedule.id);
    try {
      await api.deleteSchedule(identifier, schedule.id);
      toast.success("Zeitplan gelöscht", schedule.name);
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
        <p className="text-xs text-base-400">{schedules.length} Zeitplan/Zeitpläne</p>
        <Button
          size="sm"
          variant="primary"
          onClick={() => {
            setEditingSchedule(null);
            setFormOpen(true);
          }}
        >
          + Zeitplan erstellen
        </Button>
      </div>

      {schedules.length === 0 ? (
        <EmptyState title="Keine Zeitpläne" description="Automatisiere wiederkehrende Aktionen wie Neustarts oder Backups." />
      ) : (
        <div className="flex flex-col gap-2">
          {schedules.map((schedule) => (
            <div key={schedule.id} className="rounded-lg border border-base-700 bg-base-850 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  className="flex min-w-0 items-center gap-2 text-left"
                  onClick={() => setExpandedId((id) => (id === schedule.id ? null : schedule.id))}
                >
                  <p className="truncate text-sm font-medium text-base-100">{schedule.name}</p>
                  <code className="rounded bg-base-800 px-1.5 py-0.5 text-[11px] text-base-400">
                    {schedule.cron.minute} {schedule.cron.hour} {schedule.cron.day_of_month} * {schedule.cron.day_of_week}
                  </code>
                  {schedule.is_active ? <Badge tone="success">Aktiv</Badge> : <Badge tone="neutral">Inaktiv</Badge>}
                  {schedule.is_processing && <Badge tone="warning">Läuft…</Badge>}
                </button>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingSchedule(schedule);
                      setFormOpen(true);
                    }}
                  >
                    Bearbeiten
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-danger hover:text-danger"
                    loading={busyId === schedule.id}
                    onClick={() => void handleDelete(schedule)}
                  >
                    Löschen
                  </Button>
                </div>
              </div>
              <p className="mt-1 text-[11px] text-base-500">
                Letzter Lauf: {schedule.last_run_at ? formatDateTime(schedule.last_run_at) : "nie"} · Nächster Lauf:{" "}
                {schedule.next_run_at ? formatDateTime(schedule.next_run_at) : "—"}
              </p>

              {expandedId === schedule.id && (
                <ScheduleTaskList identifier={identifier} schedule={schedule} onChanged={refetch} />
              )}
            </div>
          ))}
        </div>
      )}

      <ScheduleFormModal
        identifier={identifier}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={refetch}
        editingSchedule={editingSchedule}
      />
    </div>
  );
}
