import { PterodactylHttpClient } from "./httpClient";
import { ClientApi } from "./clientApi";
import { ApplicationApi } from "./applicationApi";
import { ApiError } from "./errors";
import { normalizePanelUrl } from "@/lib/utils/validation";
import type { PanelProfile, ConnectionTestResult } from "@/lib/types/profile";

export function createClientApi(profile: Pick<PanelProfile, "panelUrl" | "clientApiKey">): ClientApi {
  const http = new PterodactylHttpClient(normalizePanelUrl(profile.panelUrl), profile.clientApiKey);
  return new ClientApi(http);
}

export function createApplicationApi(
  profile: Pick<PanelProfile, "panelUrl" | "applicationApiKey">,
): ApplicationApi | null {
  if (!profile.applicationApiKey) return null;
  const http = new PterodactylHttpClient(
    normalizePanelUrl(profile.panelUrl),
    profile.applicationApiKey,
  );
  return new ApplicationApi(http);
}

/**
 * Prüft die Verbindung zu einem Panel mit den gegebenen Zugangsdaten, ohne dass
 * das Profil vorher gespeichert werden muss ("Verbindung testen"-Button). Testet
 * den Application-API-Key mit, sofern einer angegeben ist - vorher wurde dieser
 * Key beim Testen komplett ignoriert, wodurch ein falscher/unzureichend berechtigter
 * Key erst beim (stillen) Fehlschlag der Dashboard-Anreicherung auffiel.
 */
export async function testConnection(
  profile: Pick<PanelProfile, "panelUrl" | "clientApiKey" | "applicationApiKey">,
): Promise<ConnectionTestResult> {
  const started = performance.now();
  try {
    const api = createClientApi(profile);
    await api.getAccount();
    const result: ConnectionTestResult = {
      ok: true,
      message: "Verbindung erfolgreich.",
      latencyMs: Math.round(performance.now() - started),
    };
    if (profile.applicationApiKey?.trim()) {
      result.applicationApi = await testApplicationApi(profile);
    }
    return result;
  } catch (error) {
    const message = error instanceof ApiError ? error.userMessage : "Unbekannter Fehler bei der Verbindung.";
    return { ok: false, message };
  }
}

async function testApplicationApi(
  profile: Pick<PanelProfile, "panelUrl" | "applicationApiKey">,
): Promise<{ ok: boolean; message: string }> {
  try {
    const api = createApplicationApi(profile);
    if (!api) return { ok: false, message: "Kein Application-API-Key angegeben." };
    // Kleinstmöglicher Read-Request, um Key-Gültigkeit UND die für die
    // Node-/Location-Anreicherung nötigen Berechtigungen zu prüfen.
    await api.listLocations();
    return { ok: true, message: "Application-API-Key gültig und berechtigt." };
  } catch (error) {
    if (error instanceof ApiError && (error.kind === "unauthorized" || error.kind === "forbidden")) {
      return {
        ok: false,
        message:
          "Application-API-Key ungültig oder ohne Leserechte auf Nodes/Locations. Node-/Standort-Anzeige im Dashboard bleibt ohne gültigen Key deaktiviert.",
      };
    }
    const message = error instanceof ApiError ? error.userMessage : "Unbekannter Fehler beim Prüfen des Application-API-Keys.";
    return { ok: false, message };
  }
}
