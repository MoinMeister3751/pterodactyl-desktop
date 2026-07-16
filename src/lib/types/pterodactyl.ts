/**
 * Typdefinitionen für die Pterodactyl **Client API** (`/api/client/...`).
 * Basierend auf der offiziellen API-Dokumentation (https://dashflo.net/docs/api/pterodactyl/v1)
 * und dem Verhalten von Panel 1.11+. Felder, die je nach Panel-Version fehlen können,
 * sind als optional markiert – die App behandelt sie defensiv (siehe lib/api/clientApi.ts).
 */

export type ServerPowerState = "running" | "starting" | "stopping" | "offline";
export type PowerSignal = "start" | "stop" | "restart" | "kill";

/** Grobstatus, wie er in der Serverliste (attributes.status) auftaucht, wenn != null. */
export type ServerLifecycleStatus =
  | "installing"
  | "install_failed"
  | "reinstall_failed"
  | "suspended"
  | "restoring_backup"
  | null;

export interface ServerLimits {
  memory: number;
  swap: number;
  disk: number;
  io: number;
  cpu: number;
  threads: string | null;
  oom_disabled?: boolean;
}

export interface FeatureLimits {
  databases: number;
  allocations: number;
  backups: number;
}

export interface AllocationAttributes {
  id: number;
  ip: string;
  ip_alias: string | null;
  port: number;
  notes: string | null;
  is_default: boolean;
}

export interface EggVariableAttributes {
  name: string;
  description: string;
  env_variable: string;
  default_value: string;
  server_value: string;
  is_editable: boolean;
  is_required?: boolean;
  rules: string;
}

export interface ServerAttributes {
  server_owner: boolean;
  identifier: string;
  internal_id: number;
  uuid: string;
  name: string;
  node: string;
  is_node_under_maintenance: boolean;
  sftp_details: {
    ip: string;
    port: number;
  };
  description: string;
  limits: ServerLimits;
  invocation: string;
  docker_image: string;
  egg_features: string[];
  feature_limits: FeatureLimits;
  status: ServerLifecycleStatus;
  is_suspended: boolean;
  is_installing: boolean;
  is_transferring: boolean;
  relationships?: {
    allocations?: {
      object: "list";
      data: Array<{ object: "allocation"; attributes: AllocationAttributes }>;
    };
    variables?: {
      object: "list";
      data: Array<{ object: "egg_variable"; attributes: EggVariableAttributes }>;
    };
  };
}

export interface ServerResourceUsage {
  memory_bytes: number;
  cpu_absolute: number;
  disk_bytes: number;
  network_rx_bytes: number;
  network_tx_bytes: number;
  uptime: number;
}

export interface ServerResourcesAttributes {
  current_state: ServerPowerState;
  is_suspended: boolean;
  resources: ServerResourceUsage;
}

export interface FileObjectAttributes {
  name: string;
  mode: string;
  mode_bits: string;
  size: number;
  is_file: boolean;
  is_symlink: boolean;
  is_editable?: boolean;
  mimetype: string;
  created_at: string;
  modified_at: string;
}

export interface BackupAttributes {
  uuid: string;
  name: string;
  ignored_files: string[];
  is_successful: boolean;
  is_locked: boolean;
  checksum: string | null;
  bytes: number;
  created_at: string;
  completed_at: string | null;
}

export interface StartupMeta {
  startup_command: string;
  docker_images: Record<string, string>;
  raw_startup_command?: string;
}

export interface ActivityLogAttributes {
  id: string;
  batch: string | null;
  event: string;
  is_api: boolean;
  ip: string | null;
  description: string | null;
  properties: Record<string, unknown>;
  has_additional_metadata: boolean;
  timestamp: string;
  relationships?: {
    actor?: {
      object: "user";
      attributes: { username: string; email: string };
    } | null;
  };
}

export interface WebsocketCredentials {
  token: string;
  socket: string;
}

export interface AccountAttributes {
  id: number;
  admin: boolean;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  language: string;
}

/** Console-Zeilen, wie sie im UI gerendert werden (nach Client-seitigem Parsing). */
export type ConsoleLineKind = "output" | "input" | "system" | "warning" | "error";

export interface ConsoleLine {
  id: string;
  kind: ConsoleLineKind;
  text: string;
  timestamp: number;
}

/** Nachrichten, die Wings über den WebSocket sendet. */
export interface WingsSocketMessage {
  event:
    | "auth success"
    | "console output"
    | "status"
    | "stats"
    | "token expiring"
    | "token expired"
    | "daemon error"
    | "daemon message"
    | "install output"
    | "install started"
    | "install completed"
    | "backup completed"
    | "backup restore completed"
    | "jwt error"
    | string;
  args?: string[];
}
