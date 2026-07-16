import { useEffect, useState } from "react";
import { useStartup } from "../hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SkeletonServerCard } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { useClientApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/useToast";
import { isRiskyVariable } from "@/lib/utils/constants";

export function StartupPanel({ identifier }: { identifier: string }) {
  const { variables, meta, loading, error, refetch } = useStartup(identifier);
  const api = useClientApi();
  const toast = useToast();
  const [values, setValues] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [dockerImage, setDockerImage] = useState<string>("");
  const [savingImage, setSavingImage] = useState(false);

  useEffect(() => {
    setValues(Object.fromEntries(variables.map((v) => [v.env_variable, v.server_value])));
  }, [variables]);

  useEffect(() => {
    if (meta) setDockerImage(meta.docker_images ? Object.values(meta.docker_images)[0] ?? "" : "");
  }, [meta]);

  if (loading) return <SkeletonServerCard />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  async function handleSaveVariable(envVariable: string) {
    if (!api) return;
    setSavingKey(envVariable);
    try {
      await api.updateStartupVariable(identifier, envVariable, values[envVariable] ?? "");
      toast.success("Variable gespeichert", envVariable);
      void refetch();
    } catch (err) {
      toast.error("Speichern fehlgeschlagen", err);
    } finally {
      setSavingKey(null);
    }
  }

  async function handleSaveDockerImage() {
    if (!api || !dockerImage) return;
    setSavingImage(true);
    try {
      await api.updateDockerImage(identifier, dockerImage);
      toast.success("Docker-Image aktualisiert");
    } catch (err) {
      toast.error("Docker-Image konnte nicht geändert werden", err);
    } finally {
      setSavingImage(false);
    }
  }

  const dockerImageOptions = meta?.docker_images ? Object.entries(meta.docker_images) : [];

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Startbefehl</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-md bg-base-950 p-3 font-mono text-xs text-base-200">
            {meta?.startup_command ?? "—"}
          </pre>
        </CardContent>
      </Card>

      {dockerImageOptions.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Docker-Image</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Select value={dockerImage} onChange={(e) => setDockerImage(e.target.value)} className="max-w-md">
              {dockerImageOptions.map(([label, image]) => (
                <option key={image} value={image}>
                  {label} ({image})
                </option>
              ))}
            </Select>
            <Button size="sm" variant="primary" onClick={() => void handleSaveDockerImage()} loading={savingImage}>
              Übernehmen
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Umgebungsvariablen</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {variables.length === 0 && <p className="text-xs text-base-400">Keine Variablen definiert.</p>}
          {variables.map((variable) => {
            const risky = isRiskyVariable(variable.env_variable);
            const changed = values[variable.env_variable] !== variable.server_value;
            return (
              <div key={variable.env_variable} className="rounded-md border border-base-700 p-3">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-base-100">{variable.name}</p>
                  <code className="rounded bg-base-800 px-1.5 py-0.5 text-[11px] text-base-400">
                    {variable.env_variable}
                  </code>
                  {risky && (
                    <Badge tone="warning">Sensibel</Badge>
                  )}
                  {!variable.is_editable && <Badge tone="neutral">Nicht editierbar</Badge>}
                </div>
                {variable.description && (
                  <p className="mb-2 text-xs text-base-400">{variable.description}</p>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    type={risky ? "password" : "text"}
                    value={values[variable.env_variable] ?? ""}
                    disabled={!variable.is_editable}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [variable.env_variable]: e.target.value }))
                    }
                  />
                  {variable.is_editable && changed && (
                    <Button
                      size="sm"
                      variant="primary"
                      loading={savingKey === variable.env_variable}
                      onClick={() => void handleSaveVariable(variable.env_variable)}
                    >
                      Speichern
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
