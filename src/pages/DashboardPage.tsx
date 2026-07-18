import { useEffect, useMemo, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { ServerList } from "@/features/servers/components/ServerList";
import { useServers, useNodeLocationLookup, useServerResourcesMap } from "@/features/servers/hooks";
import { useAdminServers, useAdminNodes } from "@/features/admin/hooks";
import { adaptAdminServer } from "@/features/servers/adminAdapter";
import { useDebounce } from "@/hooks/useDebounce";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useProfileStore } from "@/store/useProfileStore";
import { useToast } from "@/hooks/useToast";
import { deriveDisplayStatus, type DisplayStatus } from "@/features/servers/statusUtils";

const STATUS_FILTERS: Array<{ value: DisplayStatus | "all"; label: string }> = [
  { value: "all", label: "Alle Status" },
  { value: "running", label: "Online" },
  { value: "offline", label: "Offline" },
  { value: "starting", label: "Startet" },
  { value: "stopping", label: "Stoppt" },
  { value: "installing", label: "Installiert" },
  { value: "suspended", label: "Gesperrt" },
];

export function DashboardPage() {
  const hasApplicationApiKey = useProfileStore((s) => !!s.activeProfile()?.applicationApiKey);
  const [showAllServers, setShowAllServers] = useState(false);
  const toast = useToast();
  const refreshInterval = useSettingsStore((s) => s.refreshIntervalSeconds);

  // Serverliste läuft im Hintergrund mit, damit neu erstellte/gelöschte Server ohne
  // manuellen Reload auftauchen - nutzt dasselbe Intervall wie die Ressourcenanzeige.
  const ownServers = useServers(refreshInterval);
  const { data: adminServers, loading: adminLoading, error: adminError, refetch: adminRefetch } = useAdminServers();
  const { data: adminNodes } = useAdminNodes();

  const nodesById = useMemo(() => new Map(adminNodes.map((n) => [n.id, n])), [adminNodes]);
  const adaptedAdminServers = useMemo(
    () => adminServers.map((s) => adaptAdminServer(s, nodesById)),
    [adminServers, nodesById],
  );

  const viewingAll = showAllServers && hasApplicationApiKey;
  const servers = viewingAll ? adaptedAdminServers : ownServers.servers;
  const loading = viewingAll ? adminLoading : ownServers.loading;
  const error = viewingAll ? adminError : ownServers.error;
  const refetch = viewingAll ? adminRefetch : ownServers.refetch;

  const { lookup, error: lookupError } = useNodeLocationLookup();
  const identifiers = useMemo(() => servers.map((s) => s.identifier), [servers]);
  const resourcesMap = useServerResourcesMap(identifiers, refreshInterval);

  useEffect(() => {
    if (hasApplicationApiKey && lookupError) {
      toast.warning("Application API nicht nutzbar", lookupError);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lookupError, hasApplicationApiKey]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DisplayStatus | "all">("all");
  const debouncedSearch = useDebounce(search, 200);

  const filteredServers = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return servers.filter((server) => {
      const matchesSearch =
        !query ||
        server.name.toLowerCase().includes(query) ||
        server.identifier.toLowerCase().includes(query) ||
        server.node.toLowerCase().includes(query);
      if (!matchesSearch) return false;
      if (statusFilter === "all") return true;
      const liveState = resourcesMap.get(server.identifier)?.current_state ?? null;
      const status = deriveDisplayStatus(server, liveState);
      return status === statusFilter;
    });
  }, [servers, debouncedSearch, statusFilter, resourcesMap]);

  return (
    <>
      <TopBar title="Dashboard" subtitle={`${servers.length} Server${viewingAll ? " (panelweit)" : ""}`}>
        <div className="flex items-center gap-3">
          {hasApplicationApiKey && (
            <div className="flex items-center gap-2 rounded-md border border-base-700 bg-base-850 px-2.5 py-1.5">
              <Switch checked={showAllServers} onChange={setShowAllServers} label="Alle Server anzeigen" />
              <span className="text-xs text-base-300">{showAllServers ? "Alle Server" : "Nur meine"}</span>
            </div>
          )}
          <div className="w-56">
            <Input
              placeholder="Server suchen…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-40">
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as DisplayStatus | "all")}>
              {STATUS_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </TopBar>

      <main className="flex-1 overflow-y-auto p-5">
        {viewingAll && (
          <p className="mb-3 text-xs text-base-400">
            Panelweite Ansicht über die Application API. Live-Ressourcen (CPU/RAM) sind nur für Server sichtbar, die
            dein Account selbst besitzt oder als Subuser verwalten darf.
          </p>
        )}
        <ServerList
          servers={filteredServers}
          loading={loading}
          error={error}
          onRetry={refetch}
          hasAnyServers={servers.length > 0}
          nodeLocationLookup={lookup}
          resourcesMap={resourcesMap}
        />
      </main>
    </>
  );
}
