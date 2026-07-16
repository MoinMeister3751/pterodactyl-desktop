import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ResourceGauge } from "./ResourceGauge";
import { useServerResources } from "../hooks";
import { useSettingsStore } from "@/store/useSettingsStore";
import { formatBytes, formatUptime, cpuPercentOfLimit, clampPercent } from "@/lib/utils/format";
import type { ServerAttributes } from "@/lib/types/pterodactyl";
import type { NodeLocationLookup } from "@/lib/types/application";

interface OverviewPanelProps {
  server: ServerAttributes;
  locationInfo?: NodeLocationLookup;
}

export function OverviewPanel({ server, locationInfo }: OverviewPanelProps) {
  const refreshInterval = useSettingsStore((s) => s.refreshIntervalSeconds);
  const { resources, error } = useServerResources(server.identifier, refreshInterval);

  const memoryLimitBytes = server.limits.memory * 1024 * 1024;
  const diskLimitBytes = server.limits.disk * 1024 * 1024;
  const memoryPercent = resources && memoryLimitBytes > 0
    ? clampPercent((resources.resources.memory_bytes / memoryLimitBytes) * 100)
    : null;
  const diskPercent = resources && diskLimitBytes > 0
    ? clampPercent((resources.resources.disk_bytes / diskLimitBytes) * 100)
    : null;
  const cpuPercent = resources ? cpuPercentOfLimit(resources.resources.cpu_absolute, server.limits.cpu) : null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Ressourcen</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ResourceGauge
            label={`CPU (Limit ${server.limits.cpu || "∞"}%)`}
            valueLabel={resources ? `${resources.resources.cpu_absolute.toFixed(1)}%` : "—"}
            percent={cpuPercent}
          />
          <ResourceGauge
            label={`RAM (Limit ${formatBytes(memoryLimitBytes)})`}
            valueLabel={resources ? formatBytes(resources.resources.memory_bytes) : "—"}
            percent={memoryPercent}
          />
          <ResourceGauge
            label={`Disk (Limit ${formatBytes(diskLimitBytes)})`}
            valueLabel={resources ? formatBytes(resources.resources.disk_bytes) : "—"}
            percent={diskPercent}
          />
          <div className="text-xs text-base-400">
            <p className="text-base-500">Netzwerk ↓</p>
            <p className="font-mono text-base-200">{resources ? formatBytes(resources.resources.network_rx_bytes) : "—"}</p>
          </div>
          <div className="text-xs text-base-400">
            <p className="text-base-500">Netzwerk ↑</p>
            <p className="font-mono text-base-200">{resources ? formatBytes(resources.resources.network_tx_bytes) : "—"}</p>
          </div>
          <div className="text-xs text-base-400">
            <p className="text-base-500">Uptime</p>
            <p className="font-mono text-base-200">{resources ? formatUptime(resources.resources.uptime) : "—"}</p>
          </div>
          {error && <p className="col-span-full text-xs text-danger">{error}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Server-Info</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-xs">
          <InfoRow label="Identifier" value={server.identifier} mono />
          <InfoRow label="UUID" value={server.uuid} mono />
          <InfoRow label="Node" value={server.node} />
          {locationInfo?.locationLong && <InfoRow label="Standort" value={locationInfo.locationLong} />}
          <InfoRow label="Docker-Image" value={server.docker_image} mono />
          <InfoRow label="SFTP" value={`${server.sftp_details.ip}:${server.sftp_details.port}`} mono />
        </CardContent>
      </Card>

      {server.description && (
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Beschreibung</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-base-300">{server.description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-base-500">{label}</span>
      <span className={`truncate text-right text-base-200 ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}
