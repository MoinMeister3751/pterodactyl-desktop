import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { ApiError } from "./errors";

/**
 * Lädt eine Datei zur zuvor über ClientApi.getUploadUrl() ermittelten,
 * signierten Upload-URL hoch. Pterodactyl erwartet hier multipart/form-data
 * mit dem Feldnamen "files".
 */
export async function uploadFileToSignedUrl(
  uploadUrl: string,
  directory: string,
  file: File,
  onProgress?: (loaded: number, total: number) => void,
): Promise<void> {
  const form = new FormData();
  form.append("files", file, file.name);

  const url = new URL(uploadUrl);
  if (directory) url.searchParams.set("directory", directory);

  // onProgress ist best-effort: das Tauri-HTTP-Plugin unterstützt keinen echten
  // Upload-Progress-Callback wie XHR. Wir melden hier nur Start/Ende, damit die
  // UI zumindest einen Ladezustand zeigen kann statt eines echten Fortschrittsbalkens.
  onProgress?.(0, file.size);
  const response = await tauriFetch(url.toString(), {
    method: "POST",
    body: form,
  });
  onProgress?.(file.size, file.size);

  if (!response.ok) {
    throw new ApiError(`Upload fehlgeschlagen (HTTP ${response.status})`, "server_error", response.status);
  }
}
