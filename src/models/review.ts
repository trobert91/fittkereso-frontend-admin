import { BaseEntity } from "./base-entity";
import { Depth, ExperienceType, Intent, Sentiment } from "./enums/review-enums";
import { ProductModel } from "./product-model";
import { ProductReferenceCandidate } from "./product-reference-candidate";
import { Quote } from "./thread-extraction-models";

export interface ReviewDetails {
  returned?: boolean;
  defective?: boolean;
  multipleUnits?: boolean;
}

export interface Review extends BaseEntity {
  model: ProductModel;
  userId: string;
  username: string;
  /** Candidates linked to this review. Each carries `candidate.reference`
   *  so the expanded view can still walk back to the source comment. The
   *  highest-weight candidate per comment is the one that contributed to
   *  this review (review-updater picks the winner). */
  candidates?: ProductReferenceCandidate[];
  enabled: boolean;
  sentiment: Sentiment;
  experience: ExperienceType;
  intents: Intent[];
  externalCreationTs?: Date;
  depth?: Depth;
  reviewScore?: number;
  totalQuoteCount?: number;
  partCount?: number;
  totalUpvotes?: number;
  totalDownvotes?: number;
  deletedAt?: Date | null;
  platform?: string;
  quotes?: Quote[] | null;
  reviewDetails?: ReviewDetails | null;
  lastEvaluatedAt?: Date | null;
  loading?: boolean;
}
