import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

export interface TauriWebSocketHandlers {
  onOpen?: () => void;
  onMessage?: (data: string) => void;
  onClose?: () => void;
  onError?: (message: string) => void;
}

/**
 * Ersatz für `new WebSocket(url)`, der die Verbindung nativ auf der Rust-Seite
 * aufbaut (siehe src-tauri/src/ws_proxy.rs) statt im WebView. Grund: Wings prüft
 * beim Handshake den Origin-Header gegen die im Node hinterlegte Panel-URL und
 * lehnt alles andere mit HTTP 403 ab - das WebView sendet dabei aber immer seinen
 * eigenen, festen Origin (`tauri://localhost`), der nie passt. Nativ können wir
 * den Origin-Header explizit auf die echte Panel-URL setzen.
 */
export class TauriWebSocket {
  private connectionId: string | null = null;
  private unlisten: UnlistenFn[] = [];
  private closedByUser = false;

  constructor(
    private readonly url: string,
    private readonly origin: string,
    private readonly handlers: TauriWebSocketHandlers,
  ) {
    void this.connect();
  }

  private async connect() {
    let id: string;
    try {
      id = await invoke<string>("ws_connect", { url: this.url, origin: this.origin });
    } catch (error) {
      this.handlers.onError?.(error instanceof Error ? error.message : String(error));
      this.handlers.onClose?.();
      return;
    }

    if (this.closedByUser) {
      void invoke("ws_close", { connectionId: id }).catch(() => {});
      return;
    }

    this.connectionId = id;

    this.unlisten.push(
      await listen<{ connectionId: string; data: string }>(`ws-message://${id}`, (event) => {
        this.handlers.onMessage?.(event.payload.data);
      }),
    );
    this.unlisten.push(
      await listen<{ connectionId: string }>(`ws-closed://${id}`, () => {
        this.teardownListeners();
        this.handlers.onClose?.();
      }),
    );
    this.unlisten.push(
      await listen<{ connectionId: string; message: string }>(`ws-error://${id}`, (event) => {
        this.handlers.onError?.(event.payload.message);
      }),
    );

    this.handlers.onOpen?.();
  }

  send(data: string): void {
    if (!this.connectionId) return;
    void invoke("ws_send", { connectionId: this.connectionId, message: data }).catch((error) => {
      this.handlers.onError?.(error instanceof Error ? error.message : String(error));
    });
  }

  close(): void {
    this.closedByUser = true;
    this.teardownListeners();
    if (this.connectionId) {
      void invoke("ws_close", { connectionId: this.connectionId }).catch(() => {});
    }
  }

  private teardownListeners() {
    this.unlisten.forEach((fn) => fn());
    this.unlisten = [];
  }
}
