import { BasePageResult } from "./base-page-result";
import { Review } from "../review";
import { Depth, ExperienceType, Intent, Sentiment } from "../enums/review-enums";

export interface ReviewSearchParams {
  searchTerm?: string;
  sentiments?: Sentiment[];
  intents?: Intent[];
  experiences?: ExperienceType[];
  depths?: Depth[];
  platforms?: string[];
  categoryIds?: string[];
  productId?: string;
  productSlug?: string;
  userId?: string;
  enabled?: boolean;
  includeDeleted?: boolean;
  minReviewScore?: number;
  dateRange?: [string | null, string | null];

  page?: number;
  pageSize?: number;

  sort?:
    | "reviewScore"
    | "totalUpvotes"
    | "totalDownvotes"
    | "sentiment"
    | "experience"
    | "depth"
    | "externalCreationTs"
    | "createdAt"
    | "updatedAt"
    | "partCount";
  order?: "ASC" | "DESC";
}

export type ReviewSearchResult = BasePageResult<Review>;
