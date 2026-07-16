import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { ApiError } from "./errors";

/**
 * Lädt Bytes von einer (i. d. R. signierten, kurzlebigen) Pterodactyl-Download-URL
 * herunter und speichert sie über den nativen "Speichern unter"-Dialog auf der
 * Festplatte. Wird sowohl für Datei- als auch für Backup-Downloads verwendet.
 */
export async function downloadUrlToDisk(url: string, suggestedName: string): Promise<boolean> {
  const response = await tauriFetch(url);
  if (!response.ok) {
    throw new ApiError(`Download fehlgeschlagen (HTTP ${response.status})`, "server_error", response.status);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());

  const destination = await save({ defaultPath: suggestedName });
  if (!destination) return false; // Nutzer hat den Dialog abgebrochen.

  await writeFile(destination, bytes);
  return true;
}
