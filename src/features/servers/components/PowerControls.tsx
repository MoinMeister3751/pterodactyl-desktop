import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useClientApi } from "@/hooks/useApi";
import { useConfirm } from "@/hooks/useConfirm";
import { useToast } from "@/hooks/useToast";
import type { PowerSignal, ServerPowerState } from "@/lib/types/pterodactyl";

interface PowerControlsProps {
  identifier: string;
  currentState: ServerPowerState | null;
}

const DESTRUCTIVE_SIGNALS: PowerSignal[] = ["stop", "kill"];

export function PowerControls({ identifier, currentState }: PowerControlsProps) {
  const api = useClientApi();
  const confirm = useConfirm();
  const toast = useToast();
  const [pending, setPending] = useState<PowerSignal | null>(null);

  async function handleSignal(signal: PowerSignal) {
    if (!api) return;
    if (DESTRUCTIVE_SIGNALS.includes(signal)) {
      const confirmed = await confirm({
        title: signal === "kill" ? "Server hart beenden?" : "Server stoppen?",
        description:
          signal === "kill"
            ? "Der Prozess wird sofort beendet (SIGKILL). Nicht gespeicherte Daten können verloren gehen."
            : "Der Server wird kontrolliert heruntergefahren.",
        confirmLabel: signal === "kill" ? "Hart beenden" : "Stoppen",
        destructive: true,
      });
      if (!confirmed) return;
    }

    setPending(signal);
    try {
      await api.sendPowerSignal(identifier, signal);
      toast.success(signalLabel(signal) + " gesendet");
    } catch (error) {
      toast.error(`${signalLabel(signal)} fehlgeschlagen`, error);
    } finally {
      setPending(null);
    }
  }

  const isRunning = currentState === "running" || currentState === "starting";
  const isOffline = currentState === "offline" || currentState === null;

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="primary"
        disabled={isRunning}
        loading={pending === "start"}
        onClick={() => void handleSignal("start")}
      >
        Start
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={isOffline}
        loading={pending === "restart"}
        onClick={() => void handleSignal("restart")}
      >
        Restart
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={isOffline}
        loading={pending === "stop"}
        onClick={() => void handleSignal("stop")}
      >
        Stop
      </Button>
      <Button
        size="sm"
        variant="danger"
        loading={pending === "kill"}
        onClick={() => void handleSignal("kill")}
      >
        Kill
      </Button>
    </div>
  );
}

function signalLabel(signal: PowerSignal): string {
  switch (signal) {
    case "start":
      return "Start";
    case "stop":
      return "Stop";
    case "restart":
      return "Restart";
    case "kill":
      return "Kill";
  }
}
