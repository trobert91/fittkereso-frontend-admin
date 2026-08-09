import { BasePageResult } from "./base-page-result";
import { UserComment } from "../user-comment";
import { CommentStatus } from "../enums/comment-enums";
import { Depth, ExperienceType, Sentiment } from "../enums/review-enums";

export interface CommentSearchParams {
  searchTerm?: string;
  categoryIds?: string[];
  threadId?: string;
  externalId?: string;
  authorId?: string;
  parentExternalId?: string;
  statuses?: CommentStatus[];
  sentiments?: Sentiment[];
  experiences?: ExperienceType[];
  depths?: Depth[];
  reviewedBy?: string[];

  reviewer?: string;
  dateRange?: [string | null, string | null];

  page?: number;
  pageSize?: number;

  sort?: "relevance" | "status" | "lastSynced" | "createdAt" | "updatedAt" | "reviewScore" | "moderationPriority";
  order?: "ASC" | "DESC";
}

export type CommentSearchResult = BasePageResult<UserComment> & {
  statuses?: CommentStatus[];
  sort?: "relevance" | "status" | "lastSynced" | "createdAt" | "updatedAt" | "reviewScore" | "moderationPriority";
};
