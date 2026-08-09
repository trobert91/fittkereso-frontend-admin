import { ThreadStatus } from "../enums/thread-enums";
import { Thread } from "../thread";
import { BasePageResult } from "./base-page-result";

export interface ThreadSearchParams {
  searchTerm?: string;
  externalId?: string;
  source?: string;
  topic?: string;
  statuses?: ThreadStatus[];
  categoryIds?: string[];
  filterByUncategorized?: boolean;

  page?: number;
  pageSize?: number;

  sort?:
    | "title"
    | "topic"
    | "relevance"
    | "relevanceEstimation"
    | "commentCount"
    | "status"
    | "lastSynced"
    | "createdAt"
    | "updatedAt";
  order?: "ASC" | "DESC";
}

export type ThreadSearchResult = BasePageResult<Thread> & {
  statuses?: ThreadStatus[];

  sort?:
    | "title"
    | "topic"
    | "relevance"
    | "relevanceEstimation"
    | "commentCount"
    | "status"
    | "lastSynced"
    | "createdAt"
    | "updatedAt";
};
