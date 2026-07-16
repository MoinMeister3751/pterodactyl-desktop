import { PterodactylHttpClient } from "./httpClient";
import type { ApiListResponse } from "@/lib/types/api";
import type {
  AdminServerAttributes,
  AdminUserAttributes,
  LocationAttributes,
  NodeAttributes,
  NodeLocationLookup,
} from "@/lib/types/application";

/**
 * Typisierter Zugriff auf die Pterodactyl **Application API** (Admin, `ptla_`-Key).
 * Optional: Wird nur genutzt, wenn ein Profil einen Application-API-Key hinterlegt hat.
 * Primärer Zweck in dieser App: Node-/Location-Anreicherung im Dashboard sowie
 * eine schlanke Admin-Übersicht (Nodes, Locations, Nutzer).
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
