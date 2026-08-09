import { BaseEntity } from "./base-entity";
import { Depth, ExperienceType, Intent, Sentiment } from "./enums/review-enums";
import { ProductReferenceCandidate } from "./product-reference-candidate";
import { ProductReferenceContext } from "./product-reference-context";
import { ProductSearchContextV2 } from "./product-search-context-v2";
import { StructuredSpec } from "./product-specs";
import { Evidence, Quote } from "./thread-extraction-models";
import { UserComment } from "./user-comment";

export interface ReferenceDetails {
  returned?: boolean;
  defective?: boolean;
  multipleUnits?: boolean;
}

export interface ProductReference extends BaseEntity {
  comment?: UserComment;
  categoryHint?: string;
  quotes?: Quote[];
  sentiment?: Sentiment;
  relevance: number;
  intents?: Intent[];
  experience?: ExperienceType;
  depth?: Depth;
  enabled: boolean;
  flagged: boolean;
  resolutionDeferred: boolean;
  resolutionFinished: boolean;
  issueSeverity?: number;
  openIssueSeverity?: number;
  reviewComment?: string;
  /** LLM-emitted reference-level feature evidence (cross-quote, e.g. "dual use"-style claims). */
  features?: Evidence[] | null;
  /** LLM-emitted reference-level use-case evidence (e.g. "dual use"). */
  useCases?: Evidence[] | null;
  specs?: StructuredSpec[] | null;
  referenceDetails?: ReferenceDetails | null;
  context: ProductReferenceContext;
  searchContext?: ProductSearchContextV2;
  /** Candidate set — the single source of truth for resolution. The candidate
   *  with `isPrimary === true` is the resolver's top pick. Multiple candidates
   *  mean the resolution was ambiguous and the user's "vote" is split across
   *  them by softmax `weight`. */
  candidates?: ProductReferenceCandidate[];
  /** Denormalised `candidates.length > 1`. Drives the moderation list query
   *  and ambiguity badges in the UI. */
  ambiguousResolution?: boolean;
}

/**
 * Payload shape for `changeProductReference` actions. Extends `Partial<ProductReference>`
 * with an optional `resolvedModel` override that the backend's
 * `UpdateProductReferenceDto.resolvedModel` consumes — picking a primary
 * product directly. The slice merges this onto the in-memory reference so
 * the wire payload (which is just the merged `productReferences` array)
 * carries the override field.
 */
export interface ProductReferenceUpdatePayload extends Partial<ProductReference> {
  id: string;
  resolvedModel?: { id: string };
}
