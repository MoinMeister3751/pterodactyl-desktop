import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TopBar } from "@/components/layout/TopBar";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { PowerControls } from "@/features/servers/components/PowerControls";
import { StatusBadge } from "@/features/servers/components/StatusBadge";
import { OverviewPanel } from "@/features/servers/components/OverviewPanel";
import { deriveDisplayStatus } from "@/features/servers/statusUtils";
import { useServerResources, useNodeLocationLookup } from "@/features/servers/hooks";
import { Console } from "@/features/console/components/Console";
import { FileBrowser } from "@/features/files/components/FileBrowser";
import { DatabasesPanel } from "@/features/databases/components/DatabasesPanel";
import { SchedulesPanel } from "@/features/schedules/components/SchedulesPanel";
import { SubusersPanel } from "@/features/subusers/components/SubusersPanel";
import { BackupList } from "@/features/backups/components/BackupList";
import { NetworkPanel } from "@/features/network/components/NetworkPanel";
import { StartupPanel } from "@/features/startup/components/StartupPanel";
import { ServerSettingsPanel } from "@/features/settings/components/ServerSettingsPanel";
import { ActivityPanel } from "@/features/activity/components/ActivityPanel";
import { useClientApi } from "@/hooks/useApi";
import { useSettingsStore } from "@/store/useSettingsStore";
import { ApiError } from "@/lib/api/errors";
import type { ServerAttributes } from "@/lib/types/pterodactyl";

const TABS: TabItem[] = [
  { key: "overview", label: "Overview" },
  { key: "console", label: "Console" },
  { key: "files", label: "Files" },
  { key: "databases", label: "Database" },
  { key: "schedules", label: "Schedules" },
  { key: "users", label: "Users" },
  { key: "backups", label: "Backups" },
  { key: "network", label: "Network" },
  { key: "startup", label: "Startup" },
  { key: "settings", label: "Settings" },
  { key: "activity", label: "Activity" },
];

export function ServerDetailPage() {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();
  const api = useClientApi();
  const refreshInterval = useSettingsStore((s) => s.refreshIntervalSeconds);
  const { lookup } = useNodeLocationLookup();

  const [server, setServer] = useState<ServerAttributes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const { resources } = useServerResources(identifier ?? null, refreshInterval);

  async function loadServer() {
    if (!api || !identifier) return;
    setError(null);
    try {
      const data = await api.getServer(identifier);
      setServer(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.userMessage : "Server konnte nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    void loadServer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, identifier]);

  // Serverobjekt (Status, Limits, Beschreibung, ...) im Hintergrund aktuell halten,
  // ohne dabei erneut den Lade-Skeleton zu zeigen.
  useEffect(() => {
    if (refreshInterval <= 0) return;
    const id = setInterval(() => void loadServer(), refreshInterval * 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, identifier, refreshInterval]);

  if (!identifier) return null;

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-5">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !server) {
    return (
      <div className="flex flex-1 items-center justify-center p-5">
        <ErrorState message={error ?? "Server nicht gefunden."} onRetry={loadServer} />
      </div>
    );
  }

  const displayStatus = deriveDisplayStatus(server, resources?.current_state ?? null);

  return (
    <>
      <TopBar title={server.name} subtitle={server.identifier}>
        <div className="flex items-center gap-3">
          <StatusBadge status={displayStatus} />
          <PowerControls identifier={server.identifier} currentState={resources?.current_state ?? null} />
          <Button size="sm" variant="ghost" onClick={() => navigate("/")}>
            ← Dashboard
          </Button>
        </div>
      </TopBar>

      <Tabs items={TABS} active={activeTab} onChange={setActiveTab} />

      <main className="flex-1 overflow-y-auto p-5">
        {activeTab === "overview" && (
          <OverviewPanel server={server} locationInfo={lookup?.get(server.node)} />
        )}
        {activeTab === "console" && (
          <div className="h-[calc(100vh-11rem)]">
            <Console identifier={server.identifier} />
          </div>
        )}
        {activeTab === "files" && (
          <div className="h-[calc(100vh-11rem)]">
            <FileBrowser identifier={server.identifier} />
          </div>
        )}
        {activeTab === "databases" && (
          <DatabasesPanel identifier={server.identifier} databaseLimit={server.feature_limits.databases} />
        )}
        {activeTab === "schedules" && <SchedulesPanel identifier={server.identifier} />}
        {activeTab === "users" && <SubusersPanel identifier={server.identifier} />}
        {activeTab === "backups" && (
          <BackupList identifier={server.identifier} backupLimit={server.feature_limits.backups} />
        )}
        {activeTab === "network" && (
          <NetworkPanel identifier={server.identifier} allocationLimit={server.feature_limits.allocations} />
        )}
        {activeTab === "startup" && <StartupPanel identifier={server.identifier} />}
        {activeTab === "settings" && <ServerSettingsPanel server={server} onRenamed={loadServer} />}
        {activeTab === "activity" && <ActivityPanel identifier={server.identifier} />}
      </main>
    </>
  );
}
