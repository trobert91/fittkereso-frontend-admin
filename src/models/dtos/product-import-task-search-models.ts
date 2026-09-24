import { BasePageResult } from "./base-page-result";
import { TaskStatus } from "./task-search-models";
import { ProductSourceType } from "../product-source";

export { TaskStatus };
export { ProductSourceType };

/** Mirrors the backend: 0–100, higher runs first. */
export const MIN_IMPORT_TASK_PRIORITY = 0;
export const MAX_IMPORT_TASK_PRIORITY = 100;
/** What a task a person creates runs at unless they choose otherwise. */
export const MANUAL_IMPORT_TASK_PRIORITY = 90;

export enum ProductImportTaskKind {
  ListPage = "list_page",
  DetailPage = "detail_page",
  /** One Árukereső feed row; queued by its feed run, never by hand. */
  FeedEntry = "feed_entry",
}

export interface ProductImportTaskProduct {
  id: string;
  displayName: string;
  brand?: { name: string };
}

export interface ProductImportTaskSource {
  id: string;
  name: string;
  type: string;
}

export interface ProductImportTask {
  id: string;
  kind: ProductImportTaskKind;
  priority: number;
  source: ProductImportTaskSource;
  product?: ProductImportTaskProduct | null;
  url: string;
  status: TaskStatus;
  attempts: number;
  scheduledAt?: string | null;
  lastRunAt?: string;
  lockedAt?: string;
  error?: unknown;
  identityDecision?: unknown;
  executionTimeInSec?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImportTaskSearchParams {
  statuses?: TaskStatus[];
  kinds?: ProductImportTaskKind[];
  sourceTypes?: ProductSourceType[];

  page?: number;
  pageSize?: number;

  sort?:
    | "kind"
    | "priority"
    | "status"
    | "attempts"
    | "scheduledAt"
    | "lastRunAt"
    | "lockedAt"
    | "executionTimeInSec"
    | "createdAt"
    | "updatedAt";
  order?: "ASC" | "DESC";
}

export type ProductImportTaskSearchResult = BasePageResult<ProductImportTask> & {
  statuses?: TaskStatus[];
  kinds?: ProductImportTaskKind[];
  sourceTypes?: ProductSourceType[];
};
