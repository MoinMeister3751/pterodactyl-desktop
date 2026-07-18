/**
 * Globaler Schutz gegen Rate-Limit-Kaskaden: Sobald irgendeine Anfrage mit
 * HTTP 429 antwortet, pausieren ALLE Hintergrund-Poller (Dashboard-Serverliste,
 * Ressourcen-Polling, Server-Detail-Refresh) für ein paar Sekunden, statt im
 * Sekundentakt weiter gegen das Limit zu rennen und es immer wieder zu
 * verlängern. Bewusst ein einfacher Modul-Singleton statt Zustand-Store, da
 * das hier auch aus dem synchronen httpClient heraus (ohne React) gesetzt wird.
 */
const DEFAULT_BACKOFF_SECONDS = 20;

let backoffUntil = 0;

export function isRateLimited(): boolean {
  return Date.now() < backoffUntil;
}

export function getBackoffRemainingSeconds(): number {
  return Math.max(0, Math.ceil((backoffUntil - Date.now()) / 1000));
}

export function triggerRateLimitBackoff(retryAfterSeconds?: number): void {
  const seconds = retryAfterSeconds && retryAfterSeconds > 0 ? retryAfterSeconds : DEFAULT_BACKOFF_SECONDS;
  backoffUntil = Math.max(backoffUntil, Date.now() + seconds * 1000);
}
