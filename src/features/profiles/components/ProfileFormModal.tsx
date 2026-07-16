import { useEffect, useState, type ReactNode } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useProfileStore } from "@/store/useProfileStore";
import { useToast } from "@/hooks/useToast";
import { testConnection } from "@/lib/api/apiClientFactory";
import {
  validateApiKey,
  validatePanelUrl,
  validateProfileName,
} from "@/lib/utils/validation";
import type { ConnectionTestResult, PanelProfile } from "@/lib/types/profile";

interface ProfileFormModalProps {
  open: boolean;
  onClose: () => void;
  editingProfile: PanelProfile | null;
}

export function ProfileFormModal({ open, onClose, editingProfile }: ProfileFormModalProps) {
  const [name, setName] = useState("");
  const [panelUrl, setPanelUrl] = useState("");
  const [clientApiKey, setClientApiKey] = useState("");
  const [applicationApiKey, setApplicationApiKey] = useState("");
  const [showApplicationKey, setShowApplicationKey] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [saving, setSaving] = useState(false);

  const addProfile = useProfileStore((s) => s.addProfile);
  const updateProfile = useProfileStore((s) => s.updateProfile);
  const setActiveProfile = useProfileStore((s) => s.setActiveProfile);
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    setName(editingProfile?.name ?? "");
    setPanelUrl(editingProfile?.panelUrl ?? "");
    setClientApiKey(editingProfile?.clientApiKey ?? "");
    setApplicationApiKey(editingProfile?.applicationApiKey ?? "");
    setShowApplicationKey(!!editingProfile?.applicationApiKey);
    setErrors({});
    setTestResult(null);
  }, [open, editingProfile]);

  function validate(): boolean {
    const nextErrors: Record<string, string> = {};
    const nameCheck = validateProfileName(name);
    if (!nameCheck.valid) nextErrors.name = nameCheck.message!;
    const urlCheck = validatePanelUrl(panelUrl);
    if (!urlCheck.valid) nextErrors.panelUrl = urlCheck.message!;
    const keyCheck = validateApiKey(clientApiKey, "client");
    if (!keyCheck.valid) nextErrors.clientApiKey = keyCheck.message!;
    if (applicationApiKey.trim()) {
      const appKeyCheck = validateApiKey(applicationApiKey, "application");
      if (!appKeyCheck.valid) nextErrors.applicationApiKey = appKeyCheck.message!;
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleTestConnection() {
    if (!validate()) return;
    setTesting(true);
    setTestResult(null);
    const result = await testConnection({
      panelUrl,
      clientApiKey,
      applicationApiKey: applicationApiKey.trim() || undefined,
    });
    setTestResult(result);
    setTesting(false);
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const draft = {
        name: name.trim(),
        panelUrl,
        clientApiKey: clientApiKey.trim(),
        applicationApiKey: applicationApiKey.trim() || undefined,
      };
      if (editingProfile) {
        await updateProfile(editingProfile.id, draft);
        toast.success("Profil aktualisiert", name);
      } else {
        const created = await addProfile(draft);
        await setActiveProfile(created.id);
        toast.success("Profil gespeichert", `"${name}" wurde hinzugefügt.`);
      }
      onClose();
    } catch (error) {
      toast.error("Profil konnte nicht gespeichert werden", error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingProfile ? "Profil bearbeiten" : "Neues Panel-Profil"}
      description="Verbindungsdaten werden lokal auf diesem Gerät gespeichert."
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Abbrechen
          </Button>
          <Button variant="outline" onClick={handleTestConnection} loading={testing}>
            Verbindung testen
          </Button>
          <Button variant="primary" onClick={handleSave} loading={saving}>
            Speichern
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Field label="Profilname">
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErrors((prev) => ({ ...prev, name: "" }));
            }}
            placeholder="z. B. Mein Netzwerk"
            error={errors.name}
          />
        </Field>

        <Field label="Panel-URL">
          <Input
            value={panelUrl}
            onChange={(e) => {
              setPanelUrl(e.target.value);
              setErrors((prev) => ({ ...prev, panelUrl: "" }));
              setTestResult(null);
            }}
            placeholder="https://panel.example.com"
            error={errors.panelUrl}
          />
        </Field>

        <Field label="Client-API-Key" hint="Account -> API Credentials, beginnt mit ptlc_">
          <Input
            type="password"
            value={clientApiKey}
            onChange={(e) => {
              setClientApiKey(e.target.value);
              setErrors((prev) => ({ ...prev, clientApiKey: "" }));
              setTestResult(null);
            }}
            placeholder="ptlc_••••••••••••••••••••"
            error={errors.clientApiKey}
            autoComplete="off"
          />
        </Field>

        {!showApplicationKey ? (
          <button
            type="button"
            onClick={() => setShowApplicationKey(true)}
            className="self-start text-xs text-accent-400 hover:text-accent-300"
          >
            + Application-API-Key hinzufügen (optional, für Admin-Funktionen)
          </button>
        ) : (
          <Field
            label="Application-API-Key (optional)"
            hint="Admin -> Application API, beginnt mit ptla_. Nur nötig für Node-/Location-/User-Daten."
          >
            <Input
              type="password"
              value={applicationApiKey}
              onChange={(e) => {
                setApplicationApiKey(e.target.value);
                setErrors((prev) => ({ ...prev, applicationApiKey: "" }));
                setTestResult(null);
              }}
              placeholder="ptla_••••••••••••••••••••"
              error={errors.applicationApiKey}
              autoComplete="off"
            />
          </Field>
        )}

        {testResult && (
          <div className="flex flex-col gap-1.5">
            <div
              className={`rounded-md px-3 py-2 text-xs ${
                testResult.ok ? "bg-success-bg text-success" : "bg-danger-bg text-danger"
              }`}
            >
              Client API: {testResult.message}
            </div>
            {testResult.applicationApi && (
              <div
                className={`rounded-md px-3 py-2 text-xs ${
                  testResult.applicationApi.ok ? "bg-success-bg text-success" : "bg-warning-bg text-warning"
                }`}
              >
                Application API: {testResult.applicationApi.message}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-base-300">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-base-400">{hint}</span>}
    </label>
  );
}
