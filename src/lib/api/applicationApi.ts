import { PterodactylHttpClient } from "./httpClient";
import type { ApiListResponse, ApiObject } from "@/lib/types/api";
import type {
  AdminServerAttributes,
  AdminUserAttributes,
  CreateServerPayload,
  CreateUserPayload,
  EggAttributes,
  LocationAttributes,
  NestAttributes,
  NodeAttributes,
  NodeLocationLookup,
} from "@/lib/types/application";

/**
 * Typisierter Zugriff auf die Pterodactyl **Application API** (Admin, `ptla_`-Key).
 * Optional: Wird nur genutzt, wenn ein Profil einen Application-API-Key hinterlegt hat.
 * Deckt die Admin-Ansicht ab: Node-/Location-Anreicherung im Dashboard, eine
 * Panel-weite Übersicht (Nodes, Locations, Nutzer, alle Server) sowie Erstellen/
 * Löschen von Nutzern und Servern.
 */
export class ApplicationApi {
  constructor(private readonly http: PterodactylHttpClient) {}

  async listNodes(): Promise<NodeAttributes[]> {
    const res = await this.http.get<ApiListResponse<"node", NodeAttributes>>(
      "/api/application/nodes",
      { query: { per_page: 200 } },
    );
    return res.data.map((d) => d.attributes);
  }

  async listLocations(): Promise<LocationAttributes[]> {
    const res = await this.http.get<ApiListResponse<"location", LocationAttributes>>(
      "/api/application/locations",
      { query: { per_page: 200 } },
    );
    return res.data.map((d) => d.attributes);
  }

  async listUsers(): Promise<AdminUserAttributes[]> {
    const res = await this.http.get<ApiListResponse<"user", AdminUserAttributes>>(
      "/api/application/users",
      { query: { per_page: 200 } },
    );
    return res.data.map((d) => d.attributes);
  }

  async listServers(): Promise<AdminServerAttributes[]> {
    const res = await this.http.get<ApiListResponse<"server", AdminServerAttributes>>(
      "/api/application/servers",
      { query: { per_page: 200 } },
    );
    return res.data.map((d) => d.attributes);
  }

  // --- Nutzerverwaltung --------------------------------------------------------

  async createUser(payload: CreateUserPayload): Promise<AdminUserAttributes> {
    const res = await this.http.post<ApiObject<"user", AdminUserAttributes>>(
      "/api/application/users",
      payload,
    );
    return res.attributes;
  }

  async deleteUser(userId: number): Promise<void> {
    await this.http.delete<void>(`/api/application/users/${userId}`, undefined, {
      responseType: "none",
    });
  }

  // --- Nests / Eggs (für Server-Erstellung) -------------------------------------

  async listNests(): Promise<NestAttributes[]> {
    const res = await this.http.get<ApiListResponse<"nest", NestAttributes>>(
      "/api/application/nests",
      { query: { per_page: 200 } },
    );
    return res.data.map((d) => d.attributes);
  }

  async listEggs(nestId: number): Promise<EggAttributes[]> {
    const res = await this.http.get<ApiListResponse<"egg", EggAttributes>>(
      `/api/application/nests/${nestId}/eggs`,
      { query: { include: "variables" } },
    );
    return res.data.map((d) => d.attributes);
  }

  // --- Serververwaltung ----------------------------------------------------------

  async createServer(payload: CreateServerPayload): Promise<AdminServerAttributes> {
    const res = await this.http.post<ApiObject<"server", AdminServerAttributes>>(
      "/api/application/servers",
      payload,
    );
    return res.attributes;
  }

  /**
   * Löscht einen Server. `force=true` erzwingt das Löschen auch, wenn Wings den
   * zugehörigen Node/Container gerade nicht erreichen kann (z. B. Node offline).
   */
  async deleteServer(serverId: number, force = false): Promise<void> {
    await this.http.delete<void>(
      `/api/application/servers/${serverId}${force ? "/force" : ""}`,
      undefined,
      { responseType: "none" },
    );
  }

  /** Baut eine Node-Name -> Location-Lookup-Tabelle für die Dashboard-Anreicherung. */
  async buildNodeLocationLookup(): Promise<Map<string, NodeLocationLookup>> {
    const [nodes, locations] = await Promise.all([this.listNodes(), this.listLocations()]);
    const locationsById = new Map(locations.map((l) => [l.id, l]));
    const lookup = new Map<string, NodeLocationLookup>();
    for (const node of nodes) {
      const location = locationsById.get(node.location_id);
      lookup.set(node.name, {
        nodeName: node.name,
        locationShort: location?.short ?? null,
        locationLong: location?.long ?? null,
      });
    }
    return lookup;
  }
}
