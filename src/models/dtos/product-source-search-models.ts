import { BasePageResult } from "./base-page-result";
import {
  ProductSourceConfig,
  ProductSourceFetchMode,
  ProductSourceType,
} from "../product-source";
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
  /** Import type — fixed at creation. */
  type: ProductSourceType;
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
  // Unique per seller: the higher one overwrites the lower one field by field.
  priority: number;
  // Off: the source only contributes to offers an identifying source of the
  // seller created. Every seller keeps at least one identifying source.
  identifiesProducts: boolean;
  // Feed sources only: a complete run may remove the offers it did not see.
  hasAllProducts: boolean;
  // Through Zyte (paid) or directly from the shop (free, with its consent).
  fetchMode: ProductSourceFetchMode;
  maxConcurrent: number;
  requestsPerHour: number;
  lastRunAt?: string | null;
  frequency?: string | null;
  // How old a known listing's detail import may get before its detail page is
  // fetched again (an ms string, "60 days" by default). Admin details only.
  detailRefreshInterval?: string;
  nextRunAt?: string | null;
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
    | "frequency"
    | "nextRunAt"
    | "createdAt"
    | "updatedAt";
  order?: "ASC" | "DESC";
}

export type ProductSourceSearchResult = BasePageResult<ProductSource> & {
  searchTerm?: string;
  schedulingEnabled?: boolean;
  types?: ProductSourceType[];
};
