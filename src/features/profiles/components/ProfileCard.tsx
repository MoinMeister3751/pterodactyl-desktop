import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatRelativeTime } from "@/lib/utils/format";
import type { PanelProfile } from "@/lib/types/profile";

interface ProfileCardProps {
  profile: PanelProfile;
  isActive: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ProfileCard({ profile, isActive, onSelect, onEdit, onDelete }: ProfileCardProps) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-base-100">{profile.name}</p>
          <p className="truncate text-xs text-base-400">{profile.panelUrl}</p>
        </div>
        {isActive && (
          <Badge tone="success" dot>
            Aktiv
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Badge tone="accent">Client API</Badge>
        {profile.applicationApiKey && <Badge tone="neutral">Application API</Badge>}
      </div>

      <p className="text-[11px] text-base-400">
        Zuletzt verwendet: {profile.lastUsedAt ? formatRelativeTime(profile.lastUsedAt) : "nie"}
      </p>

      <div className="mt-1 flex gap-2">
        <Button size="sm" variant="primary" className="flex-1" onClick={onSelect}>
          Verbinden
        </Button>
        <Button size="sm" variant="outline" onClick={onEdit}>
          Bearbeiten
        </Button>
        <Button size="sm" variant="ghost" onClick={onDelete} className="text-danger hover:text-danger">
          Löschen
        </Button>
      </div>
    </Card>
  );
}
