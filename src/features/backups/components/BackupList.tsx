import { useState } from "react";
import { useBackups } from "../hooks";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { SkeletonServerCard } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { useClientApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/useToast";
import { useConfirm } from "@/hooks/useConfirm";
import { formatBytes, formatDateTime } from "@/lib/utils/format";
import { downloadUrlToDisk } from "@/lib/api/downloadFile";
import type { BackupAttributes } from "@/lib/types/pterodactyl";

interface BackupListProps {
  identifier: string;
  /** feature_limits.backups des Servers - 0 bedeutet "Backups deaktiviert". */
  backupLimit: number;
}

export function BackupList({ identifier, backupLimit }: BackupListProps) {
  const { backups, loading, error, refetch } = useBackups(identifier);
  const api = useClientApi();
  const toast = useToast();
  const confirm = useConfirm();
  const [creating, setCreating] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [backupName, setBackupName] = useState("");
  const [busyUuid, setBusyUuid] = useState<string | null>(null);
  const atLimit = backupLimit > 0 && backups.length >= backupLimit;

  async function handleCreate() {
    if (!api) return;
    setCreating(true);
    try {
      await api.createBackup(identifier, backupName.trim() || undefined);
      toast.success("Backup wird erstellt", "Der Vorgang läuft im Hintergrund.");
      setCreateModalOpen(false);
      setBackupName("");
      void refetch();
    } catch (err) {
      toast.error("Backup konnte nicht gestartet werden", err);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(backup: BackupAttributes) {
    if (!api) return;
    if (backup.is_locked) {
      toast.warning("Backup ist gesperrt", "Zum Löschen zuerst die Sperre aufheben.");
      return;
    }
    const confirmed = await confirm({
      title: `Backup "${backup.name}" löschen?`,
      description: "Diese Aktion kann nicht rückgängig gemacht werden.",
      confirmLabel: "Löschen",
      destructive: true,
    });
    if (!confirmed) return;
    setBusyUuid(backup.uuid);
    try {
      await api.deleteBackup(identifier, backup.uuid);
      toast.success("Backup gelöscht", backup.name);
      void refetch();
    } catch (err) {
      toast.error("Löschen fehlgeschlagen", err);
    } finally {
      setBusyUuid(null);
    }
  }

  async function handleToggleLock(backup: BackupAttributes) {
    if (!api) return;
    setBusyUuid(backup.uuid);
    try {
      await api.toggleBackupLock(identifier, backup.uuid);
      void refetch();
    } catch (err) {
      toast.error("Sperre konnte nicht geändert werden", err);
    } finally {
      setBusyUuid(null);
    }
  }

  async function handleDownload(backup: BackupAttributes) {
    if (!api) return;
    setBusyUuid(backup.uuid);
    try {
      const url = await api.getBackupDownloadUrl(identifier, backup.uuid);
      const saved = await downloadUrlToDisk(url, `${backup.name}.tar.gz`);
      if (saved) toast.success("Download abgeschlossen", backup.name);
    } catch (err) {
      toast.error("Download fehlgeschlagen", err);
    } finally {
      setBusyUuid(null);
    }
  }

  async function handleRestore(backup: BackupAttributes) {
    if (!api) return;
    const confirmed = await confirm({
      title: `Backup "${backup.name}" wiederherstellen?`,
      description:
        "Der Server wird dafür automatisch gestoppt und der aktuelle Dateistand mit dem Inhalt dieses Backups überschrieben. Nicht gesicherte Änderungen seit diesem Backup gehen verloren.",
      confirmLabel: "Wiederherstellen",
      destructive: true,
    });
    if (!confirmed) return;
    setBusyUuid(backup.uuid);
    try {
      await api.restoreBackup(identifier, backup.uuid);
      toast.success("Wiederherstellung gestartet", "Der Server wird gestoppt und das Backup eingespielt.");
    } catch (err) {
      toast.error("Wiederherstellung fehlgeschlagen", err);
    } finally {
      setBusyUuid(null);
    }
  }

  if (loading) {
    return (
      <div className="grid gap-3">
        <SkeletonServerCard />
        <SkeletonServerCard />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={refetch} />;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-base-400">
          {backups.length} von {backupLimit > 0 ? backupLimit : "∞"} Backups verwendet
        </p>
        <Button
          size="sm"
          variant="primary"
          onClick={() => setCreateModalOpen(true)}
          disabled={atLimit}
          title={atLimit ? "Backup-Limit erreicht" : undefined}
        >
          + Backup erstellen
        </Button>
      </div>
      {atLimit && (
        <p className="text-xs text-warning">
          Backup-Limit erreicht ({backupLimit}/{backupLimit}). Lösche ein bestehendes Backup, um Platz zu schaffen.
        </p>
      )}

      {backups.length === 0 ? (
        <EmptyState title="Keine Backups vorhanden" description="Erstelle dein erstes Backup dieses Servers." />
      ) : (
        <div className="flex flex-col gap-2">
          {backups.map((backup) => (
            <div
              key={backup.uuid}
              className="flex items-center justify-between rounded-lg border border-base-700 bg-base-850 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-base-100">{backup.name}</p>
                  {backup.is_locked && <Badge tone="neutral">Gesperrt</Badge>}
                  {!backup.completed_at ? (
                    <Badge tone="warning" dot>
                      Läuft…
                    </Badge>
                  ) : backup.is_successful ? (
                    <Badge tone="success" dot>
                      Fertig
                    </Badge>
                  ) : (
                    <Badge tone="danger" dot>
                      Fehlgeschlagen
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-base-400">
                  {formatDateTime(backup.created_at)} · {formatBytes(backup.bytes)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={!backup.completed_at || busyUuid === backup.uuid}
                  onClick={() => void handleDownload(backup)}
                >
                  Download
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={!backup.completed_at || !backup.is_successful || busyUuid === backup.uuid}
                  onClick={() => void handleRestore(backup)}
                >
                  Wiederherstellen
                </Button>
                <Button size="sm" variant="ghost" disabled={busyUuid === backup.uuid} onClick={() => void handleToggleLock(backup)}>
                  {backup.is_locked ? "Entsperren" : "Sperren"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-danger hover:text-danger"
                  disabled={busyUuid === backup.uuid || backup.is_locked}
                  onClick={() => void handleDelete(backup)}
                >
                  Löschen
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Neues Backup erstellen"
        description="Der Name ist optional - das Panel vergibt sonst automatisch einen."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateModalOpen(false)}>
              Abbrechen
            </Button>
            <Button variant="primary" onClick={() => void handleCreate()} loading={creating}>
              Erstellen
            </Button>
          </>
        }
      >
        <Input
          autoFocus
          value={backupName}
          onChange={(e) => setBackupName(e.target.value)}
          placeholder="z. B. vor-update-backup"
        />
      </Modal>
    </div>
  );
}
