import { BasePageResult } from "./base-page-result";
import { ProductSourceConfig, ProductSourceType } from "../product-source";
import type { Seller } from "../seller";
import type {
  ProductSourceAction,
  ProductSourceVersion,
} from "./product-source-history-models";

export { ProductSourceType };
export type { ProductSourceConfig };

export interface ProductSource {
  id: string;
  name: string;
  // Only populated by the admin details route, which joins the relation; the
  // search route leaves it out.
  seller?: Seller | null;
  config?: ProductSourceConfig;
  /**
   * The config history and audit trail, newest first.
   *
   * Only populated by the admin details, update and restore routes — the
   * search route leaves them out, like `seller`. They travel with the source
   * so the details page renders everything from one response, and a save
   * answers with the history it just changed.
   */
  versions?: ProductSourceVersion[];
  actions?: ProductSourceAction[];
  schedulingEnabled: boolean;
  processingEnabled: boolean;
  priority: number;
  maxConcurrent: number;
  requestsPerHour: number;
  lastRunAt?: string | null;
  fullSyncInterval?: string | null;
  nextFullSyncAt?: string | null;
  lastFullSyncAt?: string | null;
  incrementalSyncInterval?: string | null;
  nextIncrementalSyncAt?: string | null;
  lastIncrementalSyncAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductSourceSearchParams {
  searchTerm?: string;
  schedulingEnabled?: boolean;
  types?: ProductSourceType[];

  page?: number;
  pageSize?: number;

  sort?:
    | "name"
    | "schedulingEnabled"
    | "processingEnabled"
    | "priority"
    | "maxConcurrent"
    | "requestsPerHour"
    | "lastRunAt"
    | "fullSyncInterval"
    | "nextFullSyncAt"
    | "lastFullSyncAt"
    | "incrementalSyncInterval"
    | "nextIncrementalSyncAt"
    | "lastIncrementalSyncAt"
    | "createdAt"
    | "updatedAt";
  order?: "ASC" | "DESC";
}

export type ProductSourceSearchResult = BasePageResult<ProductSource> & {
  searchTerm?: string;
  schedulingEnabled?: boolean;
  types?: ProductSourceType[];
};
