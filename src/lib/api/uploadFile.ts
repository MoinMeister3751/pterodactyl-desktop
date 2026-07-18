import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { ApiError, statusToErrorKind } from "./errors";

/**
 * Baut den multipart/form-data-Body manuell zusammen, statt sich auf die
 * FormData-Serialisierung des Tauri-HTTP-Plugins zu verlassen (dessen
 * Handling von FormData+File-Objekten über die Rust-Bridge unzuverlässig
 * war und Uploads lautlos fehlschlagen ließ, ohne dass die Datei ankam).
 */
async function buildMultipartBody(
  fieldName: string,
  file: File,
): Promise<{ body: Uint8Array; contentType: string }> {
  const boundary = `PterodactylDesktop${crypto.randomUUID().replace(/-/g, "")}`;
  const encoder = new TextEncoder();
  const fileBytes = new Uint8Array(await file.arrayBuffer());

  const head = encoder.encode(
    `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="${fieldName}"; filename="${file.name}"\r\n` +
      `Content-Type: ${file.type || "application/octet-stream"}\r\n\r\n`,
  );
  const tail = encoder.encode(`\r\n--${boundary}--\r\n`);

  const body = new Uint8Array(head.length + fileBytes.length + tail.length);
  body.set(head, 0);
  body.set(fileBytes, head.length);
  body.set(tail, head.length + fileBytes.length);

  return { body, contentType: `multipart/form-data; boundary=${boundary}` };
}

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
  const url = new URL(uploadUrl);
  if (directory) url.searchParams.set("directory", directory);

  // onProgress ist best-effort: das Tauri-HTTP-Plugin unterstützt keinen echten
  // Upload-Progress-Callback wie XHR. Wir melden hier nur Start/Ende, damit die
  // UI zumindest einen Ladezustand zeigen kann statt eines echten Fortschrittsbalkens.
  onProgress?.(0, file.size);
  const { body, contentType } = await buildMultipartBody("files", file);

  let response: Response;
  try {
    response = await tauriFetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": contentType },
      body: body as BodyInit,
    });
  } catch (error) {
    throw new ApiError(
      error instanceof Error ? `Upload fehlgeschlagen: ${error.message}` : "Upload fehlgeschlagen.",
      "network",
    );
  }
  onProgress?.(file.size, file.size);

  if (!response.ok) {
    let detail = "";
    try {
      detail = await response.text();
    } catch {
      // Antwort konnte nicht gelesen werden - Statuscode reicht als Info.
    }
    throw new ApiError(
      `Upload fehlgeschlagen (HTTP ${response.status})${detail ? `: ${detail}` : ""}`,
      statusToErrorKind(response.status),
      response.status,
    );
  }
}
