import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { useClientApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/useToast";
import { useConfirm } from "@/hooks/useConfirm";
import type { ScheduleAttributes } from "@/lib/types/pterodactyl";

const ACTION_LABELS: Record<string, string> = {
  command: "Befehl senden",
  power: "Power-Signal",
  backup: "Backup erstellen",
};

interface ScheduleTaskListProps {
  identifier: string;
  schedule: ScheduleAttributes;
  onChanged: () => void;
}

export function ScheduleTaskList({ identifier, schedule, onChanged }: ScheduleTaskListProps) {
  const api = useClientApi();
  const toast = useToast();
  const confirm = useConfirm();
  const tasks = schedule.relationships?.tasks?.data ?? [];
  const [addingOpen, setAddingOpen] = useState(false);
  const [action, setAction] = useState<"command" | "power" | "backup">("command");
  const [payload, setPayload] = useState("");
  const [timeOffset, setTimeOffset] = useState(0);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function handleAddTask() {
    if (!api) return;
    setSaving(true);
    try {
      await api.createScheduleTask(identifier, schedule.id, {
        action,
        payload: action === "power" ? payload || "restart" : payload,
        time_offset: timeOffset,
      });
      toast.success("Aufgabe hinzugefügt");
      setAddingOpen(false);
      setPayload("");
      setTimeOffset(0);
      onChanged();
    } catch (err) {
      toast.error("Aufgabe konnte nicht hinzugefügt werden", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteTask(taskId: number) {
    if (!api) return;
    const confirmed = await confirm({ title: "Aufgabe löschen?", confirmLabel: "Löschen", destructive: true });
    if (!confirmed) return;
    setBusyId(taskId);
    try {
      await api.deleteScheduleTask(identifier, schedule.id, taskId);
      toast.success("Aufgabe gelöscht");
      onChanged();
    } catch (err) {
      toast.error("Löschen fehlgeschlagen", err);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mt-2 flex flex-col gap-2 border-t border-base-700 pt-2">
      {tasks.length === 0 && <p className="text-xs text-base-400">Noch keine Aufgaben in diesem Zeitplan.</p>}
      {tasks.map((task) => (
        <div
          key={task.attributes.id}
          className="flex items-center justify-between rounded-md bg-base-900 px-3 py-2 text-xs"
        >
          <div className="min-w-0">
            <Badge tone="neutral">{ACTION_LABELS[task.attributes.action] ?? task.attributes.action}</Badge>
            <span className="ml-2 truncate font-mono text-base-300">{task.attributes.payload || "—"}</span>
            <span className="ml-2 text-base-500">+{task.attributes.time_offset}s</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-danger hover:text-danger"
            loading={busyId === task.attributes.id}
            onClick={() => void handleDeleteTask(task.attributes.id)}
          >
            Löschen
          </Button>
        </div>
      ))}

      {addingOpen ? (
        <div className="flex flex-wrap items-end gap-2 rounded-md bg-base-900 p-2">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] text-base-400">Aktion</span>
            <Select value={action} onChange={(e) => setAction(e.target.value as typeof action)} className="w-36">
              <option value="command">Befehl senden</option>
              <option value="power">Power-Signal</option>
              <option value="backup">Backup erstellen</option>
            </Select>
          </label>
          {action !== "backup" && (
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-base-400">
                {action === "power" ? "Signal (start/stop/restart/kill)" : "Befehl"}
              </span>
              <Input value={payload} onChange={(e) => setPayload(e.target.value)} className="w-48" />
            </label>
          )}
          <label className="flex flex-col gap-1">
            <span className="text-[11px] text-base-400">Verzögerung (s)</span>
            <Input
              type="number"
              value={timeOffset}
              onChange={(e) => setTimeOffset(Number(e.target.value))}
              className="w-24"
            />
          </label>
          <Button size="sm" variant="primary" onClick={() => void handleAddTask()} loading={saving}>
            Hinzufügen
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setAddingOpen(false)}>
            Abbrechen
          </Button>
        </div>
      ) : (
        <Button size="sm" variant="ghost" onClick={() => setAddingOpen(true)} className="self-start">
          + Aufgabe hinzufügen
        </Button>
      )}
    </div>
  );
}
