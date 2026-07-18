import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useAdminNests, useAdminEggs, useAdminNodes, useAdminNodeAllocations } from "../hooks";
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
  const { data: nodes } = useAdminNodes();

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
  const [nodeId, setNodeId] = useState<number | null>(null);
  const { data: allocations, refetch: refetchAllocations } = useAdminNodeAllocations(nodeId);
  const [allocationId, setAllocationId] = useState<number | null>(null);
  const [newAllocIp, setNewAllocIp] = useState("");
  const [newAllocPort, setNewAllocPort] = useState("");
  const [creatingAllocation, setCreatingAllocation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedEgg = useMemo(() => eggs.find((e) => e.id === eggId) ?? null, [eggs, eggId]);
  const freeAllocations = useMemo(() => allocations.filter((a) => !a.assigned), [allocations]);
  const selectedNode = useMemo(() => nodes.find((n) => n.id === nodeId) ?? null, [nodes, nodeId]);

  // Sinnvolle Defaults setzen, sobald Nest-/Node-/Nutzerliste geladen ist.
  useEffect(() => {
    if (!open) return;
    if (nestId === null && nests.length > 0) setNestId(nests[0].id);
    if (ownerId === null && users.length > 0) setOwnerId(users[0].id);
    if (nodeId === null && nodes.length > 0) setNodeId(nodes[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, nests, users, nodes]);

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

  // Sobald sich die freien Allokationen des gewählten Nodes ändern (Node-Wechsel
  // oder gerade neu angelegt), automatisch die erste freie vorauswählen.
  useEffect(() => {
    setAllocationId(freeAllocations[0]?.id ?? null);
    setNewAllocIp((prev) => prev || selectedNode?.fqdn || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freeAllocations, nodeId]);

  function reset() {
    setName("");
    setDescription("");
    setError(null);
    setLimits(DEFAULT_LIMITS);
    setFeatureLimits(DEFAULT_FEATURE_LIMITS);
    setNewAllocPort("");
  }

  async function handleCreateAllocation() {
    if (!api || !nodeId || !newAllocIp.trim() || !newAllocPort.trim()) {
      toast.error("Allokation konnte nicht erstellt werden", "Bitte IP und Port angeben.");
      return;
    }
    setCreatingAllocation(true);
    try {
      await api.createNodeAllocations(nodeId, newAllocIp.trim(), [newAllocPort.trim()]);
      toast.success("Allokation angelegt", `${newAllocIp.trim()}:${newAllocPort.trim()}`);
      setNewAllocPort("");
      await refetchAllocations();
    } catch (err) {
      const message = err instanceof ApiError ? err.userMessage : "Allokation konnte nicht erstellt werden.";
      toast.error("Allokation konnte nicht erstellt werden", message);
    } finally {
      setCreatingAllocation(false);
    }
  }

  async function handleCreate() {
    if (!api || !ownerId || !eggId || !nodeId) {
      const msg = "Bitte alle Pflichtfelder ausfüllen (Besitzer, Egg, Node).";
      setError(msg);
      toast.error("Server konnte nicht erstellt werden", msg);
      return;
    }
    if (!allocationId) {
      const msg = "Keine freie Allokation gewählt. Lege oben eine neue Allokation auf dem Node an.";
      setError(msg);
      toast.error("Server konnte nicht erstellt werden", msg);
      return;
    }
    if (!name.trim()) {
      const msg = "Servername darf nicht leer sein.";
      setError(msg);
      toast.error("Server konnte nicht erstellt werden", msg);
      return;
    }
    if (!dockerImage.trim()) {
      const msg = "Kein Docker-Image verfügbar - das gewählte Egg definiert kein gültiges Image.";
      setError(msg);
      toast.error("Server konnte nicht erstellt werden", msg);
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
        docker_image: dockerImage.trim(),
        startup,
        environment,
        limits,
        feature_limits: featureLimits,
        allocation: { default: allocationId },
        start_on_completion: true,
      });
      toast.success("Server wird erstellt", server.name);
      reset();
      onCreated();
      onClose();
    } catch (err) {
      // Fehlertext bewusst per Toast UND inline zeigen: der inline-Text sitzt im
      // scrollbaren Formularbereich und wurde bei langen Egg-Variablenlisten leicht
      // übersehen - wirkte dann so, als würde beim Klick auf "Erstellen" nichts passieren.
      const message = err instanceof ApiError ? err.userMessage : "Server konnte nicht erstellt werden.";
      setError(message);
      toast.error("Server konnte nicht erstellt werden", message);
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
      description="Erstellt einen neuen Server via Application API auf einer konkreten Node-Allokation (statt unzuverlässigem Auto-Deploy)."
      size="xl"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          {error ? <p className="text-xs text-danger">{error}</p> : <span />}
          <div className="flex shrink-0 gap-2">
            <Button variant="ghost" onClick={onClose}>
              Abbrechen
            </Button>
            <Button variant="primary" onClick={() => void handleCreate()} loading={saving}>
              Erstellen
            </Button>
          </div>
        </div>
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

        <div className="grid grid-cols-2 gap-3">
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
        </div>

        <div className="rounded-md border border-base-700 p-3">
          <p className="mb-2 text-xs font-medium text-base-300">Node &amp; Allokation</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Node">
              <Select value={nodeId ?? ""} onChange={(e) => setNodeId(Number(e.target.value))}>
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={`Freie Allokation (${freeAllocations.length} verfügbar)`}>
              <Select
                value={allocationId ?? ""}
                onChange={(e) => setAllocationId(Number(e.target.value))}
                disabled={freeAllocations.length === 0}
              >
                {freeAllocations.length === 0 && <option value="">Keine frei - unten anlegen</option>}
                {freeAllocations.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.ip_alias ?? a.ip}:{a.port}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="mt-3 flex items-end gap-2 border-t border-base-700 pt-3">
            <Field label="Neue Allokation: IP">
              <Input value={newAllocIp} onChange={(e) => setNewAllocIp(e.target.value)} className="w-40" />
            </Field>
            <Field label="Port">
              <Input
                value={newAllocPort}
                onChange={(e) => setNewAllocPort(e.target.value)}
                placeholder="z. B. 25566"
                className="w-28"
              />
            </Field>
            <Button size="sm" variant="outline" loading={creatingAllocation} onClick={() => void handleCreateAllocation()}>
              Anlegen
            </Button>
          </div>
          <p className="mt-1 text-[11px] text-base-500">
            IP, an die Wings auf diesem Node gebunden ist (häufig die öffentliche Node-IP oder 0.0.0.0).
          </p>
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
