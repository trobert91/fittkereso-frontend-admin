import { CommentStatus } from "../enums/comment-enums";
import { Depth, ExperienceType, Intent, Sentiment } from "../enums/review-enums";
import { StructuredSpec } from "../product-specs";
import { Evidence, Quote } from "../thread-extraction-models";

export interface UpdateCommentStatusDto {
  status: CommentStatus;
}

export interface UpdateCommentDto {
  productReferences: UpdateProductReferenceDto[];
}

export interface UpdateResolvedModelDto {
  id: string;
}

export interface UpdateProductReferenceCandidateDto {
  modelId: string;
  confidence?: number;
  isPrimary?: boolean;
}

export interface UpdateProductReferenceDto {
  id?: string;
  enabled?: boolean;
  /** Pick a specific ProductModel as the primary candidate. The backend wipes
   *  any existing candidate set and writes a single primary candidate. */
  resolvedModel?: UpdateResolvedModelDto;
  /** Full candidate set — when present, replaces the candidate list on the
   *  server. Weights are softmax-derived from each entry's `confidence`. Empty
   *  array clears the candidate set (unresolved). Wins over `resolvedModel`. */
  candidates?: UpdateProductReferenceCandidateDto[];
  quotes?: Quote[];
  sentiment?: Sentiment;
  relevance?: number;
  intents?: Intent[];
  experience?: ExperienceType;
  depth?: Depth;
  specs?: StructuredSpec[] | null;
  /** Reference-level feature evidence; empty array clears, omit to leave untouched. */
  features?: Evidence[] | null;
  /** Reference-level use-case evidence; empty array clears, omit to leave untouched. */
  useCases?: Evidence[] | null;
}
