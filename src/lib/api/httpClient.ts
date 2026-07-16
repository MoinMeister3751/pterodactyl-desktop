import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { ApiError, statusToErrorKind } from "./errors";
import type { PterodactylApiErrorBody } from "@/lib/types/api";
import { useDebugLogStore } from "@/store/useDebugLogStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { redactSecrets } from "@/lib/utils/validation";

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** Rohtext-Body (z. B. für das Schreiben von Dateiinhalten) statt JSON. */
  rawBody?: string;
  query?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
  timeoutMs?: number;
  /** "json" (Standard), "text" für Rohtext (z. B. Dateiinhalte), "none" für 204-Antworten. */
  responseType?: "json" | "text" | "none";
}

const DEFAULT_TIMEOUT_MS = 15_000;

/**
 * Schlanker HTTP-Client für die Pterodactyl-API. Läuft über das Tauri-HTTP-Plugin,
 * damit Requests nicht der Browser-CORS-Policy des Webviews unterliegen – die
 * Panel-URL ist zur Buildzeit unbekannt (Nutzereingabe) und Panels setzen i. d. R.
 * keine CORS-Header für beliebige Origins.
 */
export class PterodactylHttpClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
  ) {}

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = this.buildUrl(path, options.query);
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    );

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      Accept: "application/json",
    };
    let body: string | undefined;
    if (options.rawBody !== undefined) {
      body = options.rawBody;
      headers["Content-Type"] = "text/plain";
    } else if (options.body !== undefined) {
      body = JSON.stringify(options.body);
      headers["Content-Type"] = "application/json";
    }

    try {
      const response = await tauriFetch(url, {
        method: options.method ?? "GET",
        headers,
        body,
        signal: controller.signal,
      });

      if (useSettingsStore.getState().debugMode) {
        useDebugLogStore
          .getState()
          .addLog("info", `${options.method ?? "GET"} ${redactSecrets(url)} -> ${response.status}`);
      }

      if (!response.ok) {
        await this.throwForErrorResponse(response, url, options.method ?? "GET");
      }

      if (options.responseType === "none" || response.status === 204) {
        return undefined as T;
      }
      if (options.responseType === "text") {
        return (await response.text()) as unknown as T;
      }

      const text = await response.text();
      if (!text) return undefined as T;
      return JSON.parse(text) as T;
    } catch (error) {
      if (error instanceof ApiError) {
        // Bereits in throwForErrorResponse() geloggt (HTTP-Fehler) - hier nicht doppelt loggen.
        throw error;
      }
      if (error instanceof DOMException && error.name === "AbortError") {
        const timeoutError = new ApiError("Zeitüberschreitung bei der Anfrage.", "timeout");
        useDebugLogStore.getState().addLog("error", redactSecrets(`${options.method ?? "GET"} ${url}: timeout`));
        throw timeoutError;
      }
      useDebugLogStore
        .getState()
        .addLog("error", redactSecrets(`${options.method ?? "GET"} ${url}: ${error instanceof Error ? error.message : "Netzwerkfehler"}`));
      throw new ApiError(
        error instanceof Error ? error.message : "Netzwerkfehler",
        "network",
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  get<T>(path: string, options?: Omit<RequestOptions, "method">) {
    return this.request<T>(path, { ...options, method: "GET" });
  }
  post<T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) {
    return this.request<T>(path, { ...options, method: "POST", body });
  }
  put<T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) {
    return this.request<T>(path, { ...options, method: "PUT", body });
  }
  patch<T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) {
    return this.request<T>(path, { ...options, method: "PATCH", body });
  }
  delete<T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) {
    return this.request<T>(path, { ...options, method: "DELETE", body });
  }

  private buildUrl(path: string, query?: RequestOptions["query"]): string {
    const url = new URL(`${this.baseUrl}${path}`);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) url.searchParams.set(key, String(value));
      }
    }
    return url.toString();
  }

  private async throwForErrorResponse(response: Response, url: string, method: string): Promise<never> {
    const kind = statusToErrorKind(response.status);
    let detail = response.statusText;
    try {
      const parsed = (await response.json()) as PterodactylApiErrorBody;
      if (parsed.errors?.length) {
        detail = parsed.errors.map((e) => e.detail).join(" ");
      }
    } catch {
      // Antwort war kein JSON (z. B. HTML-Fehlerseite eines Reverse-Proxys) - Statustext behalten.
    }
    useDebugLogStore
      .getState()
      .addLog("error", redactSecrets(`${method} ${url} -> HTTP ${response.status}: ${detail}`));
    throw new ApiError(detail || `HTTP ${response.status}`, kind, response.status);
  }
}
