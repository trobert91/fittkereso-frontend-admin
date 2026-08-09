import { BasePageResult } from "./base-page-result";
import { TaskStatus } from "./task-search-models";

export { TaskStatus };

export enum ThreadPlatform {
  Reddit = "reddit",
  Youtube = "youtube",
}

export interface ThreadSearchTask {
  id: string;
  keyword: string;
  platform: ThreadPlatform;
  categorySlug: string;
  status: TaskStatus;
  attempts: number;
  duplicates: number;
  discovered: number;
  belowRelevance: number;
  scheduledAt?: string | null;
  lastRunAt?: string;
  lockedAt?: string;
  error?: unknown;
  executionTimeInSec?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ThreadSearchTaskSearchParams {
  statuses?: TaskStatus[];
  platforms?: ThreadPlatform[];
  categorySlugs?: string[];

  page?: number;
  pageSize?: number;

  sort?:
    | "keyword"
    | "platform"
    | "categorySlug"
    | "status"
    | "attempts"
    | "duplicates"
    | "discovered"
    | "belowRelevance"
    | "scheduledAt"
    | "lastRunAt"
    | "lockedAt"
    | "executionTimeInSec"
    | "createdAt"
    | "updatedAt";
  order?: "ASC" | "DESC";
}

export type ThreadSearchTaskSearchResult = BasePageResult<ThreadSearchTask> & {
  statuses?: TaskStatus[];
  platforms?: ThreadPlatform[];
  categorySlugs?: string[];
};
