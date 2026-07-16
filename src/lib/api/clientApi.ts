import { PterodactylHttpClient } from "./httpClient";
import type { ApiListResponse, ApiObject } from "@/lib/types/api";
import type {
  AccountAttributes,
  ActivityLogAttributes,
  AllocationAttributes,
  BackupAttributes,
  EggVariableAttributes,
  FileObjectAttributes,
  ServerAttributes,
  ServerResourcesAttributes,
  StartupMeta,
  WebsocketCredentials,
} from "@/lib/types/pterodactyl";

/**
 * Typisierter Zugriff auf die Pterodactyl **Client API**. Jede Methode kapselt
 * genau einen Endpunkt, sodass Annahmen über Pfad/Payload an einer Stelle
 * dokumentiert sind. Alle Pfade folgen der offiziellen Client-API (v1).
 */
export class ClientApi {
  constructor(private readonly http: PterodactylHttpClient) {}

  // --- Account -------------------------------------------------------------

  async getAccount(): Promise<AccountAttributes> {
    const res = await this.http.get<ApiObject<"user", AccountAttributes>>("/api/client/account");
    return res.attributes;
  }

  // --- Servers ---------------------------------------------------------------

  async listServers(): Promise<ServerAttributes[]> {
    const res = await this.http.get<ApiListResponse<"server", ServerAttributes>>(
      "/api/client",
      { timeoutMs: 20_000 },
    );
    return res.data.map((d) => d.attributes);
  }

  async getServer(identifier: string): Promise<ServerAttributes> {
    const res = await this.http.get<ApiObject<"server", ServerAttributes>>(
      `/api/client/servers/${identifier}`,
      { query: { include: "allocations,variables" } },
    );
    return res.attributes;
  }

  async getServerResources(identifier: string): Promise<ServerResourcesAttributes> {
    const res = await this.http.get<ApiObject<"stats", ServerResourcesAttributes>>(
      `/api/client/servers/${identifier}/resources`,
    );
    return res.attributes;
  }

  async sendPowerSignal(identifier: string, signal: "start" | "stop" | "restart" | "kill") {
    await this.http.post<void>(
      `/api/client/servers/${identifier}/power`,
      { signal },
      { responseType: "none" },
    );
  }

  async sendCommand(identifier: string, command: string) {
    await this.http.post<void>(
      `/api/client/servers/${identifier}/command`,
      { command },
      { responseType: "none" },
    );
  }

  async getWebsocketCredentials(identifier: string): Promise<WebsocketCredentials> {
    const res = await this.http.get<{ data: WebsocketCredentials }>(
      `/api/client/servers/${identifier}/websocket`,
    );
    return res.data;
  }

  // --- Files -----------------------------------------------------------------

  async listFiles(identifier: string, directory: string): Promise<FileObjectAttributes[]> {
    const res = await this.http.get<ApiListResponse<"file_object", FileObjectAttributes>>(
      `/api/client/servers/${identifier}/files/list`,
      { query: { directory } },
    );
    return res.data.map((d) => d.attributes);
  }

  async getFileContents(identifier: string, file: string): Promise<string> {
    return this.http.get<string>(`/api/client/servers/${identifier}/files/contents`, {
      query: { file },
      responseType: "text",
    });
  }

  async writeFile(identifier: string, file: string, content: string): Promise<void> {
    await this.http.post<void>(
      `/api/client/servers/${identifier}/files/write`,
      undefined,
      { rawBody: content, query: { file }, responseType: "none" },
    );
  }

  async renameFile(identifier: string, root: string, from: string, to: string): Promise<void> {
    await this.http.put<void>(
      `/api/client/servers/${identifier}/files/rename`,
      { root, files: [{ from, to }] },
      { responseType: "none" },
    );
  }

  async deleteFiles(identifier: string, root: string, files: string[]): Promise<void> {
    await this.http.post<void>(
      `/api/client/servers/${identifier}/files/delete`,
      { root, files },
      { responseType: "none" },
    );
  }

  async createFolder(identifier: string, root: string, name: string): Promise<void> {
    await this.http.post<void>(
      `/api/client/servers/${identifier}/files/create-folder`,
      { root, name },
      { responseType: "none" },
    );
  }

  async getDownloadUrl(identifier: string, file: string): Promise<string> {
    const res = await this.http.get<{ attributes: { url: string } }>(
      `/api/client/servers/${identifier}/files/download`,
      { query: { file } },
    );
    return res.attributes.url;
  }

  /** Liefert eine kurzlebige, signierte Upload-URL. Upload erfolgt separat als multipart/form-data POST. */
  async getUploadUrl(identifier: string): Promise<string> {
    const res = await this.http.get<{ attributes: { url: string } }>(
      `/api/client/servers/${identifier}/files/upload`,
    );
    return res.attributes.url;
  }

  // --- Backups -----------------------------------------------------------------

  async listBackups(identifier: string): Promise<BackupAttributes[]> {
    const res = await this.http.get<ApiListResponse<"backup", BackupAttributes>>(
      `/api/client/servers/${identifier}/backups`,
    );
    return res.data.map((d) => d.attributes);
  }

  async createBackup(identifier: string, name?: string): Promise<BackupAttributes> {
    const res = await this.http.post<ApiObject<"backup", BackupAttributes>>(
      `/api/client/servers/${identifier}/backups`,
      name ? { name } : {},
    );
    return res.attributes;
  }

  async getBackupDownloadUrl(identifier: string, backupUuid: string): Promise<string> {
    const res = await this.http.get<{ attributes: { url: string } }>(
      `/api/client/servers/${identifier}/backups/${backupUuid}/download`,
    );
    return res.attributes.url;
  }

  async deleteBackup(identifier: string, backupUuid: string): Promise<void> {
    await this.http.delete<void>(
      `/api/client/servers/${identifier}/backups/${backupUuid}`,
      undefined,
      { responseType: "none" },
    );
  }

  async toggleBackupLock(identifier: string, backupUuid: string): Promise<BackupAttributes> {
    const res = await this.http.post<ApiObject<"backup", BackupAttributes>>(
      `/api/client/servers/${identifier}/backups/${backupUuid}/lock`,
    );
    return res.attributes;
  }

  // --- Startup / Variablen -------------------------------------------------

  async getStartup(
    identifier: string,
  ): Promise<{ variables: EggVariableAttributes[]; meta: StartupMeta }> {
    const res = await this.http.get<
      ApiListResponse<"egg_variable", EggVariableAttributes> & { meta: StartupMeta }
    >(`/api/client/servers/${identifier}/startup`);
    return { variables: res.data.map((d) => d.attributes), meta: res.meta };
  }

  async updateStartupVariable(
    identifier: string,
    key: string,
    value: string,
  ): Promise<EggVariableAttributes> {
    const res = await this.http.put<ApiObject<"egg_variable", EggVariableAttributes>>(
      `/api/client/servers/${identifier}/startup/variable`,
      { key, value },
    );
    return res.attributes;
  }

  /**
   * Wechselt das Docker-Image, sofern der Egg mehrere Images erlaubt (meta.docker_images
   * aus getStartup()). Nicht jedes Panel-Setup gibt Server-Ownern diese Berechtigung frei -
   * schlägt der Request mit 403 fehl, wird das im UI entsprechend abgefangen.
   */
  async updateDockerImage(identifier: string, dockerImage: string): Promise<void> {
    await this.http.put<void>(
      `/api/client/servers/${identifier}/settings/docker-image`,
      { docker_image: dockerImage },
      { responseType: "none" },
    );
  }

  // --- Network / Allocations -------------------------------------------------

  async listAllocations(identifier: string): Promise<AllocationAttributes[]> {
    const res = await this.http.get<ApiListResponse<"allocation", AllocationAttributes>>(
      `/api/client/servers/${identifier}/network/allocations`,
    );
    return res.data.map((d) => d.attributes);
  }

  async setPrimaryAllocation(identifier: string, allocationId: number): Promise<void> {
    await this.http.post<void>(
      `/api/client/servers/${identifier}/network/allocations/${allocationId}/primary`,
      undefined,
      { responseType: "none" },
    );
  }

  async updateAllocationNotes(
    identifier: string,
    allocationId: number,
    notes: string,
  ): Promise<void> {
    await this.http.post<void>(
      `/api/client/servers/${identifier}/network/allocations/${allocationId}`,
      { notes },
      { responseType: "none" },
    );
  }

  // --- Activity ----------------------------------------------------------------

  async listServerActivity(identifier: string, page = 1): Promise<ActivityLogAttributes[]> {
    const res = await this.http.get<ApiListResponse<"activity_log", ActivityLogAttributes>>(
      `/api/client/servers/${identifier}/activity`,
      { query: { page } },
    );
    return res.data.map((d) => d.attributes);
  }
}
