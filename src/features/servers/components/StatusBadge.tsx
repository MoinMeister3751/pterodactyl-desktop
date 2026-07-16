import { Badge } from "@/components/ui/Badge";
import { statusMeta, type DisplayStatus } from "../statusUtils";

export function StatusBadge({ status }: { status: DisplayStatus }) {
  const meta = statusMeta(status);
  return (
    <Badge tone={meta.tone} dot>
      {meta.label}
    </Badge>
  );
}
