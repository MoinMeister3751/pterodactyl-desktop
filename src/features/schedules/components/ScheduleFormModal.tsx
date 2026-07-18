import { useEffect, useState, type ReactNode } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { useClientApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/useToast";
import { ApiError } from "@/lib/api/errors";
import type { ScheduleAttributes } from "@/lib/types/pterodactyl";

interface ScheduleFormModalProps {
  identifier: string;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editingSchedule: ScheduleAttributes | null;
}

export function ScheduleFormModal({ identifier, open, onClose, onSaved, editingSchedule }: ScheduleFormModalProps) {
  const api = useClientApi();
  const toast = useToast();
  const [name, setName] = useState("");
  const [minute, setMinute] = useState("*/30");
  const [hour, setHour] = useState("*");
  const [dayOfMonth, setDayOfMonth] = useState("*");
  const [dayOfWeek, setDayOfWeek] = useState("*");
  const [isActive, setIsActive] = useState(true);
  const [onlyWhenOnline, setOnlyWhenOnline] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(editingSchedule?.name ?? "");
    setMinute(editingSchedule?.cron.minute ?? "*/30");
    setHour(editingSchedule?.cron.hour ?? "*");
    setDayOfMonth(editingSchedule?.cron.day_of_month ?? "*");
    setDayOfWeek(editingSchedule?.cron.day_of_week ?? "*");
    setIsActive(editingSchedule?.is_active ?? true);
    setOnlyWhenOnline(editingSchedule?.only_when_online ?? false);
    setError(null);
  }, [open, editingSchedule]);

  async function handleSave() {
    if (!api || !name.trim()) {
      setError("Name darf nicht leer sein.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      name: name.trim(),
      minute,
      hour,
      day_of_month: dayOfMonth,
      day_of_week: dayOfWeek,
      is_active: isActive,
      only_when_online: onlyWhenOnline,
    };
    try {
      if (editingSchedule) {
        await api.updateSchedule(identifier, editingSchedule.id, payload);
        toast.success("Zeitplan aktualisiert", name.trim());
      } else {
        await api.createSchedule(identifier, payload);
        toast.success("Zeitplan erstellt", name.trim());
      }
      onSaved();
      onClose();
    } catch (err) {
      const message = err instanceof ApiError ? err.userMessage : "Zeitplan konnte nicht gespeichert werden.";
      setError(message);
      toast.error("Speichern fehlgeschlagen", message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingSchedule ? "Zeitplan bearbeiten" : "Neuer Zeitplan"}
      description="Cron-Felder wie im Standard-Cron-Format (z. B. */30 für alle 30 Minuten, * für 'jede/jeden')."
      size="md"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          {error ? <p className="text-xs text-danger">{error}</p> : <span />}
          <div className="flex shrink-0 gap-2">
            <Button variant="ghost" onClick={onClose}>
              Abbrechen
            </Button>
            <Button variant="primary" onClick={() => void handleSave()} loading={saving}>
              Speichern
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <div className="grid grid-cols-4 gap-2">
          <Field label="Minute">
            <Input value={minute} onChange={(e) => setMinute(e.target.value)} className="font-mono" />
          </Field>
          <Field label="Stunde">
            <Input value={hour} onChange={(e) => setHour(e.target.value)} className="font-mono" />
          </Field>
          <Field label="Tag (Monat)">
            <Input value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} className="font-mono" />
          </Field>
          <Field label="Wochentag">
            <Input value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)} className="font-mono" />
          </Field>
        </div>
        <div className="flex items-center justify-between rounded-md border border-base-700 px-3 py-2">
          <p className="text-sm text-base-100">Aktiv</p>
          <Switch checked={isActive} onChange={setIsActive} />
        </div>
        <div className="flex items-center justify-between rounded-md border border-base-700 px-3 py-2">
          <div>
            <p className="text-sm text-base-100">Nur wenn Server online ist</p>
            <p className="text-[11px] text-base-400">Überspringt den Lauf, falls der Server gerade offline ist.</p>
          </div>
          <Switch checked={onlyWhenOnline} onChange={setOnlyWhenOnline} />
        </div>
      </div>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-base-300">{label}</span>
      {children}
    </label>
  );
}
