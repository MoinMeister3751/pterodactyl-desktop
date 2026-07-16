# Pterodactyl Desktop

Ein nativer Windows-Desktop-Client für [Pterodactyl](https://pterodactyl.io/), gebaut mit
**Tauri 2 + React + TypeScript + TailwindCSS**. Fokus: echte Server-Administration
(Power-Steuerung, Live-Konsole, Dateiverwaltung, Backups, Startup-Variablen, Netzwerk,
Aktivitätsprotokoll) statt einer Demo-Oberfläche.

![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)
![Rust](https://img.shields.io/badge/rust-stable-orange)
![Platform](https://img.shields.io/badge/platform-Windows-blue)

---

## Architekturentscheidung: Tauri statt Electron

**Tauri wurde gewählt und war umsetzbar** (kein Fallback auf Electron nötig):

- **Bundle-Größe & Ressourcen**: Tauri nutzt das systemeigene WebView2 statt einer
  gebündelten Chromium-Instanz - deutlich kleinere Installer (~5-15 MB statt ~150 MB+)
  und geringerer RAM-Verbrauch, was für einen Admin-Tool-Dauerläufer relevant ist.
- **Sicherheitsmodell**: Tauris capability-/permission-System (`src-tauri/capabilities/`)
  zwingt zu expliziten, auditierbaren Berechtigungen (welche Domains darf `fetch`
  erreichen, welche Dateisystempfade sind erlaubt) - passend zu einer App, die
  API-Keys verwaltet.
- **Rust-Backend nur als dünne Hostschicht**: Da praktisch die gesamte Logik
  (HTTP-Client, WebSocket-Konsole, State-Management) plattformunabhängig in
  TypeScript/React lebt, bringt ein Electron-Node-Backend keinen Mehrwert - es würde
  nur zusätzliche Angriffsfläche (Node-Integration) hinzufügen.
- **Auto-Updater & Installer**: `tauri-plugin-updater` + der NSIS-Bundler liefern
  einen production-tauglichen Signatur-geprüften Auto-Update-Flow "out of the box".

## Projektstruktur

```
pterodactyl-desktop/
├── src/                        # React/TypeScript-Frontend
│   ├── components/
│   │   ├── ui/                 # Design-System-Primitiven (Button, Modal, Toast, ...)
│   │   └── layout/              # AppLayout, Sidebar, TopBar, ProfileSwitcher, UpdateBadge
│   ├── pages/                  # ProfilesPage, DashboardPage, ServerDetailPage, SettingsPage
│   ├── features/               # Fachliche Module, je Feature: hooks.ts + components/
│   │   ├── profiles/            # Profil-Verwaltung (Login-Ansicht)
│   │   ├── servers/             # Dashboard, Status, Ressourcen, Power-Controls
│   │   ├── console/             # WebSocket-Live-Konsole
│   │   ├── files/               # Dateibrowser + interner Editor
│   │   ├── backups/             # Backup-Verwaltung
│   │   ├── startup/             # Startbefehl, Docker-Image, Egg-Variablen
│   │   ├── network/              # Allocations
│   │   └── activity/             # Aktivitätsprotokoll
│   ├── lib/
│   │   ├── api/                 # httpClient, ClientApi, ApplicationApi, Fehlerbehandlung
│   │   ├── types/                # Typdefinitionen für alle API-Responses
│   │   └── utils/                # format, validation, constants, cn
│   ├── store/                   # Zustand-Stores (Profile, Settings, Toast, Confirm, Updater, Debug-Log)
│   └── hooks/                    # useApi, useToast, useConfirm, useAutoRefresh, useUpdater, ...
├── src-tauri/                   # Rust/Tauri-Backend (dünne Hostschicht + Plugins)
│   ├── capabilities/             # Explizite Permission-Grants (default.json)
│   └── src/main.rs
└── .github/workflows/release.yml # CI: baut Windows-Installer + signiert Updater-Artefakte
```

## Setup

### Voraussetzungen

- [Node.js](https://nodejs.org/) ≥ 20
- [Rust](https://www.rust-lang.org/tools/install) (stable toolchain, `rustup`)
- Windows: [WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/)
  (auf aktuellen Windows-10/11-Systemen i. d. R. vorinstalliert)
- Tauri-Systemabhängigkeiten: siehe [Tauri Prerequisites](https://v2.tauri.app/start/prerequisites/)
  (auf Windows i. d. R. nur die MSVC-Build-Tools von Visual Studio)

### Installation

```bash
npm install
```

### Entwicklung

```bash
npm run tauri dev
```

Startet Vite-Dev-Server + Tauri-Fenster mit Hot-Reload. Alternativ `npm run dev` für
reines Frontend im Browser (API-Aufrufe funktionieren dann nur eingeschränkt, da das
Tauri-HTTP-Plugin fehlt und der Browser CORS gegen fremde Panel-Domains durchsetzt).

### Produktions-Build (Installer)

```bash
npm run tauri build
```

Erzeugt in `src-tauri/target/release/bundle/`:
- `nsis/Pterodactyl Desktop_<version>_x64-setup.exe` - empfohlener Installer
- `msi/Pterodactyl Desktop_<version>_x64_en-US.msi` - alternativer MSI-Installer

## Erste Nutzung

1. App starten → Ansicht **"Profile verwalten"** (automatisch beim ersten Start).
2. **Neues Profil** anlegen:
   - **Panel-URL**: z. B. `https://panel.example.com`
   - **Client-API-Key**: Panel → Account Settings → API Credentials (`ptlc_...`)
   - Optional: **Application-API-Key** (Panel → Admin → Application API, `ptla_...`)
     für Node-/Location-Anreicherung im Dashboard.
3. **Verbindung testen**, dann **Speichern** - das Dashboard lädt automatisch alle
   dem Account zugeordneten Server.

Mehrere Profile (mehrere Panels/Accounts) können parallel gespeichert und über den
Profil-Switcher oben rechts gewechselt werden.

## Auto-Updater

Die App prüft beim Start (still) und über **Einstellungen → Über & Updates**
(manuell) auf neue Versionen via GitHub Releases:

```
https://github.com/MoinMeister3751/pterodactyl-desktop/releases/latest/download/latest.json
```

**Release-Workflow** (`.github/workflows/release.yml`):

1. Tag pushen: `git tag v0.2.0 && git push origin v0.2.0`
2. GitHub Actions baut den Windows-Installer, signiert die Update-Artefakte mit dem
   hinterlegten Minisign-Schlüsselpaar und veröffentlicht einen (Draft-)Release
   inkl. `latest.json`.
3. Draft-Release im GitHub-UI prüfen und veröffentlichen.
4. Installierte Clients erkennen das Update beim nächsten Start/Check und bieten
   Download + Ein-Klick-Installation + Neustart an.

**Signierschlüssel**: Das Schlüsselpaar liegt lokal in `.keys/` (gitignored) und als
verschlüsseltes Repo-Secret (`TAURI_SIGNING_PRIVATE_KEY`,
`TAURI_SIGNING_PRIVATE_KEY_PASSWORD`) in den GitHub-Actions-Secrets des Repos. Der
öffentliche Schlüssel ist in `src-tauri/tauri.conf.json` (`plugins.updater.pubkey`)
hinterlegt. **Ohne den privaten Schlüssel können keine gültigen Updates mehr signiert
werden - `.keys/` daher sicher aufbewahren/sichern.**

## Sicherheit

- **Keine Secrets im Code**: Panel-URL und API-Keys werden ausschließlich zur
  Laufzeit vom Nutzer eingegeben.
- **Lokale Speicherung**: Profile (inkl. API-Keys) werden über `tauri-plugin-store`
  als JSON im App-Datenverzeichnis des Windows-Benutzerkontos abgelegt
  (`%APPDATA%\com.jeremy.pterodactyl-desktop\`), geschützt durch die Dateisystem-
  rechte des Betriebssystems. **Das ist keine Verschlüsselung** - für ein noch
  höheres Schutzniveau ließe sich das perspektivisch auf `tauri-plugin-stronghold`
  oder den Windows Credential Manager umstellen (bewusst nicht in diesem Umfang
  umgesetzt, um die Architektur nicht unnötig zu verkomplizieren).
- **Fehlertexte**: `lib/utils/validation.ts#redactSecrets()` entfernt API-Keys aus
  allen Fehlermeldungen/Logs, bevor sie in UI oder Debug-Log landen (siehe
  `lib/api/httpClient.ts`).
- **Netzwerk-Scope**: Das HTTP-Plugin ist in `src-tauri/capabilities/default.json`
  auf `http://**`/`https://**` beschränkt (nötig, da die Panel-URL erst zur Laufzeit
  bekannt ist) - es gibt keinen Zugriff auf beliebige native APIs außerhalb der
  explizit gewährten Capabilities.
- **URL-Validierung**: `http://` wird nur für lokale/private Adressen akzeptiert
  (siehe `validatePanelUrl`), um versehentliche Klartext-Übertragung von API-Keys
  über das offene Internet zu verhindern.
- **CSP**: Strikte Content-Security-Policy in `index.html` und `tauri.conf.json`.

## Bekannte Einschränkungen / Setup-Abhängigkeiten

Diese App wurde gegen die offizielle Pterodactyl-Client-API (v1) entwickelt. Folgende
Punkte hängen vom konkreten Panel-/Wings-Setup ab:

| Feature | Abhängigkeit |
|---|---|
| Live-Konsole (WebSocket) | Wings muss WebSocket-Verbindungen von der App-Origin (`tauri://localhost`) akzeptieren. Bei strikter Origin-Prüfung im Reverse-Proxy vor Wings kann dies fehlschlagen - ggf. Proxy-Konfiguration anpassen. |
| Node-/Location-Anzeige im Dashboard + **Admin-Ansicht** (Sidebar-Punkt "Admin": Nodes, Locations, Nutzer, alle Server) | Erfordert einen optionalen Application-API-Key mit Leserechten auf `/api/application/{nodes,locations,users,servers}`. Ohne Key bleibt der Sidebar-Punkt "Admin" ausgeblendet und im Dashboard wird nur der von der Client-API gelieferte Node-**Name** angezeigt (keine Location). Die Admin-Ansicht ist read-only (keine Erstell-/Lösch-Aktionen). |
| Aktivitätsprotokoll (Tab "Activity") | Erfordert Panel ≥ 1.11 (Endpoint `/api/client/servers/{id}/activity`). Ältere Panels zeigen hier einen leeren Zustand statt eines Fehlers. |
| Docker-Image-Wechsel (Tab "Startup") | Erfordert einen Egg mit mehreren definierten Images UND dass der Account das Recht zum Wechseln hat; wird sonst automatisch ausgeblendet bzw. mit klarer Fehlermeldung abgefangen. |
| Backup-Download | Nutzt die vom Panel signierte, kurzlebige Download-URL - abhängig von der Backup-Treiber-Konfiguration des Panels (lokal/S3/...). |

## Was direkt funktioniert

Dashboard, Server-Übersicht, Power-Steuerung (Start/Stop/Restart/Kill), Live-Konsole,
Dateiverwaltung (Browsen/Editieren/Hoch-/Runterladen/Umbenennen/Löschen/Ordner
anlegen), Backups (Erstellen/Löschen/Sperren/Download), Startup-Variablen,
Netzwerk-Allokationen, mehrere Panel-Profile, optionale Admin-Ansicht
(Nodes/Locations/Nutzer/alle Server via Application API), Dark Mode, Auto-Refresh,
Debug-Logs mit Export, Auto-Updater über GitHub Releases - alles gegen eine
Standard-Pterodactyl-1.11+-Installation getestet und ohne Mock-Daten implementiert.

## Lizenz

Privates Projekt, keine Lizenzangabe.
