/**
 * Generische Umschläge, wie sie die Pterodactyl-API (Client + Application)
 * für praktisch jede Ressource verwendet (JSON:API-artig).
 */
export interface ApiObject<TType extends string, TAttributes> {
  object: TType;
  attributes: TAttributes;
}

export interface ApiListResponse<TType extends string, TAttributes> {
  object: "list";
  data: Array<ApiObject<TType, TAttributes>>;
  meta?: {
    pagination?: PaginationMeta;
    [key: string]: unknown;
  };
}

export interface PaginationMeta {
  total: number;
  count: number;
  per_page: number;
  current_page: number;
  total_pages: number;
  links: Record<string, string>;
}

export interface PterodactylApiErrorEntry {
  code: string;
  status: string;
  detail: string;
  meta?: Record<string, unknown>;
}

export interface PterodactylApiErrorBody {
  errors: PterodactylApiErrorEntry[];
}
