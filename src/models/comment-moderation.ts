import type { CommentStatus } from "./enums/comment-enums";

export type CommentModerationSource = "system" | "admin" | "validation_llm";

export interface CommentModeration {
  reviewedBy: string;
  reviewComment?: string;
  suggestedStatus?: CommentStatus;
  createdAt: string;
  source: CommentModerationSource;
}
