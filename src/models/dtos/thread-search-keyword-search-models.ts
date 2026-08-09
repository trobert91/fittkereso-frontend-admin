import { BasePageResult } from "./base-page-result";
import { ThreadPlatform } from "./thread-search-task-search-models";

export { ThreadPlatform };

export interface ThreadSearchKeywordCategory {
  id: string;
  name: string;
}

export interface ThreadSearchKeyword {
  id: string;
  keyword: string;
  platform: ThreadPlatform;
  categoryId: string;
  category?: ThreadSearchKeywordCategory | null;
  lastSearchedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ThreadSearchKeywordSearchParams {
  categoryIds?: string[];
  platforms?: ThreadPlatform[];

  page?: number;
  pageSize?: number;

  sort?:
    | "keyword"
    | "platform"
    | "lastSearchedAt"
    | "createdAt"
    | "updatedAt";
  order?: "ASC" | "DESC";
}

export type ThreadSearchKeywordSearchResult =
  BasePageResult<ThreadSearchKeyword> & {
    categoryIds?: string[];
    platforms?: ThreadPlatform[];
  };
