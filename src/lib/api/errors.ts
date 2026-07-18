import { redactSecrets } from "@/lib/utils/validation";

export type ApiErrorKind =
  | "network"
  | "timeout"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "validation"
  | "rate_limited"
  | "server_error"
  | "unknown";

/**
 * Einheitlicher Fehlertyp für alle API-Aufrufe (Client + Application API).
 * UI-Code sollte ausschließlich gegen ApiError programmieren, nie gegen rohe
 * fetch-Fehler oder Pterodactyl-Fehlerobjekte.
 */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly code?: string;

  constructor(message: string, kind: ApiErrorKind, status?: number, code?: string) {
    super(redactSecrets(message));
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.code = code;
  }

  /** Kurzer, für Endnutzer verständlicher Text - hängt bei Bedarf die technische Detailmeldung an. */
  get userMessage(): string {
    const withDetail = (prefix: string) =>
      this.message && this.message !== prefix ? `${prefix} (${this.message})` : prefix;

    switch (this.kind) {
      case "network":
        return withDetail("Keine Verbindung zum Panel möglich. Bitte URL und Netzwerkverbindung prüfen.");
      case "timeout":
        return "Zeitüberschreitung bei der Anfrage an das Panel.";
      case "unauthorized":
        return "Anmeldung fehlgeschlagen. Bitte den API-Key im Profil prüfen.";
      case "forbidden":
        return withDetail("Keine Berechtigung für diese Aktion. Prüfe die API-Key-Berechtigungen.");
      case "not_found":
        return "Ressource wurde auf dem Panel nicht gefunden.";
      case "validation":
        return this.message || "Ungültige Eingabe.";
      case "rate_limited":
        return "Zu viele Anfragen. Bitte kurz warten und erneut versuchen.";
      case "server_error":
        return withDetail("Das Panel meldet einen internen Fehler.");
      default:
        return this.message || "Unbekannter Fehler.";
    }
  }
}

export function statusToErrorKind(status: number): ApiErrorKind {
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 422) return "validation";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "server_error";
  return "unknown";
}
