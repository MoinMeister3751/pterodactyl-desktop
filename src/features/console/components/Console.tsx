import { useEffect, useRef, useState } from "react";
import { useConsoleSocket } from "../useConsoleSocket";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/hooks/useToast";
import { useClientApi } from "@/hooks/useApi";
import { cn } from "@/lib/utils/cn";
import type { ConsoleLineKind } from "@/lib/types/pterodactyl";

const LINE_STYLES: Record<ConsoleLineKind, string> = {
  output: "text-base-200",
  input: "text-accent-300",
  system: "text-base-400 italic",
  warning: "text-warning",
  error: "text-danger",
};

const CONNECTION_LABEL: Record<string, { label: string; tone: "success" | "warning" | "danger" | "neutral" }> = {
  idle: { label: "Nicht verbunden", tone: "neutral" },
  connecting: { label: "Verbinde…", tone: "warning" },
  connected: { label: "Verbunden", tone: "success" },
  reconnecting: { label: "Verbinde neu…", tone: "warning" },
  closed: { label: "Getrennt", tone: "neutral" },
  error: { label: "Fehler", tone: "danger" },
};

export function Console({ identifier }: { identifier: string }) {
  const { lines, connectionState, sendCommand, clear, reconnect, eulaBlocked, dismissEula } =
    useConsoleSocket(identifier);
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [acceptingEula, setAcceptingEula] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const clientApi = useClientApi();

  async function handleAcceptEula() {
    if (!clientApi) return;
    setAcceptingEula(true);
    try {
      await clientApi.writeFile(identifier, "eula.txt", "eula=true\n");
      await clientApi.sendPowerSignal(identifier, "start");
      toast.success("EULA akzeptiert", "Server wird gestartet.");
      dismissEula();
    } catch (err) {
      toast.error("EULA konnte nicht akzeptiert werden", err);
    } finally {
      setAcceptingEula(false);
    }
  }

  useEffect(() => {
    if (!autoScroll || !scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [lines, autoScroll]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setAutoScroll(atBottom);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = command.trim();
    if (!trimmed) return;
    const sent = sendCommand(trimmed);
    if (!sent) {
      toast.error("Befehl konnte nicht gesendet werden", "Konsole ist nicht verbunden.");
      return;
    }
    setHistory((prev) => [...prev, trimmed]);
    setHistoryIndex(null);
    setCommand("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIndex = historyIndex === null ? history.length - 1 : Math.max(historyIndex - 1, 0);
      setHistoryIndex(nextIndex);
      setCommand(history[nextIndex]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex === null) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= history.length) {
        setHistoryIndex(null);
        setCommand("");
      } else {
        setHistoryIndex(nextIndex);
        setCommand(history[nextIndex]);
      }
    }
  }

  async function handleCopy() {
    const text = lines.map((l) => l.text).join("\n");
    await navigator.clipboard.writeText(text);
    toast.success("Konsole kopiert", `${lines.length} Zeilen in die Zwischenablage kopiert.`);
  }

  const status = CONNECTION_LABEL[connectionState] ?? CONNECTION_LABEL.idle;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-base-700 bg-base-950">
      <div className="flex items-center justify-between border-b border-base-700 bg-base-900 px-3 py-2">
        <div className="flex items-center gap-2">
          <Badge tone={status.tone} dot>
            {status.label}
          </Badge>
          {connectionState === "error" || connectionState === "closed" ? (
            <Button size="sm" variant="ghost" onClick={() => void reconnect()}>
              Neu verbinden
            </Button>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={handleCopy}>
            Kopieren
          </Button>
          <Button size="sm" variant="ghost" onClick={clear}>
            Leeren
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 py-2 font-mono text-[13px] leading-relaxed"
      >
        {lines.length === 0 && (
          <p className="mt-4 text-center text-xs text-base-500">Warte auf Konsolenausgabe…</p>
        )}
        {lines.map((line) => (
          <div key={line.id} className={cn("whitespace-pre-wrap break-all", LINE_STYLES[line.kind])}>
            {line.kind === "input" ? <span className="text-base-500">$ </span> : null}
            {line.text}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-base-700 bg-base-900 p-2">
        <span className="pl-1 font-mono text-sm text-base-500">$</span>
        <input
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={connectionState === "connected" ? "Befehl eingeben…" : "Konsole nicht verbunden"}
          disabled={connectionState !== "connected"}
          className="flex-1 bg-transparent font-mono text-sm text-base-100 outline-none placeholder:text-base-500 disabled:opacity-50"
        />
        <Button type="submit" size="sm" variant="primary" disabled={connectionState !== "connected"}>
          Senden
        </Button>
      </form>

      <Modal
        open={eulaBlocked}
        onClose={dismissEula}
        title="Minecraft EULA akzeptieren?"
        description="Der Server ist gestoppt, weil die Minecraft-EULA (eula.txt) noch nicht akzeptiert wurde."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={dismissEula}>
              Später
            </Button>
            <Button variant="primary" loading={acceptingEula} onClick={() => void handleAcceptEula()}>
              Akzeptieren &amp; Starten
            </Button>
          </>
        }
      >
        <p className="text-sm text-base-300">
          Mit Klick auf "Akzeptieren & Starten" bestätigst du die{" "}
          <span className="text-base-100">Minecraft End User License Agreement</span> (eula=true wird in eula.txt
          geschrieben) und der Server wird neu gestartet.
        </p>
      </Modal>
    </div>
  );
}
