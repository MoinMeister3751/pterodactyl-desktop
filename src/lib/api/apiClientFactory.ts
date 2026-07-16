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
 * das Profil vorher gespeichert werden muss ("Verbindung testen"-Button).
 */
export async function testConnection(
  profile: Pick<PanelProfile, "panelUrl" | "clientApiKey">,
): Promise<ConnectionTestResult> {
  const started = performance.now();
  try {
    const api = createClientApi(profile);
    await api.getAccount();
    return {
      ok: true,
      message: "Verbindung erfolgreich.",
      latencyMs: Math.round(performance.now() - started),
    };
  } catch (error) {
    const message = error instanceof ApiError ? error.userMessage : "Unbekannter Fehler bei der Verbindung.";
    return { ok: false, message };
  }
}
