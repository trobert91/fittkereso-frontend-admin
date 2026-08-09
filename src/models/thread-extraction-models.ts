import { Sentiment, Intent, ExperienceType } from "./enums/review-enums";

export interface CommentContext {
  threadTitle: string;
  topic: string;
  products: ContextProduct[];
}

export interface ContextProduct {
  id: string;
  displayName: string;
  originalMention?: string;
  relevance: number;
  specs?: string[];
}

export interface RawProductMention {
  brand?: string;
  displayName?: string;
  model?: string;
  mentions?: string[];
  specs?: string[];
  quotes?: Quote[];
  sentiment?: Sentiment;
  intent?: Intent;
  experience?: ExperienceType;
  relevance: number;
  categories?: string[];
}

export interface ProductMention extends RawProductMention {
  originalDisplayName?: string;
  variant?: string;
  resolveTryCount?: number;
  resolvedProductId?: string;
  productReferenceId?: string;
}

export interface Mention {
  text: string;
  context: string;
}

export interface Evidence {
  label: string;
  /** Sentiment that applies to this label. Overrides the quote's sentiment when set. */
  sentiment?: Sentiment;
  /** Closed-list issueType label (only set on negative-sentiment feature evidence). */
  issueType?: string;
}

export type ContentQuality = "high" | "medium" | "low";

export interface Quote {
  id: string;
  text: string;
  sentiment: Sentiment;
  speculative?: boolean;
  features?: Evidence[];
  useCases?: Evidence[];
  issues?: Evidence[];
  quality?: ContentQuality;
}

/**
 * The sentiment that applies to this evidence's label. If the evidence
 * carries its own sentiment, it overrides the quote's sentiment;
 * otherwise the label inherits from the quote.
 */
export function effectiveSentiment(evidence: Evidence, quote: Quote): Sentiment {
  return evidence.sentiment ?? quote.sentiment;
}

export interface CommentResolutionResult {
  products: ProductMention[];
  context: CommentContext;
}
