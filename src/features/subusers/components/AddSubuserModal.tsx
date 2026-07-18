import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { PERMISSION_GROUPS } from "../hooks";
import { useApplicationApi, useClientApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/useToast";
import { ApiError } from "@/lib/api/errors";
import type { AdminUserAttributes } from "@/lib/types/application";

interface AddSubuserModalProps {
  identifier: string;
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}

export function AddSubuserModal({ identifier, open, onClose, onAdded }: AddSubuserModalProps) {
  const clientApi = useClientApi();
  const applicationApi = useApplicationApi();
  const toast = useToast();
  const [allUsers, setAllUsers] = useState<AdminUserAttributes[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [manualEmail, setManualEmail] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set(["control.console"]));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Nutzerliste ohne E-Mail-Anzeige: nur der Username wird gerendert (Datenschutz), die
  // E-Mail wird intern nur für den eigentlichen API-Aufruf verwendet (Pterodactyl lädt
  // Subuser ausschließlich per E-Mail ein - im Admin-Bereich ist die E-Mail dagegen
  // bewusst sichtbar, siehe features/admin/components/UsersTable.tsx).
  useEffect(() => {
    if (!open || !applicationApi) return;
    applicationApi
      .listUsers()
      .then(setAllUsers)
      .catch(() => setAllUsers([]));
  }, [open, applicationApi]);

  useEffect(() => {
    if (!open) return;
    setSelectedUserId(null);
    setManualEmail("");
    setSelectedPermissions(new Set(["control.console"]));
    setError(null);
  }, [open]);

  function toggleGroup(permissions: string[], enabled: boolean) {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      for (const p of permissions) {
        if (enabled) next.add(p);
        else next.delete(p);
      }
      return next;
    });
  }

  async function handleSubmit() {
    if (!clientApi) return;
    const email = allUsers.length > 0 ? allUsers.find((u) => u.id === selectedUserId)?.email : manualEmail.trim();
    if (!email) {
      setError("Bitte einen Nutzer auswählen bzw. eine E-Mail-Adresse eingeben.");
      return;
    }
    if (selectedPermissions.size === 0) {
      setError("Mindestens eine Berechtigung auswählen.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await clientApi.addSubuser(identifier, email, Array.from(selectedPermissions));
      toast.success("Nutzer hinzugefügt", email);
      onAdded();
      onClose();
    } catch (err) {
      const message = err instanceof ApiError ? err.userMessage : "Nutzer konnte nicht hinzugefügt werden.";
      setError(message);
      toast.error("Hinzufügen fehlgeschlagen", message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nutzer zum Server hinzufügen"
      description="Gewährt einem Panel-Account Zugriff auf diesen Server (Subuser)."
      size="md"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          {error ? <p className="text-xs text-danger">{error}</p> : <span />}
          <div className="flex shrink-0 gap-2">
            <Button variant="ghost" onClick={onClose}>
              Abbrechen
            </Button>
            <Button variant="primary" onClick={() => void handleSubmit()} loading={saving}>
              Hinzufügen
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        {allUsers.length > 0 ? (
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-base-300">Nutzer</span>
            <Select value={selectedUserId ?? ""} onChange={(e) => setSelectedUserId(Number(e.target.value))}>
              <option value="" disabled>
                Nutzer auswählen…
              </option>
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.username}
                </option>
              ))}
            </Select>
          </label>
        ) : (
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-base-300">E-Mail-Adresse</span>
            <Input value={manualEmail} onChange={(e) => setManualEmail(e.target.value)} placeholder="nutzer@example.com" />
          </label>
        )}

        <div>
          <p className="mb-1.5 text-xs font-medium text-base-300">Berechtigungen</p>
          <div className="grid grid-cols-2 gap-1.5">
            {PERMISSION_GROUPS.map((group) => {
              const allSelected = group.permissions.every((p) => selectedPermissions.has(p));
              return (
                <label
                  key={group.key}
                  className="flex items-center gap-2 rounded-md border border-base-700 px-2.5 py-1.5 text-xs text-base-200"
                >
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => toggleGroup(group.permissions, e.target.checked)}
                    className="h-3.5 w-3.5"
                  />
                  {group.label}
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}
