import { BaseEntity } from "./base-entity";
import { CommentModeration } from "./comment-moderation";
import { CommentStatus } from "./enums/comment-enums";
import { ProductReference } from "./product-reference";
import { Review } from "./review";
import { Thread } from "./thread";
import { ValidationIssue } from "./validation-issue";

export interface UserCommentContext {
  /** Comment-level validation issues — concerns that span multiple refs
   *  (e.g. `duplicate_model`). Per-ref issues live on
   *  `ProductReference.context.issues`. */
  issues?: ValidationIssue[];
  [key: string]: unknown;
}

export interface CommentMedia {
  type: 'image' | 'link';
  url: string;
  content?: string;
}

export interface UserComment extends BaseEntity {
  thread: Thread;
  parent?: UserComment;
  externalId: string;
  authorId?: string;
  authorName?: string;
  url?: string;
  body: string;
  bodyHtml: string | null;
  upvotes: number;
  downvotes: number;
  externalCreationTs?: Date;
  reviews?: Review[];
  productReferences?: ProductReference[];
  status: CommentStatus;
  lastProcessedStatus?: CommentStatus | null;
  relevance?: number;
  issueSeverity?: number;
  openIssueSeverity?: number;
  moderationPriority?: number;
  moderations?: CommentModeration[];
  reviewConfidence?: number;
  lastReviewStatus?: CommentStatus | null;
  reviewProcessingTs?: Date | null;
  validationDecision?: 'approved' | 'in_review' | 'deleted';
  context?: UserCommentContext;
  media?: CommentMedia[];

  bucket?: number;
  validated?: boolean;
  children?: UserComment[];
  checkedByUserId?: string[];

  loading?: boolean;
  originalState?: UserComment;
}
