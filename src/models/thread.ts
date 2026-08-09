import { BaseEntity } from "./base-entity";
import { ThreadSource, ThreadStatus } from "./enums/thread-enums";
import { ThreadProductCategory } from "./thread-product-category";
import { ProductMention } from "./thread-extraction-models";
import { ThreadRun } from "./dtos/thread-run-search-models";
import { CommentMedia, UserComment } from "./user-comment";

export type RelevanceRating = "low" | "medium" | "high";

export interface RelevanceCriteriaRatings {
  experienceDensity: RelevanceRating;
  productSpecificity: RelevanceRating;
  featureDiscussion: RelevanceRating;
  buyerResearchValue: RelevanceRating;
}

export interface RelevanceScoreBreakdown {
  llmScore: number;
  estimationScore: number;
  commentCountFactor: number;
  recencyFactor: number;
}

export interface RelevanceResult {
  criteria: RelevanceCriteriaRatings;
  weightedScore: number; // 1-100, composite
  breakdown?: RelevanceScoreBreakdown;
}

export interface Thread extends BaseEntity {
  externalId: string;
  source: ThreadSource;
  title: string;
  topic: string;
  categories?: ThreadProductCategory[];
  author?: string;
  url: string;
  text: string;
  comments?: UserComment[];
  commentTree?: CommentTree;
  relevanceEstimation?: number;
  relevance?: number;
  relevanceResult?: RelevanceResult;
  commentCount?: number;
  lastSynced?: Date;
  threadCreatedAt?: Date;
  status: ThreadStatus;
  markedForSync?: boolean;
  processRunning?: boolean;
  opSummary?: string;
  media?: CommentMedia[];
  runs?: ThreadRun[];
}

export interface CommentTree {
  type: "reddit" | "youtube";
  rootNodes: CommentNode[];

  map: Record<string, CommentNode>;
}

export interface CommentNode {
  id: string;
  parentId?: string;
  authorId: string;
  authorName: string;
  url: string;
  body: string;
  bodyHtml: string | null;
  upvotes: number;
  downvotes: number;
  createdUtc: number;
  products?: ProductMention[];
  extracted?: boolean;
  children: CommentNode[];
}
