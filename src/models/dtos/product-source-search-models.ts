import { BasePageResult } from "./base-page-result";
import { ProductSourceType } from "../product-source";

export { ProductSourceType };

export interface ProductSource {
  id: string;
  name: string;
  type: ProductSourceType;
  config?: unknown;
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
    | "type"
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
