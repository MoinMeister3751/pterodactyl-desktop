import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SkeletonServerCard } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { useClientApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/useToast";
import { useConfirm } from "@/hooks/useConfirm";
import { ApiError } from "@/lib/api/errors";
import type { DatabaseAttributes } from "@/lib/types/pterodactyl";

interface DatabasesPanelProps {
  identifier: string;
  databaseLimit: number;
}

export function DatabasesPanel({ identifier, databaseLimit }: DatabasesPanelProps) {
  const api = useClientApi();
  const toast = useToast();
  const confirm = useConfirm();
  const [databases, setDatabases] = useState<DatabaseAttributes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const atLimit = databaseLimit > 0 && databases.length >= databaseLimit;

  async function load() {
    if (!api) return;
    setError(null);
    try {
      setDatabases(await api.listDatabases(identifier));
    } catch (err) {
      setError(err instanceof ApiError ? err.userMessage : "Datenbanken konnten nicht geladen werden.");
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
    if (!api || !newName.trim()) return;
    setCreating(true);
    try {
      await api.createDatabase(identifier, newName.trim());
      toast.success("Datenbank erstellt", newName.trim());
      setCreateOpen(false);
      setNewName("");
      void load();
    } catch (err) {
      toast.error("Datenbank konnte nicht erstellt werden", err);
    } finally {
      setCreating(false);
    }
  }

  async function handleRotate(db: DatabaseAttributes) {
    if (!api) return;
    setBusyId(db.id);
    try {
      await api.rotateDatabasePassword(identifier, db.id);
      toast.success("Passwort erneuert", db.name);
      void load();
    } catch (err) {
      toast.error("Passwort konnte nicht erneuert werden", err);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(db: DatabaseAttributes) {
    if (!api) return;
    const confirmed = await confirm({
      title: `Datenbank "${db.name}" löschen?`,
      description: "Alle Daten in dieser Datenbank gehen unwiderruflich verloren.",
      confirmLabel: "Löschen",
      destructive: true,
    });
    if (!confirmed) return;
    setBusyId(db.id);
    try {
      await api.deleteDatabase(identifier, db.id);
      toast.success("Datenbank gelöscht", db.name);
      void load();
    } catch (err) {
      toast.error("Löschen fehlgeschlagen", err);
    } finally {
      setBusyId(null);
    }
  }

  async function handleCopy(value: string, label: string) {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} kopiert`);
  }

  if (loading) return <SkeletonServerCard />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-base-400">
          {databases.length} von {databaseLimit > 0 ? databaseLimit : "∞"} Datenbanken verwendet
        </p>
        <Button size="sm" variant="primary" onClick={() => setCreateOpen(true)} disabled={atLimit}>
          + Datenbank erstellen
        </Button>
      </div>

      {databases.length === 0 ? (
        <EmptyState title="Keine Datenbanken" description="Für diesen Server wurden noch keine Datenbanken angelegt." />
      ) : (
        <div className="flex flex-col gap-2">
          {databases.map((db) => {
            const password = db.relationships?.password?.attributes.password;
            const connectionString = `${db.username}:${db.host.address}:${db.host.port}`;
            return (
              <div key={db.id} className="rounded-lg border border-base-700 bg-base-850 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-base-100">{db.name}</p>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" loading={busyId === db.id} onClick={() => void handleRotate(db)}>
                      Passwort erneuern
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-danger hover:text-danger"
                      loading={busyId === db.id}
                      onClick={() => void handleDelete(db)}
                    >
                      Löschen
                    </Button>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-1.5 font-mono text-xs sm:grid-cols-2">
                  <button
                    onClick={() => void handleCopy(`${db.host.address}:${db.host.port}`, "Host")}
                    className="truncate rounded px-1.5 py-1 text-left text-base-300 hover:bg-base-800 hover:text-accent-300"
                  >
                    Host: {db.host.address}:{db.host.port}
                  </button>
                  <button
                    onClick={() => void handleCopy(db.username, "Benutzername")}
                    className="truncate rounded px-1.5 py-1 text-left text-base-300 hover:bg-base-800 hover:text-accent-300"
                  >
                    User: {db.username}
                  </button>
                  <button
                    onClick={() =>
                      setVisiblePasswords((prev) => ({ ...prev, [db.id]: !prev[db.id] }))
                    }
                    className="truncate rounded px-1.5 py-1 text-left text-base-300 hover:bg-base-800 hover:text-accent-300"
                  >
                    Passwort: {password ? (visiblePasswords[db.id] ? password : "••••••••••••") : "—"}
                  </button>
                  <button
                    onClick={() => void handleCopy(connectionString, "Verbindungsdaten")}
                    className="truncate rounded px-1.5 py-1 text-left text-base-300 hover:bg-base-800 hover:text-accent-300"
                  >
                    Zugriff erlaubt von: {db.connections_from}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Neue Datenbank"
        description="Der tatsächliche Name wird vom Panel mit einem Präfix versehen."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Abbrechen
            </Button>
            <Button variant="primary" onClick={() => void handleCreate()} loading={creating}>
              Erstellen
            </Button>
          </>
        }
      >
        <Input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="z. B. spieler-daten" />
      </Modal>
    </div>
  );
}
