import { useCallback, useEffect, useState } from "react";
import { useClientApi } from "@/hooks/useApi";
import { ApiError } from "@/lib/api/errors";
import type { FileObjectAttributes } from "@/lib/types/pterodactyl";

export function useFileList(identifier: string, directory: string) {
  const api = useClientApi();
  const [files, setFiles] = useState<FileObjectAttributes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!api) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.listFiles(identifier, directory);
      data.sort((a, b) => {
        if (a.is_file !== b.is_file) return a.is_file ? 1 : -1;
        return a.name.localeCompare(b.name);
      });
      setFiles(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.userMessage : "Dateien konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, [api, identifier, directory]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { files, loading, error, refetch };
}

const TEXT_EXTENSIONS = new Set([
  "txt", "log", "json", "yml", "yaml", "properties", "conf", "cfg", "ini", "toml",
  "env", "md", "xml", "sh", "bash", "js", "ts", "tsx", "jsx", "css", "html", "sql",
  "gitignore", "dockerfile", "lua", "py", "java", "gradle", "cnb",
]);

export function isTextFile(file: FileObjectAttributes): boolean {
  if (!file.is_file) return false;
  if (file.mimetype?.startsWith("text/")) return true;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return TEXT_EXTENSIONS.has(ext) || !file.name.includes(".");
}

export function joinPath(directory: string, name: string): string {
  const base = directory.endsWith("/") ? directory : `${directory}/`;
  return `${base}${name}`;
}

export function parentPath(directory: string): string {
  if (directory === "/" || directory === "") return "/";
  const trimmed = directory.replace(/\/+$/, "");
  const idx = trimmed.lastIndexOf("/");
  return idx <= 0 ? "/" : trimmed.slice(0, idx);
}
