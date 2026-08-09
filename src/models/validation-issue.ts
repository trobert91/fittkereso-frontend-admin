import type { Depth, ExperienceType, Intent, Sentiment } from './enums/review-enums';
import type { ContentQuality } from './thread-extraction-models';

export type ValidationIssueSource = 'deterministic' | 'llm';

export type ValidationIssueType =
  | 'quote_not_verbatim'
  | 'quote_duplicate'
  | 'speculative_flag_mismatch'
  | 'wrong_sentiment'
  | 'wrong_experience'
  | 'wrong_depth'
  | 'wrong_intent'
  | 'wrong_product'
  | 'wrong_quote_attribution'
  | 'boundary_violation'
  | 'discovered_products_present'
  | 'cheat_sheet_collapse_with_contrast_cue'
  | 'wrong_quote_quality'
  | 'suffix_alpha_mismatch'
  | 'multiple_candidates_resolved'
  | 'low_recency_evidence'
  | 'resolved_via_web_search'
  | 'unresolved_after_search'
  | 'duplicate_model';

export type IssueStatus = 'pending' | 'resolved' | 'unresolved' | 'unresolvable';

interface IssueCommon {
  source: ValidationIssueSource;
  /** Severity contribution of this issue. Stamped from the issue-type
   *  descriptor at creation time by the backend; consumers read it directly. */
  magnitude: number;
  reasoning?: string;
  status: IssueStatus;
  resolutionFailedReason?: string;
}

export type ValidationIssue =
  | (IssueCommon & { type: 'wrong_sentiment'; currentValue?: Sentiment; suggestedValue: Sentiment })
  | (IssueCommon & { type: 'wrong_experience'; currentValue?: ExperienceType; suggestedValue: ExperienceType })
  | (IssueCommon & { type: 'wrong_depth'; currentValue?: Depth; suggestedValue: Depth })
  | (IssueCommon & { type: 'wrong_intent'; currentValue?: Intent[]; suggestedValue: Intent[] })
  | (IssueCommon & { type: 'quote_not_verbatim'; quoteId: string; op: 'rewrite' | 'drop'; newText?: string; currentValue: string })
  | (IssueCommon & { type: 'quote_duplicate'; droppedQuoteId: string; currentValue: string })
  | (IssueCommon & { type: 'speculative_flag_mismatch'; quoteId: string; suggestedValue: boolean })
  | (IssueCommon & { type: 'wrong_product' })
  | (IssueCommon & { type: 'wrong_quote_attribution'; quoteId?: string })
  | (IssueCommon & { type: 'boundary_violation' })
  | (IssueCommon & { type: 'discovered_products_present' })
  | (IssueCommon & { type: 'cheat_sheet_collapse_with_contrast_cue' })
  | (IssueCommon & { type: 'wrong_quote_quality'; quoteId: string; currentValue?: ContentQuality; suggestedValue: ContentQuality })
  | (IssueCommon & { type: 'suffix_alpha_mismatch' })
  | (IssueCommon & { type: 'multiple_candidates_resolved' })
  | (IssueCommon & { type: 'low_recency_evidence' })
  | (IssueCommon & { type: 'resolved_via_web_search' })
  | (IssueCommon & { type: 'unresolved_after_search' })
  | (IssueCommon & {
      type: 'duplicate_model';
      /** Every ref on this comment whose candidate set intersects at least
       *  one other ref's candidate set on the same comment. */
      refIds: string[];
      /** Catalog product model ids that appear in 2+ refs' candidate sets. */
      sharedModelIds: string[];
    });
