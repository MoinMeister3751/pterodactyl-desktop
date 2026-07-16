import { useCallback, useEffect, useRef, useState } from "react";
import { useClientApi } from "@/hooks/useApi";
import type { ConsoleLine, ConsoleLineKind, ServerPowerState, WingsSocketMessage } from "@/lib/types/pterodactyl";

export type ConsoleConnectionState = "idle" | "connecting" | "connected" | "reconnecting" | "closed" | "error";

const MAX_LINES = 2000;
const RECONNECT_BASE_DELAY_MS = 1500;
const MAX_RECONNECT_DELAY_MS = 20_000;

function classifyOutput(text: string): ConsoleLineKind {
  if (/\b(error|exception|severe|fatal)\b/i.test(text)) return "error";
  if (/\b(warn|warning)\b/i.test(text)) return "warning";
  return "output";
}

function makeLine(kind: ConsoleLineKind, text: string): ConsoleLine {
  return { id: crypto.randomUUID(), kind, text, timestamp: Date.now() };
}

/**
 * Verwaltet die Live-Konsole über den Wings-WebSocket (siehe
 * lib/api/clientApi.ts#getWebsocketCredentials). Der Token läuft nach kurzer
 * Zeit ab ("token expiring"/"token expired") - wird hier automatisch erneuert.
 *
 * Annahme: Wings akzeptiert WebSocket-Verbindungen von der Desktop-App-Origin.
 * Je nach Wings-/Reverse-Proxy-Konfiguration kann eine striktere Origin-Prüfung
 * dies verhindern - siehe README, Abschnitt "Bekannte Einschränkungen".
 */
export function useConsoleSocket(identifier: string | null) {
  const api = useClientApi();
  const [lines, setLines] = useState<ConsoleLine[]>([]);
  const [connectionState, setConnectionState] = useState<ConsoleConnectionState>("idle");
  const [powerState, setPowerState] = useState<ServerPowerState | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttempt = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closedByUser = useRef(false);

  const appendLine = useCallback((kind: ConsoleLineKind, text: string) => {
    setLines((prev) => {
      const next = [...prev, makeLine(kind, text)];
      return next.length > MAX_LINES ? next.slice(next.length - MAX_LINES) : next;
    });
  }, []);

  const connect = useCallback(async () => {
    if (!api || !identifier) return;
    closedByUser.current = false;
    setConnectionState((prev) => (prev === "idle" ? "connecting" : "reconnecting"));

    try {
      const credentials = await api.getWebsocketCredentials(identifier);
      const socket = new WebSocket(credentials.socket);
      socketRef.current = socket;

      socket.onopen = () => {
        socket.send(JSON.stringify({ event: "auth", args: [credentials.token] }));
      };

      socket.onmessage = (event) => {
        let message: WingsSocketMessage;
        try {
          message = JSON.parse(event.data);
        } catch {
          return;
        }
        handleMessage(message);
      };

      socket.onerror = () => {
        setConnectionState("error");
      };

      socket.onclose = () => {
        if (closedByUser.current) {
          setConnectionState("closed");
          return;
        }
        scheduleReconnect();
      };
    } catch {
      appendLine("system", "Verbindung zur Konsole konnte nicht hergestellt werden.");
      setConnectionState("error");
      scheduleReconnect();
    }

    function handleMessage(message: WingsSocketMessage) {
      switch (message.event) {
        case "auth success":
          reconnectAttempt.current = 0;
          setConnectionState("connected");
          appendLine("system", "Verbunden mit Konsole.");
          break;
        case "console output":
          for (const raw of message.args ?? []) {
            appendLine(classifyOutput(raw), stripAnsi(raw));
          }
          break;
        case "install output":
          for (const raw of message.args ?? []) {
            appendLine("system", `[Installer] ${stripAnsi(raw)}`);
          }
          break;
        case "status":
          setPowerState((message.args?.[0] as ServerPowerState) ?? null);
          break;
        case "token expiring":
          void refreshToken();
          break;
        case "token expired":
          appendLine("system", "Sitzung abgelaufen, verbinde neu…");
          socketRef.current?.close();
          void connect();
          break;
        case "daemon error":
          appendLine("error", message.args?.[0] ?? "Unbekannter Daemon-Fehler.");
          break;
        case "jwt error":
          appendLine("error", "Authentifizierung an der Konsole fehlgeschlagen.");
          setConnectionState("error");
          break;
        default:
          break;
      }
    }

    async function refreshToken() {
      if (!api || !identifier || !socketRef.current) return;
      try {
        const fresh = await api.getWebsocketCredentials(identifier);
        socketRef.current.send(JSON.stringify({ event: "auth", args: [fresh.token] }));
      } catch {
        // Wird beim nächsten "token expired" ohnehin neu verbunden.
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, identifier, appendLine]);

  const scheduleReconnect = useCallback(() => {
    if (closedByUser.current) return;
    setConnectionState("reconnecting");
    const delay = Math.min(
      RECONNECT_BASE_DELAY_MS * 2 ** reconnectAttempt.current,
      MAX_RECONNECT_DELAY_MS,
    );
    reconnectAttempt.current += 1;
    reconnectTimer.current = setTimeout(() => void connect(), delay);
  }, [connect]);

  const sendCommand = useCallback((command: string) => {
    if (socketRef.current?.readyState !== WebSocket.OPEN) return false;
    socketRef.current.send(JSON.stringify({ event: "send command", args: [command] }));
    appendLine("input", command);
    return true;
  }, [appendLine]);

  const clear = useCallback(() => setLines([]), []);

  useEffect(() => {
    void connect();
    return () => {
      closedByUser.current = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      socketRef.current?.close();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identifier, api]);

  return { lines, connectionState, powerState, sendCommand, clear, reconnect: connect };
}

function stripAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1b\[[0-9;]*m/g, "");
}
