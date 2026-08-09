import { BasePageResult } from "./base-page-result";

export enum TaskStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  DONE = "done",
  FAILED = "failed",
}

export enum QueueName {
  ThreadProcess = "thread-process",
  ThreadSearch = "thread-search",
  ProductSourceSync = "product-source-sync",
}

export interface Task {
  id: string;
  queue: QueueName;
  payload?: unknown;
  status: TaskStatus;
  attempts: number;
  scheduledAt?: string | null;
  lastRunAt?: string;
  lockedAt?: string;
  error?: unknown;
  executionTimeInSec?: number;
  deleteAfterSuccess: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskSearchParams {
  statuses?: TaskStatus[];
  queues?: QueueName[];

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

export type TaskSearchResult = BasePageResult<Task> & {
  statuses?: TaskStatus[];
  queues?: QueueName[];
};
