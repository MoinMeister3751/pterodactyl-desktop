import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useAdminNests, useAdminEggs, useAdminLocations } from "../hooks";
import { useApplicationApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/useToast";
import { ApiError } from "@/lib/api/errors";
import type { AdminUserAttributes } from "@/lib/types/application";

interface CreateServerModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  users: AdminUserAttributes[];
}

const DEFAULT_LIMITS = { memory: 1024, swap: 0, disk: 2048, io: 500, cpu: 100 };
const DEFAULT_FEATURE_LIMITS = { databases: 0, allocations: 1, backups: 1 };

export function CreateServerModal({ open, onClose, onCreated, users }: CreateServerModalProps) {
  const api = useApplicationApi();
  const toast = useToast();
  const { data: nests } = useAdminNests();
  const { data: locations } = useAdminLocations();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [ownerId, setOwnerId] = useState<number | null>(null);
  const [nestId, setNestId] = useState<number | null>(null);
  const { data: eggs } = useAdminEggs(nestId);
  const [eggId, setEggId] = useState<number | null>(null);
  const [dockerImage, setDockerImage] = useState("");
  const [startup, setStartup] = useState("");
  const [environment, setEnvironment] = useState<Record<string, string>>({});
  const [limits, setLimits] = useState(DEFAULT_LIMITS);
  const [featureLimits, setFeatureLimits] = useState(DEFAULT_FEATURE_LIMITS);
  const [locationId, setLocationId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedEgg = useMemo(() => eggs.find((e) => e.id === eggId) ?? null, [eggs, eggId]);

  // Sinnvolle Defaults setzen, sobald Nest-Liste geladen ist bzw. sich die Auswahl ändert.
  useEffect(() => {
    if (!open) return;
    if (nestId === null && nests.length > 0) setNestId(nests[0].id);
    if (ownerId === null && users.length > 0) setOwnerId(users[0].id);
    if (locationId === null && locations.length > 0) setLocationId(locations[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, nests, users, locations]);

  useEffect(() => {
    setEggId(eggs.length > 0 ? eggs[0].id : null);
  }, [eggs]);

  useEffect(() => {
    if (!selectedEgg) return;
    setDockerImage(Object.values(selectedEgg.docker_images ?? {})[0] ?? selectedEgg.docker_image ?? "");
    setStartup(selectedEgg.startup ?? "");
    const vars = selectedEgg.relationships?.variables?.data ?? [];
    setEnvironment(Object.fromEntries(vars.map((v) => [v.attributes.env_variable, v.attributes.default_value])));
  }, [selectedEgg]);

  function reset() {
    setName("");
    setDescription("");
    setError(null);
    setLimits(DEFAULT_LIMITS);
    setFeatureLimits(DEFAULT_FEATURE_LIMITS);
  }

  async function handleCreate() {
    if (!api || !ownerId || !eggId || !locationId) {
      setError("Bitte alle Pflichtfelder ausfüllen (Besitzer, Egg, Standort).");
      return;
    }
    if (!name.trim()) {
      setError("Servername darf nicht leer sein.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const server = await api.createServer({
        name: name.trim(),
        description: description.trim() || undefined,
        user: ownerId,
        egg: eggId,
        docker_image: dockerImage,
        startup,
        environment,
        limits,
        feature_limits: featureLimits,
        deploy: { locations: [locationId], dedicated_ip: false, port_range: [] },
        start_on_completion: true,
      });
      toast.success("Server wird erstellt", server.name);
      reset();
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.userMessage : "Server konnte nicht erstellt werden.");
    } finally {
      setSaving(false);
    }
  }

  const eggVariables = selectedEgg?.relationships?.variables?.data ?? [];

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Server hinzufügen"
      description="Erstellt einen neuen Server via Application API. Die Allokation wird automatisch aus dem gewählten Standort vergeben (Wings sucht einen freien Port)."
      size="xl"
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
      <div className="flex max-h-[65vh] flex-col gap-4 overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Servername">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Besitzer">
            <Select value={ownerId ?? ""} onChange={(e) => setOwnerId(Number(e.target.value))}>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.username} ({u.email})
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Beschreibung (optional)">
          <Input value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Nest">
            <Select value={nestId ?? ""} onChange={(e) => setNestId(Number(e.target.value))}>
              {nests.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Egg">
            <Select value={eggId ?? ""} onChange={(e) => setEggId(Number(e.target.value))}>
              {eggs.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Standort (Deploy)">
            <Select value={locationId ?? ""} onChange={(e) => setLocationId(Number(e.target.value))}>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.short}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {selectedEgg && Object.keys(selectedEgg.docker_images ?? {}).length > 1 && (
          <Field label="Docker-Image">
            <Select value={dockerImage} onChange={(e) => setDockerImage(e.target.value)}>
              {Object.entries(selectedEgg.docker_images).map(([label, image]) => (
                <option key={image} value={image}>
                  {label} ({image})
                </option>
              ))}
            </Select>
          </Field>
        )}

        <Field label="Startbefehl">
          <Textarea value={startup} onChange={(e) => setStartup(e.target.value)} className="h-16" />
        </Field>

        <div className="grid grid-cols-5 gap-3">
          <Field label="RAM (MB)">
            <Input type="number" value={limits.memory} onChange={(e) => setLimits((p) => ({ ...p, memory: Number(e.target.value) }))} />
          </Field>
          <Field label="Swap (MB)">
            <Input type="number" value={limits.swap} onChange={(e) => setLimits((p) => ({ ...p, swap: Number(e.target.value) }))} />
          </Field>
          <Field label="Disk (MB)">
            <Input type="number" value={limits.disk} onChange={(e) => setLimits((p) => ({ ...p, disk: Number(e.target.value) }))} />
          </Field>
          <Field label="CPU (%)">
            <Input type="number" value={limits.cpu} onChange={(e) => setLimits((p) => ({ ...p, cpu: Number(e.target.value) }))} />
          </Field>
          <Field label="IO">
            <Input type="number" value={limits.io} onChange={(e) => setLimits((p) => ({ ...p, io: Number(e.target.value) }))} />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Datenbanken">
            <Input
              type="number"
              value={featureLimits.databases}
              onChange={(e) => setFeatureLimits((p) => ({ ...p, databases: Number(e.target.value) }))}
            />
          </Field>
          <Field label="Allokationen">
            <Input
              type="number"
              value={featureLimits.allocations}
              onChange={(e) => setFeatureLimits((p) => ({ ...p, allocations: Number(e.target.value) }))}
            />
          </Field>
          <Field label="Backups">
            <Input
              type="number"
              value={featureLimits.backups}
              onChange={(e) => setFeatureLimits((p) => ({ ...p, backups: Number(e.target.value) }))}
            />
          </Field>
        </div>

        {eggVariables.length > 0 && (
          <div className="flex flex-col gap-2 rounded-md border border-base-700 p-3">
            <p className="text-xs font-medium text-base-300">Umgebungsvariablen ({selectedEgg?.name})</p>
            {eggVariables.map((v) => (
              <Field key={v.attributes.env_variable} label={`${v.attributes.name} (${v.attributes.env_variable})`}>
                <Input
                  value={environment[v.attributes.env_variable] ?? ""}
                  onChange={(e) =>
                    setEnvironment((prev) => ({ ...prev, [v.attributes.env_variable]: e.target.value }))
                  }
                />
              </Field>
            ))}
          </div>
        )}

        {error && <p className="text-xs text-danger">{error}</p>}
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
