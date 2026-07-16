import { useEffect, useMemo, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ServerList } from "@/features/servers/components/ServerList";
import { useServers, useNodeLocationLookup, useServerResourcesMap } from "@/features/servers/hooks";
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
  const { servers, loading, error, refetch } = useServers();
  const { lookup, error: lookupError } = useNodeLocationLookup();
  const hasApplicationApiKey = useProfileStore((s) => !!s.activeProfile()?.applicationApiKey);
  const toast = useToast();
  const refreshInterval = useSettingsStore((s) => s.refreshIntervalSeconds);
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
      <TopBar title="Dashboard" subtitle={`${servers.length} Server`}>
        <div className="flex items-center gap-2">
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
