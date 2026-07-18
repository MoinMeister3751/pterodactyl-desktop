export const APP_NAME = "Pterodactyl Desktop";

export const DEFAULT_REFRESH_INTERVAL_SECONDS = Number(
  import.meta.env.VITE_DEFAULT_REFRESH_INTERVAL ?? 1,
);

export const REFRESH_INTERVAL_OPTIONS_SECONDS = [1, 2, 5, 10, 15, 30, 60] as const;

export const ENABLE_APPLICATION_API_DEFAULT =
  (import.meta.env.VITE_ENABLE_APPLICATION_API ?? "true") === "true";

/** Egg-/Umgebungsvariablen, deren Namen typischerweise auf Risiko hindeuten. */
export const RISKY_VARIABLE_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /key$/i,
  /^admin/i,
  /uuid/i,
];

export function isRiskyVariable(envVariable: string): boolean {
  return RISKY_VARIABLE_PATTERNS.some((re) => re.test(envVariable));
}

export const STORE_FILE_NAME = "profiles.json";
export const SETTINGS_STORE_FILE_NAME = "settings.json";
