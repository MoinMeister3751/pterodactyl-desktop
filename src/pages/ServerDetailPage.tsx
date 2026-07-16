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
import { BackupList } from "@/features/backups/components/BackupList";
import { StartupPanel } from "@/features/startup/components/StartupPanel";
import { NetworkPanel } from "@/features/network/components/NetworkPanel";
import { ActivityPanel } from "@/features/activity/components/ActivityPanel";
import { useClientApi } from "@/hooks/useApi";
import { useSettingsStore } from "@/store/useSettingsStore";
import { ApiError } from "@/lib/api/errors";
import type { ServerAttributes } from "@/lib/types/pterodactyl";

const TABS: TabItem[] = [
  { key: "overview", label: "Overview" },
  { key: "console", label: "Console" },
  { key: "files", label: "Files" },
  { key: "backups", label: "Backups" },
  { key: "startup", label: "Startup" },
  { key: "network", label: "Network" },
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
        {activeTab === "backups" && <BackupList identifier={server.identifier} />}
        {activeTab === "startup" && <StartupPanel identifier={server.identifier} />}
        {activeTab === "network" && <NetworkPanel identifier={server.identifier} />}
        {activeTab === "activity" && <ActivityPanel identifier={server.identifier} />}
      </main>
    </>
  );
}
