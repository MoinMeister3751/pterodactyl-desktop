import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useClientApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/useToast";
import { useConfirm } from "@/hooks/useConfirm";
import type { ServerAttributes } from "@/lib/types/pterodactyl";

interface ServerSettingsPanelProps {
  server: ServerAttributes;
  onRenamed: () => void;
}

export function ServerSettingsPanel({ server, onRenamed }: ServerSettingsPanelProps) {
  const api = useClientApi();
  const toast = useToast();
  const confirm = useConfirm();
  const [name, setName] = useState(server.name);
  const [description, setDescription] = useState(server.description);
  const [savingName, setSavingName] = useState(false);
  const [reinstalling, setReinstalling] = useState(false);

  const isDirty = name !== server.name || description !== server.description;

  async function handleRename() {
    if (!api || !name.trim()) return;
    setSavingName(true);
    try {
      await api.renameServer(server.identifier, name.trim(), description);
      toast.success("Server aktualisiert");
      onRenamed();
    } catch (err) {
      toast.error("Speichern fehlgeschlagen", err);
    } finally {
      setSavingName(false);
    }
  }

  async function handleReinstall() {
    if (!api) return;
    const confirmed = await confirm({
      title: "Server neu installieren?",
      description:
        "Wings führt das Install-Skript des Eggs erneut aus. Je nach Egg können dabei bestehende Dateien überschrieben werden. Der Server wird währenddessen gestoppt.",
      confirmLabel: "Neu installieren",
      destructive: true,
    });
    if (!confirmed) return;
    setReinstalling(true);
    try {
      await api.reinstallServer(server.identifier);
      toast.success("Neuinstallation gestartet", "Fortschritt ist in der Konsole sichtbar.");
    } catch (err) {
      toast.error("Neuinstallation fehlgeschlagen", err);
    } finally {
      setReinstalling(false);
    }
  }

  async function handleCopySftp() {
    const value = `sftp://${server.sftp_details.ip}:${server.sftp_details.port}`;
    await navigator.clipboard.writeText(value);
    toast.success("SFTP-Adresse kopiert", value);
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Allgemein</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-base-300">Servername</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-base-300">Beschreibung</span>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="h-20" />
          </label>
          <Button
            size="sm"
            variant="primary"
            className="self-start"
            disabled={!isDirty || !name.trim()}
            loading={savingName}
            onClick={() => void handleRename()}
          >
            Speichern
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SFTP-Zugang</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="font-mono text-sm text-base-200">
            {server.sftp_details.ip}:{server.sftp_details.port}
          </div>
          <Button size="sm" variant="outline" onClick={() => void handleCopySftp()}>
            Kopieren
          </Button>
        </CardContent>
      </Card>

      <Card className="border-danger/30">
        <CardHeader>
          <CardTitle className="text-danger">Gefahrenzone</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-base-100">Server neu installieren</p>
            <p className="text-xs text-base-400">Führt das Egg-Install-Skript erneut aus.</p>
          </div>
          <Button size="sm" variant="danger" loading={reinstalling} onClick={() => void handleReinstall()}>
            Neu installieren
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
