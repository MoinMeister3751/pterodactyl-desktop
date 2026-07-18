import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { ApiError, statusToErrorKind } from "./errors";

/**
 * Lädt Bytes von einer (i. d. R. signierten, kurzlebigen) Pterodactyl-Download-URL
 * herunter und speichert sie über den nativen "Speichern unter"-Dialog auf der
 * Festplatte. Wird sowohl für Datei- als auch für Backup-Downloads verwendet.
 */
export async function downloadUrlToDisk(url: string, suggestedName: string): Promise<boolean> {
  let response: Response;
  try {
    response = await tauriFetch(url);
  } catch (error) {
    throw new ApiError(
      error instanceof Error ? `Download fehlgeschlagen: ${error.message}` : "Download fehlgeschlagen.",
      "network",
    );
  }
  if (!response.ok) {
    let detail = "";
    try {
      detail = await response.text();
    } catch {
      // Antwort konnte nicht gelesen werden - Statuscode reicht als Info.
    }
    throw new ApiError(
      `Download fehlgeschlagen (HTTP ${response.status})${detail ? `: ${detail}` : ""}`,
      statusToErrorKind(response.status),
      response.status,
    );
  }
  const bytes = new Uint8Array(await response.arrayBuffer());

  const destination = await save({ defaultPath: suggestedName });
  if (!destination) return false; // Nutzer hat den Dialog abgebrochen.

  try {
    await writeFile(destination, bytes);
  } catch (error) {
    throw new ApiError(
      error instanceof Error
        ? `Datei konnte nicht gespeichert werden: ${error.message}`
        : "Datei konnte nicht gespeichert werden.",
      "unknown",
    );
  }
  return true;
}
