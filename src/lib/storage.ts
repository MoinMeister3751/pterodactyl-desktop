import { Store } from "@tauri-apps/plugin-store";

/**
 * Lazy-geladene, gecachte tauri-plugin-store-Instanzen pro Dateiname.
 * Die Dateien liegen im App-Datenverzeichnis des Nutzers (z. B.
 * %APPDATA%\com.jeremy.pterodactyl-desktop\), NICHT im Projektordner.
 *
 * Sicherheitshinweis (siehe README "Sicherheit"): Diese Speicherung ist
 * NICHT verschlüsselt. Sie ist durch die Dateisystemrechte des Windows-
 * Benutzerkontos geschützt, aber kein Ersatz für einen echten Secret-Store
 * (z. B. Windows Credential Manager). Für den vorliegenden Desktop-Kontext
 * ist das ein bewusster, dokumentierter Kompromiss zwischen Aufwand und
 * Sicherheit - siehe README für Hinweise auf Härtungsoptionen.
 */
const storeCache = new Map<string, Promise<Store>>();

export function getStore(fileName: string): Promise<Store> {
  let cached = storeCache.get(fileName);
  if (!cached) {
    cached = Store.load(fileName);
    storeCache.set(fileName, cached);
  }
  return cached;
}
