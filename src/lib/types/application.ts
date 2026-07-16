/**
 * Typdefinitionen für die Pterodactyl **Application API** (`/api/application/...`).
 * Diese API erfordert einen Admin-Account und einen "ptla_"-Key. Sie ist in dieser
 * App optional: Ist ein Application-API-Key hinterlegt, reichert sie das Dashboard
 * um Node-/Location-Informationen an UND schaltet die Admin-Ansicht frei
 * (siehe features/admin) mit Nodes-, Locations-, Nutzer- und Panel-weiter
 * Server-Übersicht.
 */

export interface LocationAttributes {
  id: number;
  short: string;
  long: string;
  created_at: string;
  updated_at: string;
}

export interface NodeAttributes {
  id: number;
  uuid: string;
  public: boolean;
  name: string;
  description: string | null;
  location_id: number;
  fqdn: string;
  scheme: "http" | "https";
  behind_proxy: boolean;
  maintenance_mode: boolean;
  memory: number;
  memory_overallocate: number;
  disk: number;
  disk_overallocate: number;
  upload_size: number;
  daemon_listen: number;
  daemon_sftp: number;
  daemon_base: string;
}

export interface AdminUserAttributes {
  id: number;
  external_id: string | null;
  uuid: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  language: string;
  root_admin: boolean;
  "2fa": boolean;
  created_at: string;
}

export interface AdminServerAttributes {
  id: number;
  external_id: string | null;
  uuid: string;
  identifier: string;
  name: string;
  description: string;
  status: string | null;
  suspended: boolean;
  limits: {
    memory: number;
    swap: number;
    disk: number;
    io: number;
    cpu: number;
  };
  feature_limits: {
    databases: number;
    allocations: number;
    backups: number;
  };
  node: number;
  allocation: number;
  user: number;
  egg: number;
  created_at: string;
}

/** Angereicherter Datensatz: Node-Name -> Location, clientseitig zusammengeführt. */
export interface NodeLocationLookup {
  nodeName: string;
  locationShort: string | null;
  locationLong: string | null;
}
