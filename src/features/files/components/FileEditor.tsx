import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Textarea } from "@/components/ui/Textarea";
import { useClientApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/useToast";
import { ApiError } from "@/lib/api/errors";

interface FileEditorProps {
  identifier: string;
  filePath: string | null;
  onClose: () => void;
}

export function FileEditor({ identifier, filePath, onClose }: FileEditorProps) {
  const api = useClientApi();
  const toast = useToast();
  const [content, setContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDirty = content !== originalContent;
  const fileName = filePath?.split("/").pop() ?? "";

  useEffect(() => {
    if (!filePath || !api) return;
    setLoading(true);
    setError(null);
    api
      .getFileContents(identifier, filePath)
      .then((text) => {
        setContent(text);
        setOriginalContent(text);
      })
      .catch((err) => setError(err instanceof ApiError ? err.userMessage : "Datei konnte nicht geladen werden."))
      .finally(() => setLoading(false));
  }, [api, identifier, filePath]);

  async function handleSave() {
    if (!api || !filePath) return;
    setSaving(true);
    try {
      await api.writeFile(identifier, filePath, content);
      setOriginalContent(content);
      toast.success("Datei gespeichert", fileName);
    } catch (err) {
      toast.error("Speichern fehlgeschlagen", err);
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    if (isDirty && !window.confirm("Ungespeicherte Änderungen verwerfen?")) return;
    onClose();
  }

  return (
    <Modal
      open={!!filePath}
      onClose={handleClose}
      title={fileName}
      description={filePath ?? undefined}
      size="xl"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>
            Schließen
          </Button>
          <Button variant="primary" onClick={handleSave} loading={saving} disabled={!isDirty || loading}>
            Speichern
          </Button>
        </>
      }
    >
      {loading ? (
        <div className="flex h-96 items-center justify-center">
          <Spinner className="h-6 w-6" />
        </div>
      ) : error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : (
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="h-96"
        />
      )}
    </Modal>
  );
}
