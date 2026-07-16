export interface ValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * Validiert die Panel-URL. Erzwingt http(s) und lehnt offensichtlich unsichere
 * oder unsinnige Eingaben ab, bevor überhaupt ein Request gebaut wird.
 */
export function validatePanelUrl(rawUrl: string): ValidationResult {
  const trimmed = rawUrl.trim();
  if (!trimmed) return { valid: false, message: "Panel-URL darf nicht leer sein." };

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { valid: false, message: "Ungültige URL. Beispiel: https://panel.example.com" };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { valid: false, message: "Nur http:// oder https:// werden unterstützt." };
  }
  if (url.protocol === "http:" && !isPrivateOrLocalHost(url.hostname)) {
    return {
      valid: false,
      message: "http:// wird nur für lokale/private Adressen erlaubt. Für öffentliche Panels bitte https:// verwenden.",
    };
  }
  if (!url.hostname) {
    return { valid: false, message: "URL enthält keinen gültigen Host." };
  }

  return { valid: true };
}

function isPrivateOrLocalHost(hostname: string): boolean {
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") return true;
  const privateRanges = [/^10\./, /^192\.168\./, /^172\.(1[6-9]|2\d|3[0-1])\./];
  return privateRanges.some((re) => re.test(hostname));
}

/** Normalisiert eine Panel-URL (trim + trailing slash entfernen). */
export function normalizePanelUrl(rawUrl: string): string {
  return rawUrl.trim().replace(/\/+$/, "");
}

export function validateApiKey(key: string, kind: "client" | "application"): ValidationResult {
  const trimmed = key.trim();
  if (!trimmed) {
    return { valid: false, message: "API-Key darf nicht leer sein." };
  }
  const expectedPrefix = kind === "client" ? "ptlc_" : "ptla_";
  if (!trimmed.startsWith(expectedPrefix)) {
    return {
      valid: false,
      message: `${kind === "client" ? "Client" : "Application"}-API-Keys beginnen üblicherweise mit "${expectedPrefix}". Bitte prüfen, ob der richtige Key-Typ verwendet wurde.`,
    };
  }
  if (trimmed.length < 20) {
    return { valid: false, message: "API-Key wirkt zu kurz, um gültig zu sein." };
  }
  return { valid: true };
}

export function validateProfileName(name: string): ValidationResult {
  const trimmed = name.trim();
  if (!trimmed) return { valid: false, message: "Profilname darf nicht leer sein." };
  if (trimmed.length > 60) return { valid: false, message: "Profilname ist zu lang (max. 60 Zeichen)." };
  return { valid: true };
}

/** Entfernt potenzielle Secrets aus Fehlertexten, bevor sie geloggt/angezeigt werden. */
export function redactSecrets(text: string): string {
  return text
    .replace(/ptlc_[A-Za-z0-9]+/g, "ptlc_***")
    .replace(/ptla_[A-Za-z0-9]+/g, "ptla_***")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer ***");
}
