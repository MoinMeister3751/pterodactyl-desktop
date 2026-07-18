import type { AdminServerAttributes, NodeAttributes } from "@/lib/types/application";
import type { ServerAttributes } from "@/lib/types/pterodactyl";

/**
 * Bildet einen Application-API-Server (panelweite Admin-Sicht) auf die von
 * ServerCard/ServerList erwartete Client-API-Form ab, damit das Dashboard im
 * "Alle Server"-Modus dieselbe Kartenansicht wiederverwenden kann. Einige Felder
 * (SFTP, Docker-Image, Egg-Features) sind über die Application API nicht
 * verfügbar und bleiben leer - live Ressourcen (CPU/RAM) sind für fremde Server
 * über die Client-API grundsätzlich nicht abrufbar (nur der Besitzer/Subuser
 * darf das), die Karte zeigt dort bewusst "—" statt falscher Werte.
 */
export function adaptAdminServer(
  server: AdminServerAttributes,
  nodesById: Map<number, NodeAttributes>,
): ServerAttributes {
  return {
    server_owner: false,
    identifier: server.identifier,
    internal_id: server.id,
    uuid: server.uuid,
    name: server.name,
    node: nodesById.get(server.node)?.name ?? `Node #${server.node}`,
    is_node_under_maintenance: false,
    sftp_details: { ip: "", port: 0 },
    description: server.description,
    limits: {
      memory: server.limits.memory,
      swap: server.limits.swap,
      disk: server.limits.disk,
      io: server.limits.io,
      cpu: server.limits.cpu,
      threads: null,
    },
    invocation: "",
    docker_image: "",
    egg_features: [],
    feature_limits: server.feature_limits,
    status: (server.status as ServerAttributes["status"]) ?? null,
    is_suspended: server.suspended,
    is_installing: server.status === "installing",
    is_transferring: false,
  };
}
