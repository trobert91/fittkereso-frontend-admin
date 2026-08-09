import { BaseEntity } from "./base-entity";
import { ProductModel } from "./product-model";
import type { ProductReference } from "./product-reference";

/**
 * One candidate product on a `ProductReference`. The reference's candidate set
 * is the single source of truth for resolution — `isPrimary === true` marks
 * the resolver's top pick (mirrors backend's `getPrimaryCandidate`). Multiple
 * candidates indicate the resolver flagged this reference as ambiguous and
 * is splitting the user's "vote" across the surviving candidates by `weight`.
 *
 * `weight` is softmax-derived (τ = 5) across the candidate set, so weights
 * across all candidates of a single reference sum to ~1.0. `confidence` is
 * the resolver's raw matchScore (0–100).
 *
 * `review` is set when the candidate has been linked to a (user, model) Review
 * by the review-creator pipeline; null/undefined while resolution-only.
 *
 * `reference` is populated when the candidate is loaded from the review side
 * (`Review.candidates[]` → `candidate.reference`) so the admin UI can walk
 * back to the source comment. Omitted when the candidate is loaded from the
 * reference side.
 */
export interface ProductReferenceCandidateReviewSummary {
  id: string;
}

export interface ProductReferenceCandidate extends BaseEntity {
  model: ProductModel;
  weight: number;
  confidence: number;
  isPrimary: boolean;
  review?: ProductReferenceCandidateReviewSummary | null;
  reference?: ProductReference;
}
