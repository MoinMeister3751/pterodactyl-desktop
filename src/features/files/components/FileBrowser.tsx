import { useRef, useState } from "react";
import { useFileList, isTextFile, joinPath, parentPath } from "../hooks";
import { FileEditor } from "./FileEditor";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SkeletonServerCard } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { useClientApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/useToast";
import { useConfirm } from "@/hooks/useConfirm";
import { formatBytes, formatDateTime } from "@/lib/utils/format";
import { downloadUrlToDisk } from "@/lib/api/downloadFile";
import { uploadFileToSignedUrl } from "@/lib/api/uploadFile";
import type { FileObjectAttributes } from "@/lib/types/pterodactyl";

interface FileBrowserProps {
  identifier: string;
}

export function FileBrowser({ identifier }: FileBrowserProps) {
  const api = useClientApi();
  const toast = useToast();
  const confirm = useConfirm();
  const [directory, setDirectory] = useState("/");
  const { files, loading, error, refetch } = useFileList(identifier, directory);
  const [openFile, setOpenFile] = useState<string | null>(null);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renaming, setRenaming] = useState<FileObjectAttributes | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const breadcrumbs = getBreadcrumbs(directory);

  function openEntry(file: FileObjectAttributes) {
    const path = joinPath(directory, file.name);
    if (file.is_file) {
      if (isTextFile(file)) {
        setOpenFile(path);
      } else {
        toast.info("Vorschau nicht verfügbar", "Diese Datei kann nicht im internen Editor geöffnet werden.");
      }
    } else {
      setDirectory(path);
    }
  }

  async function handleCreateFolder() {
    if (!api || !newFolderName.trim()) return;
    try {
      await api.createFolder(identifier, directory, newFolderName.trim());
      toast.success("Ordner erstellt", newFolderName.trim());
      setNewFolderOpen(false);
      setNewFolderName("");
      void refetch();
    } catch (err) {
      toast.error("Ordner konnte nicht erstellt werden", err);
    }
  }

  async function handleRename() {
    if (!api || !renaming || !renameValue.trim()) return;
    try {
      await api.renameFile(identifier, directory, renaming.name, renameValue.trim());
      toast.success("Umbenannt", `${renaming.name} → ${renameValue.trim()}`);
      setRenaming(null);
      void refetch();
    } catch (err) {
      toast.error("Umbenennen fehlgeschlagen", err);
    }
  }

  async function handleDelete(file: FileObjectAttributes) {
    if (!api) return;
    const confirmed = await confirm({
      title: `"${file.name}" löschen?`,
      description: file.is_file
        ? "Diese Datei wird endgültig gelöscht."
        : "Dieser Ordner und sein gesamter Inhalt werden endgültig gelöscht.",
      confirmLabel: "Löschen",
      destructive: true,
    });
    if (!confirmed) return;
    try {
      await api.deleteFiles(identifier, directory, [file.name]);
      toast.success("Gelöscht", file.name);
      void refetch();
    } catch (err) {
      toast.error("Löschen fehlgeschlagen", err);
    }
  }

  async function handleDownload(file: FileObjectAttributes) {
    if (!api) return;
    try {
      const path = joinPath(directory, file.name);
      const url = await api.getDownloadUrl(identifier, path);
      const saved = await downloadUrlToDisk(url, file.name);
      if (saved) toast.success("Download abgeschlossen", file.name);
    } catch (err) {
      toast.error("Download fehlgeschlagen", err);
    }
  }

  async function handleUploadFiles(fileList: FileList | null) {
    if (!api || !fileList || fileList.length === 0) return;
    setUploading(true);
    try {
      const uploadUrl = await api.getUploadUrl(identifier);
      for (const file of Array.from(fileList)) {
        await uploadFileToSignedUrl(uploadUrl, directory, file);
      }
      toast.success("Upload abgeschlossen", `${fileList.length} Datei(en) hochgeladen.`);
      void refetch();
    } catch (err) {
      toast.error("Upload fehlgeschlagen", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1 overflow-x-auto text-xs">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.path} className="flex items-center gap-1">
              {i > 0 && <span className="text-base-500">/</span>}
              <button
                onClick={() => setDirectory(crumb.path)}
                className="rounded px-1.5 py-0.5 text-base-300 hover:bg-base-800 hover:text-base-100"
              >
                {crumb.label}
              </button>
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {directory !== "/" && (
            <Button size="sm" variant="ghost" onClick={() => setDirectory(parentPath(directory))}>
              ↑ Übergeordnet
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => setNewFolderOpen(true)}>
            + Ordner
          </Button>
          <Button size="sm" variant="outline" loading={uploading} onClick={() => fileInputRef.current?.click()}>
            Hochladen
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => void handleUploadFiles(e.target.files)}
          />
          <Button size="sm" variant="ghost" onClick={() => void refetch()}>
            Aktualisieren
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto rounded-lg border border-base-700">
        {loading ? (
          <div className="space-y-2 p-3">
            <SkeletonServerCard />
          </div>
        ) : error ? (
          <div className="p-4">
            <ErrorState message={error} onRetry={refetch} />
          </div>
        ) : files.length === 0 ? (
          <div className="p-4">
            <EmptyState title="Ordner ist leer" description="Hier befinden sich keine Dateien oder Unterordner." />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-base-900 text-xs text-base-400">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Name</th>
                <th className="px-3 py-2 text-right font-medium">Größe</th>
                <th className="px-3 py-2 text-right font-medium">Geändert</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file.name} className="border-t border-base-800 hover:bg-base-900/60">
                  <td className="px-3 py-2">
                    <button
                      onClick={() => openEntry(file)}
                      className="flex items-center gap-2 text-left text-base-100 hover:text-accent-400"
                    >
                      {file.is_file ? <FileIcon /> : <FolderIcon />}
                      <span className="truncate">{file.name}</span>
                    </button>
                  </td>
                  <td className="px-3 py-2 text-right text-xs text-base-400">
                    {file.is_file ? formatBytes(file.size) : "—"}
                  </td>
                  <td className="px-3 py-2 text-right text-xs text-base-400">{formatDateTime(file.modified_at)}</td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      {file.is_file && (
                        <Button size="sm" variant="ghost" onClick={() => void handleDownload(file)}>
                          ↓
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setRenaming(file);
                          setRenameValue(file.name);
                        }}
                      >
                        ✎
                      </Button>
                      <Button size="sm" variant="ghost" className="text-danger hover:text-danger" onClick={() => void handleDelete(file)}>
                        ✕
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <FileEditor identifier={identifier} filePath={openFile} onClose={() => setOpenFile(null)} />

      <Modal
        open={newFolderOpen}
        onClose={() => setNewFolderOpen(false)}
        title="Neuer Ordner"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setNewFolderOpen(false)}>
              Abbrechen
            </Button>
            <Button variant="primary" onClick={() => void handleCreateFolder()}>
              Erstellen
            </Button>
          </>
        }
      >
        <Input
          autoFocus
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          placeholder="Ordnername"
          onKeyDown={(e) => e.key === "Enter" && void handleCreateFolder()}
        />
      </Modal>

      <Modal
        open={!!renaming}
        onClose={() => setRenaming(null)}
        title={`"${renaming?.name}" umbenennen`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRenaming(null)}>
              Abbrechen
            </Button>
            <Button variant="primary" onClick={() => void handleRename()}>
              Umbenennen
            </Button>
          </>
        }
      >
        <Input
          autoFocus
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void handleRename()}
        />
      </Modal>
    </div>
  );
}

function getBreadcrumbs(directory: string): Array<{ label: string; path: string }> {
  const segments = directory.split("/").filter(Boolean);
  const crumbs = [{ label: "root", path: "/" }];
  let current = "";
  for (const segment of segments) {
    current += `/${segment}`;
    crumbs.push({ label: segment, path: current });
  }
  return crumbs;
}

function FileIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-base-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 3v5h5" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-accent-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
  );
}
