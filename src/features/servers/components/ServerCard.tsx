import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "./StatusBadge";
import { ResourceGauge } from "./ResourceGauge";
import { deriveDisplayStatus } from "../statusUtils";
import { formatBytes, cpuPercentOfLimit, clampPercent } from "@/lib/utils/format";
import type { ServerAttributes, ServerResourcesAttributes } from "@/lib/types/pterodactyl";
import type { NodeLocationLookup } from "@/lib/types/application";

interface ServerCardProps {
  server: ServerAttributes;
  locationInfo?: NodeLocationLookup;
  resources?: ServerResourcesAttributes;
}

export function ServerCard({ server, locationInfo, resources }: ServerCardProps) {
  const navigate = useNavigate();
  const displayStatus = deriveDisplayStatus(server, resources?.current_state ?? null);

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
    <Card
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/servers/${server.identifier}`)}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/servers/${server.identifier}`)}
      className="flex cursor-pointer flex-col gap-3 p-4 transition-colors hover:border-accent-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/60"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-base-100">{server.name}</p>
          <p className="truncate text-xs text-base-400">{server.identifier}</p>
        </div>
        <StatusBadge status={displayStatus} />
      </div>

      {server.description && (
        <p className="line-clamp-1 text-xs text-base-400">{server.description}</p>
      )}

      <div className="flex flex-wrap gap-1.5">
        <Badge tone="neutral">{server.node}</Badge>
        {locationInfo?.locationShort && <Badge tone="neutral">{locationInfo.locationShort}</Badge>}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <ResourceGauge
          label="CPU"
          valueLabel={resources ? `${resources.resources.cpu_absolute.toFixed(0)}%` : "—"}
          percent={cpuPercent}
        />
        <ResourceGauge
          label="RAM"
          valueLabel={resources ? formatBytes(resources.resources.memory_bytes, 1) : "—"}
          percent={memoryPercent}
        />
        <ResourceGauge
          label="Disk"
          valueLabel={resources ? formatBytes(resources.resources.disk_bytes, 1) : "—"}
          percent={diskPercent}
        />
      </div>
    </Card>
  );
}
