import { BasePageResult } from "./base-page-result";
import { TaskStatus } from "./task-search-models";
import { ProductSourceType } from "../product-source";

export { TaskStatus };
export { ProductSourceType };

export enum ScrapeQueueName {
  ScrapeProductList = "scrape-product-list",
  ScrapeProductDetails = "scrape-product-details",
}

export interface ScrapeTaskProduct {
  id: string;
  displayName: string;
  brand?: { name: string };
}

export interface ScrapeTaskSource {
  id: string;
  name: string;
  type: string;
}

export interface ScrapeTask {
  id: string;
  queue: ScrapeQueueName;
  source: ScrapeTaskSource;
  product?: ScrapeTaskProduct | null;
  url: string;
  status: TaskStatus;
  attempts: number;
  scheduledAt?: string | null;
  lastRunAt?: string;
  lockedAt?: string;
  error?: unknown;
  resolutionContext?: unknown;
  executionTimeInSec?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ScrapeTaskSearchParams {
  statuses?: TaskStatus[];
  queues?: ScrapeQueueName[];
  sourceTypes?: ProductSourceType[];

  page?: number;
  pageSize?: number;

  sort?:
    | "queue"
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

export type ScrapeTaskSearchResult = BasePageResult<ScrapeTask> & {
  statuses?: TaskStatus[];
  queues?: ScrapeQueueName[];
  sourceTypes?: ProductSourceType[];
};
