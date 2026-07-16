/**
 * Ein "Profil" ist eine gespeicherte Verbindung zu einem Pterodactyl-Panel.
 * Die App unterstützt mehrere Profile, um mehrere Panels/Accounts zu verwalten.
 */
export interface PanelProfile {
  id: string;
  /** Frei wählbarer Anzeigename, z. B. "Mein Netz" oder "Kunde XY". */
  name: string;
  /** Basis-URL des Panels ohne trailing slash, z. B. https://panel.example.com */
  panelUrl: string;
  /** Client-API-Key (Account -> API Credentials), beginnt mit "ptlc_". */
  clientApiKey: string;
  /**
   * Optionaler Application-API-Key (Admin -> Application API), beginnt mit "ptla_".
   * Nur nötig für Node-/Location-/User-Verwaltung (Admin-Funktionen).
   */
  applicationApiKey?: string;
  createdAt: string;
  lastUsedAt?: string;
}

export type PanelProfileDraft = Omit<PanelProfile, "id" | "createdAt" | "lastUsedAt">;

export interface ConnectionTestResult {
  ok: boolean;
  message: string;
  /** Nur gesetzt, wenn ok=true und die Panel-Version ermittelt werden konnte. */
  panelVersion?: string;
  latencyMs?: number;
  /** Nur gesetzt, wenn beim Test ein Application-API-Key angegeben war. */
  applicationApi?: {
    ok: boolean;
    message: string;
  };
}
