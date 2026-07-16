import { useUpdaterStore } from "@/store/useUpdaterStore";
import { useUpdater } from "@/hooks/useUpdater";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

export function UpdateBadge() {
  const { status, version, progress } = useUpdaterStore();
  const { installUpdate } = useUpdater();

  if (status === "idle" || status === "checking" || status === "up_to_date" || status === "error") {
    return null;
  }

  if (status === "available") {
    return (
      <Button size="sm" variant="primary" onClick={() => void installUpdate()} className="animate-fade-in">
        Update {version} installieren
      </Button>
    );
  }

  if (status === "downloading") {
    return (
      <div className="flex items-center gap-2 rounded-md bg-base-800 px-3 py-1.5 text-xs text-base-300">
        <Spinner className="h-3.5 w-3.5" />
        Lädt Update… {progress > 0 ? `${progress}%` : ""}
      </div>
    );
  }

  if (status === "ready") {
    return (
      <div className="flex items-center gap-2 rounded-md bg-success-bg px-3 py-1.5 text-xs text-success">
        Update installiert – Neustart…
      </div>
    );
  }

  return null;
}
