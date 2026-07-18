import { useState, type ReactNode } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { useApplicationApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/useToast";
import { ApiError } from "@/lib/api/errors";

interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateUserModal({ open, onClose, onCreated }: CreateUserModalProps) {
  const api = useApplicationApi();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [rootAdmin, setRootAdmin] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setEmail("");
    setUsername("");
    setFirstName("");
    setLastName("");
    setPassword("");
    setRootAdmin(false);
    setError(null);
  }

  async function handleCreate() {
    if (!api) return;
    if (!email.trim() || !username.trim() || !firstName.trim() || !lastName.trim()) {
      setError("Bitte alle Pflichtfelder ausfüllen.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const user = await api.createUser({
        email: email.trim(),
        username: username.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        password: password.trim() || undefined,
        root_admin: rootAdmin,
      });
      toast.success("Nutzer erstellt", user.username);
      reset();
      onCreated();
      onClose();
    } catch (err) {
      const message = err instanceof ApiError ? err.userMessage : "Nutzer konnte nicht erstellt werden.";
      setError(message);
      toast.error("Nutzer konnte nicht erstellt werden", message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Nutzer hinzufügen"
      description="Legt einen neuen Panel-Account über die Application API an."
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Abbrechen
          </Button>
          <Button variant="primary" onClick={() => void handleCreate()} loading={saving}>
            Erstellen
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Vorname">
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </Field>
          <Field label="Nachname">
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </Field>
        </div>
        <Field label="Benutzername">
          <Input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="off" />
        </Field>
        <Field label="E-Mail">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
        </Field>
        <Field
          label="Passwort (optional)"
          hint="Leer lassen, damit Pterodactyl eine E-Mail zum Festlegen des Passworts sendet (falls Mailversand konfiguriert ist)."
        >
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        </Field>
        <div className="flex items-center justify-between rounded-md border border-base-700 px-3 py-2">
          <div>
            <p className="text-sm text-base-100">Admin-Rechte</p>
            <p className="text-[11px] text-base-400">Voller Zugriff auf das Panel (root_admin).</p>
          </div>
          <Switch checked={rootAdmin} onChange={setRootAdmin} />
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    </Modal>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-base-300">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-base-400">{hint}</span>}
    </label>
  );
}
