import { Sentiment } from "./enums/review-enums";

// ─── Review-Level Criteria Aggregation ──────────────────────────────────────

export interface AspectSummary {
  aspect: string;
  sentiment: Sentiment;
  quoteCount: number;
}

export interface AggregatedCriteriaRating {
  key: string;
  rating: number;
  quoteCount: number;
  aspects?: AspectSummary[];
}

// ─── Product-Level Criteria Aggregation ─────────────────────────────────────

export interface ProductAspectSummary {
  aspect: string;
  sentiment: Sentiment;
  mentionCount: number;
}

export interface ProductCriteriaRating {
  key: string;
  label: string;
  rating: number;
  reviewCount: number;
  aspects?: ProductAspectSummary[];
}

// ─── LLM Review Analysis ────────────────────────────────────────────────────

export interface ProductLabelSummary {
  name: string;
  mentionCount: number;
  strongPositiveCount: number;
  positiveCount: number;
  neutralCount: number;
  mixedCount: number;
  negativeCount: number;
  strongNegativeCount: number;
  score: number;
  headline?: string | null;
  narrative?: string | null;
  narrativeGeneratedAt?: string | null;
}

export interface ProductRatingHighlight {
  text: string;
  quotes: string[];
}

// ─── Product Rating ──────────────────────────────────────────────────────────

export interface ProductRating {
  strongPositiveReviewCount: number;
  /** Mild positive only — does not include strongPositive. */
  positiveReviewCount: number;
  /** Mild negative only — does not include strongNegative. */
  negativeReviewCount: number;
  strongNegativeReviewCount: number;
  neutralReviewCount: number;
  mixedReviewCount: number;
  totalReviewCount: number;
  handsonReviewCount: number;
  rating?: number | null;
  averageReviewScore?: number | null;
  criteriaRatings?: ProductCriteriaRating[];

  tldr?: string | null;
  summary?: string | null;
  pros?: ProductRatingHighlight[] | null;
  cons?: ProductRatingHighlight[] | null;
  featureSummary?: ProductLabelSummary[] | null;
  useCaseSummary?: ProductLabelSummary[] | null;
  issueSummary?: ProductLabelSummary[] | null;
  lastSummaryGeneratedAt?: string | null;
  reviewCountAtLastSummary?: number | null;
}

// ─── Feature highlight quote (legacy) ───────────────────────────────────────

export interface FeatureHighlightQuote {
  text: string;
  sentiment: Sentiment;
  experience: string;
  upvotes: number;
  reviewId: string;
}
