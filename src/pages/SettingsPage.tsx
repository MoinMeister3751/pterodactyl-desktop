import { useEffect, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useSettingsStore, type ThemePreference } from "@/store/useSettingsStore";
import { useDebugLogStore } from "@/store/useDebugLogStore";
import { useUpdaterStore } from "@/store/useUpdaterStore";
import { useUpdater } from "@/hooks/useUpdater";
import { useProfileStore } from "@/store/useProfileStore";
import { useToast } from "@/hooks/useToast";
import { useNavigate } from "react-router-dom";
import { REFRESH_INTERVAL_OPTIONS_SECONDS } from "@/lib/utils/constants";

export function SettingsPage() {
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const refreshIntervalSeconds = useSettingsStore((s) => s.refreshIntervalSeconds);
  const setRefreshInterval = useSettingsStore((s) => s.setRefreshInterval);
  const debugMode = useSettingsStore((s) => s.debugMode);
  const setDebugMode = useSettingsStore((s) => s.setDebugMode);

  const logs = useDebugLogStore((s) => s.entries);
  const clearLogs = useDebugLogStore((s) => s.clear);

  const profiles = useProfileStore((s) => s.profiles);
  const navigate = useNavigate();
  const toast = useToast();

  const { status: updaterStatus, version: updaterVersion, errorMessage } = useUpdaterStore();
  const { checkForUpdates, installUpdate } = useUpdater();

  const [appVersion, setAppVersion] = useState("—");

  useEffect(() => {
    void getVersion().then(setAppVersion);
  }, []);

  async function handleExportLogs() {
    const destination = await save({
      defaultPath: `pterodactyl-desktop-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.json`,
    });
    if (!destination) return;
    await writeTextFile(destination, JSON.stringify(logs, null, 2));
    toast.success("Logs exportiert", destination);
  }

  return (
    <>
      <TopBar title="Einstellungen" />
      <main className="flex-1 overflow-y-auto p-5">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Darstellung</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm text-base-100">Theme</p>
                <p className="text-xs text-base-400">Dunkles Theme ist der Standard dieser App.</p>
              </div>
              <Select
                value={theme}
                onChange={(e) => void setTheme(e.target.value as ThemePreference)}
                className="w-40"
              >
                <option value="dark">Dunkel</option>
                <option value="light">Hell</option>
                <option value="system">System</option>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-xs text-base-400">{profiles.length} gespeicherte(s) Panel-Profil(e)</p>
              <Button size="sm" variant="outline" onClick={() => navigate("/profiles")}>
                Profile verwalten
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aktualisierung</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm text-base-100">Auto-Refresh-Intervall</p>
                <p className="text-xs text-base-400">Für Server-Status und Ressourcenanzeigen.</p>
              </div>
              <Select
                value={refreshIntervalSeconds}
                onChange={(e) => void setRefreshInterval(Number(e.target.value))}
                className="w-32"
              >
                {REFRESH_INTERVAL_OPTIONS_SECONDS.map((s) => (
                  <option key={s} value={s}>
                    {s}s
                  </option>
                ))}
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Debug &amp; Logs</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-base-100">Debug-Modus</p>
                  <p className="text-xs text-base-400">Protokolliert API-Requests (ohne Secrets) für die Fehlersuche.</p>
                </div>
                <Switch checked={debugMode} onChange={(v) => void setDebugMode(v)} />
              </div>
              <div className="flex items-center justify-between border-t border-base-700 pt-3">
                <p className="text-xs text-base-400">{logs.length} Log-Einträge im Speicher</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={clearLogs} disabled={logs.length === 0}>
                    Leeren
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => void handleExportLogs()} disabled={logs.length === 0}>
                    Exportieren
                  </Button>
                </div>
              </div>
              {logs.length > 0 && (
                <div className="max-h-40 overflow-y-auto rounded-md bg-base-950 p-2 font-mono text-[11px] text-base-400">
                  {logs.slice(-30).map((entry) => (
                    <div key={entry.id} className={entry.level === "error" ? "text-danger" : undefined}>
                      [{entry.timestamp.slice(11, 19)}] {entry.message}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Über &amp; Updates</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-base-400">Version {appVersion}</p>
                <Badge tone="neutral">{updaterStatus}</Badge>
              </div>
              {errorMessage && <p className="text-xs text-danger">{errorMessage}</p>}
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => void checkForUpdates()}>
                  Nach Updates suchen
                </Button>
                {updaterStatus === "available" && (
                  <Button size="sm" variant="primary" onClick={() => void installUpdate()}>
                    Update {updaterVersion} installieren
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
