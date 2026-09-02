import { ProductModel } from "@/models/product-model";
import { ProductSourceRecord } from "@/models/product-source";
import { axiosInstance } from "../axios-instance";
import { AxiosError } from "axios";

// --- ProductResolution review queue ---
// A unified record of one identity decision, from either flow:
// 'product_resolution' (real-time resolution, run at scrape time) or
// 'duplicate_detection' (nightly cron + scrape-time safety net comparing
// existing catalog products).
//
// Workflow state is `status` (does this still need attention?) plus `accepted`
// (the human verdict); the full history lives in the append-only `decisions`
// log. Which actions are legal right now is NOT re-derived here — the backend
// ships a `state` object per row, so the UI and the enforcement can never
// disagree. Always drive buttons off `state.availableActions`.

export type ProductResolutionFlow = "product_resolution" | "duplicate_detection";

export type ProductResolutionOrigin = "scrape_time" | "nightly_detection";

export type ProductResolutionStatus =
  /** Awaiting a human decision. */
  | "pending"
  /** Decided; everything it implied was carried out. */
  | "done"
  /** Decided, but the catalog action errored — retryable. */
  | "failed"
  /** Replaced by a newer row for the same anchor. */
  | "superseded";

/** Statuses that still need attention. The review queue opens on these, sending
 *  them explicitly — the API applies no status filter when none is given. */
export const OPEN_RESOLUTION_STATUSES: ProductResolutionStatus[] = [
  "pending",
  "failed",
];

// --- Decision log ---

/** Who made a decision. `system` covers both the producing pipeline's seed entry
 *  and the deterministic auto-accept rule; `ai` is the LLM reviewer. Only
 *  `admin` stamps `reviewedAt`, which is what withdraws a row from every
 *  automated path for good. */
export type ResolutionActor = "system" | "ai" | "admin";

export type ResolutionVerdict =
  // The producing system's own verdicts, written at record time:
  | "matched_existing"
  | "created_new"
  | "duplicate_proposed"
  // Human review actions:
  | "accept"
  | "decline"
  | "reopen";

/** The catalog effect a decision implies. `none` = pure judgment. */
export type ResolutionActionKind =
  | "match"
  | "create"
  | "merge"
  | "split"
  | "none";

export interface ProductResolutionDecisionAction {
  kind: ResolutionActionKind;
  /** The product the listing(s) ended up on after this action. */
  productId?: string;
  /** `merge`: the product merged away. `split`: the product carved out of. */
  sourceProductId?: string;
  targetProductId?: string;
  /** The listings this action moved. For `merge` this is the whole reversal
   *  mechanism — splitting these back out re-creates the merged-away product. */
  sourceRecordIds?: string[];
}

export interface ProductResolutionDecisionEntry {
  at: string;
  actor: ResolutionActor;
  verdict: ResolutionVerdict;
  action: ProductResolutionDecisionAction;
  /** Whether the action was actually carried out. A scrape-time resolution was
   *  already executed when recorded; a duplicate pair is only a proposal. */
  actionPerformed: boolean;
  performedAt?: string;
  /** Set when an attempted action threw — the row moved to `failed`. */
  error?: string;
  note?: string;
}

// --- Derived state: what can be done to this row right now ---

/** What a decline does to reverse whatever is currently in effect. */
export type ResolutionCorrection = "split" | "merge_into" | "dismiss";

export type ResolutionActionName = "accept" | "decline" | "reopen" | "retry";

export interface ResolutionAvailableAction {
  action: ResolutionActionName;
  /** Only set for `decline`. */
  correction?: ResolutionCorrection;
  requiresTargetProduct: boolean;
  /** A sensible default for the target picker — e.g. the product these
   *  listings were split out of. */
  suggestedTargetProductId?: string;
}

export interface ProductResolutionState {
  status: ProductResolutionStatus;
  accepted: boolean;
  /** The most recent decision that actually changed the catalog. Every offered
   *  correction is derived from this, never from the original verdict. */
  lastPerformed?: ProductResolutionDecisionEntry;
  /** Which product the reviewed listing sits on right now. */
  listingProductId?: string;
  /** The listings a `split` would carve out, already filtered to ones that
   *  still exist and still sit where the log says they should. */
  splittableSourceRecordIds: string[];
  availableActions: ResolutionAvailableAction[];
  /** Machine-readable reasons an otherwise-expected action isn't offered. */
  blockedReasons: string[];
}

// --- Evidence ---

export type SpecMatchResult = "match" | "compatible" | "mismatch";

export interface SpecMatchDetail {
  key: string;
  isPrimary: boolean;
  isMatcher?: boolean;
  valueA: string | number | boolean | string[] | undefined;
  valueB: string | number | boolean | string[] | undefined;
  match: SpecMatchResult;
}

export interface SpecMatchDetails {
  comparableCount: number;
  matchingCount: number;
  primaryMismatches: number;
  matcherSpecMismatches: number;
  nonPrimaryMismatches: number;
  details: SpecMatchDetail[];
}

export interface MatchResultComponents {
  stringSimilarity: number;
  tokenOverlap: number;
  alphaMatch: number;
  aliasMatch: boolean;
  specSimilarity: number;
}

export type ProductResolutionCandidateSource =
  | "fuzzy"
  | "embedding"
  | "web"
  | "duplicate_detection_pair"
  | "reference_short_circuit";

export interface ProductResolutionCandidateRecord {
  candidateId: string;
  brand?: string;
  model?: string;
  displayName?: string;
  source: ProductResolutionCandidateSource;
  matchScore?: number;
  matchComponents?: MatchResultComponents;
  gates: { passed: boolean; failedGates: string[] };
  /** Set when the filter stage dropped this candidate on a brand, category, or
   *  primary-spec contradiction — before it was ever scored. Such a candidate
   *  has no `matchScore` or `specMatchDetails`: `detail` is the only account of
   *  why it lost, e.g. `usageType MTB ≠ Összteleszkópos MTB`. */
  filtered?: {
    reason: "match_specs" | "category" | "brand";
    detail: string;
  };
  specMatchDetails?: SpecMatchDetails;
}

export interface ProductResolutionInputSnapshot {
  kind: "product_resolution";
  input: {
    brand?: string;
    model?: string;
    displayName?: string;
    categoryHint?: string;
    category?: { id?: string; name: string };
    referenceProductId?: string;
    referenceModel?: string;
    modelClues?: string[];
    variantClues?: string[];
    contentQuality?: "high" | "medium" | "low";
  };
  options: {
    useEmbedding: boolean;
    webSearchEnabled: boolean;
    mode: "strict" | "loose";
    llmDecisionEnabled?: boolean;
    decisionStrategy?: "comment" | "scrape-merge";
  };
  referenceProduct?: {
    productId: string;
    brand?: string;
    model?: string;
    productCategory?: { id: string; name: string; slug?: string };
  };
  brand?: { id: string; name: string; similarity: number };
  category?: { id: string; name: string; similarity: number };
}

export interface ProductDuplicateDetectionInputSnapshot {
  kind: "duplicate_detection";
  query: { model: string; displayName?: string; aliases: string[] };
  candidate: { model: string; displayName?: string; aliases: string[] };
  brandName?: string;
  categorySlug?: string;
  /** The pg_trgm pre-filter score, distinct from `similarityScore` (the
   *  in-process score). */
  trigramScore: number;
}

export interface ProductResolutionDecisionSnapshot {
  kind: "matcher_accept" | "matcher_reject" | "llm_resolved" | "llm_unresolved";
  confidence: number;
  reason: string;
  selectedCandidates: Array<{
    candidateId: string;
    confidence: number;
    reason?: string;
  }>;
  evidenceSummary?: string;
}

// --- Priority ---

/** One weighted term of the `impact` factor. */
export interface PriorityFactor {
  key: string;
  /** 0–1. */
  value: number;
  weight: number;
}

/**
 * The working behind a row's priority — `100 × uncertainty × impact ×
 * statusWeight`.
 *
 * Multiplicative on purpose: a decision we are sure about needs no review
 * however much rides on it, and one touching nothing needs none however unsure
 * we are.
 */
export interface ResolutionPriorityBreakdown {
  priority: number;
  /** `1 − confidence`. */
  uncertainty: number;
  impact: number;
  statusWeight: number;
  confidence: number;
  impactFactors: PriorityFactor[];
  /** False when the blast radius was assumed rather than counted — a row the
   *  nightly sweep has not reached yet. */
  blastRadiusMeasured: boolean;
}

// --- Review triggers and the automated reviewers ---

/**
 * Why a row might be wrong. Not a severity scale, and never an ordering term —
 * `priority` alone orders the queue.
 *
 * The empty list is the value that matters: `reviewTriggers: []` means "no known
 * suspicion pattern", which is what deterministic auto-accept trusts. It does
 * *not* mean "verified correct". `undefined` is different again — the nightly
 * sweep has not classified the row yet, and an unclassified row is ineligible
 * for every automated path.
 */
export type ResolutionReviewTrigger =
  /** Asserted sameness while the specs disagree. */
  | "spec_conflict"
  /** The winner barely beat the runner-up. */
  | "narrow_margin"
  /** Nothing independent of the name backs the match — no comparable specs, no
   *  alias. */
  | "name_only_match"
  /** A candidate scored well enough to accept and a gate stopped it. */
  | "gate_only_rejection"
  /** The best candidate fell just short of the accept threshold. */
  | "near_miss_rejection"
  /** Recall found nothing for a listing that named a brand and a model, and the
   *  catalog does hold that brand in that category — so finding nothing is
   *  surprising. Usually a brand-alias gap or an over-tight filter. */
  | "no_candidates_but_named"
  /** Nothing recalled, and the input named no brand or model. Unjudgeable from
   *  stored data, so the AI skips these too. */
  | "insufficient_evidence";

/** Every trigger, in the order they are worth scanning — contradictions first,
 *  then weak evidence, then the recall failures. Drives the filter chips. */
export const RESOLUTION_REVIEW_TRIGGERS: ResolutionReviewTrigger[] = [
  "spec_conflict",
  "narrow_margin",
  "name_only_match",
  "gate_only_rejection",
  "near_miss_rejection",
  "no_candidates_but_named",
  "insufficient_evidence",
];

/** How sure the AI reviewer was. `high` is what authorises it to act; the rest
 *  stay pending with the recommendation shown as a suggestion. */
export type ResolutionAiConfidence = "low" | "medium" | "high";

/** Whether the AI agreed with what the producing system concluded. `abstain` is
 *  a real outcome, treated as `low`. */
export type ResolutionAiVerdict = "agree" | "disagree" | "abstain";

/** What the AI recommended — the same vocabulary as `availableActions`, so a
 *  recommendation is directly executable. */
export type ResolutionAiRecommendedAction =
  | "accept"
  | "dismiss"
  | "split"
  | "merge_into";

/** Who settled the row. `system`/`ai` on a `done` row is the automation audit
 *  stream. Cleared on reopen. */
export type ResolutionDecidedBy = "system" | "ai" | "admin";

export interface ProductResolutionAiReview {
  verdict: ResolutionAiVerdict;
  recommendedAction: ResolutionAiRecommendedAction;
  /** Set when `recommendedAction` is `merge_into`. */
  targetProductId?: string;
  reasoning: string;
  /** Which fields the model says it used. A verdict citing nothing is one to
   *  distrust. */
  evidenceCited: string[];
  model: string;
  costUsd?: number;
  /** False for every advisory verdict, and for a high-confidence one blocked by
   *  the destructive-action kill switch. */
  executed: boolean;
  error?: string;
}

// --- The record ---

export interface ProductResolutionRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  flow: ProductResolutionFlow;
  /** Only meaningful when flow = duplicate_detection. */
  origin?: ProductResolutionOrigin;
  status: ProductResolutionStatus;
  accepted: boolean;
  /** Append-only. Index 0 is always the producing system's own decision. */
  decisions?: ProductResolutionDecisionEntry[];
  similarityScore: number;
  /** How sure we are the outcome was correct — whichever outcome it was, match
   *  or create or reject. Not the decider's self-report, which is one weighted
   *  input to it. */
  decisionConfidence?: number;
  /** 0–100: how important it is that a human reviews this row, and the queue's
   *  default order. Null until the nightly sweep has scored the row. */
  priority?: number;
  /** The terms that produced the priority, so a surprising rank can be traced
   *  to the one that caused it. */
  priorityBreakdown?: ResolutionPriorityBreakdown;
  /** Which real-world situation this row is about — the identity dedup keys on. */
  anchorKey?: string;
  /** Last time this exact situation was seen again. */
  lastSeenAt?: string;
  /** duplicate_detection only. */
  productA?: ProductModel;
  /** duplicate_detection only. */
  productB?: ProductModel;
  /** product_resolution only — set when the resolution succeeded. Historical:
   *  the listing may have been moved since. Prefer `sourceRecord.model` for
   *  "where does this sit now". */
  resolvedProduct?: ProductModel;
  /** The scraped listing this decision was about, and — via `model` — the
   *  product it currently sits on. */
  sourceRecord?: ProductSourceRecord;
  specMatchDetails?: SpecMatchDetails;
  pendingReasons?: string[];
  /** Set whenever a merge was performed from this row. */
  mergedAt?: string;
  reviewedAt?: string;
  reviewNote?: string;
  inputSnapshot?:
    | ProductResolutionInputSnapshot
    | ProductDuplicateDetectionInputSnapshot;
  candidates?: ProductResolutionCandidateRecord[];
  /** product_resolution only. */
  decisionSnapshot?: ProductResolutionDecisionSnapshot;
  /** Why this row might be wrong. `undefined` = the sweep has not classified it
   *  yet; `[]` = classified and nothing fired. The two are not the same. */
  reviewTriggers?: ResolutionReviewTrigger[];
  /** Set once the AI has judged this row. Cleared whenever the evidence is
   *  refreshed, along with every other `ai*` field. */
  aiReviewedAt?: string;
  aiConfidence?: ResolutionAiConfidence;
  aiReview?: ProductResolutionAiReview;
  /** Who settled the row. Only set once `status` is `done`. */
  decidedBy?: ResolutionDecidedBy;
}

/**
 * The scraped listing, reduced to what gets compared against the product it was
 * matched to. A server-side projection of the `scrapedProduct` blob — that blob
 * carries every spec variant and the raw description, so it is not shipped with
 * list results.
 */
export interface ResolutionListingSummary {
  brand?: string;
  /** The raw listing title, before boilerplate was stripped into `model`.
   *  Only some sources expose one. */
  originalName?: string;
  displayName?: string;
  url?: string;
  imageUrl?: string;
  /** From the cheapest scraped offer — the same rule the product uses to
   *  denormalize its own `price`, so the two are directly comparable. */
  price?: number;
  priceWithoutDiscount?: number;
  currency?: string;
  offerCount?: number;
}

/** One row plus what can be done to it. Every read and write endpoint returns
 *  this shape, so an action's response is enough to re-render the card. */
export interface ResolutionListItem {
  resolution: ProductResolutionRecord;
  state: ProductResolutionState;
  listing?: ResolutionListingSummary;
  /** `productId => imageUrl` for this row's candidates. A stored candidate
   *  carries only its id, so this is what lets the queue show the products it
   *  compared. An id absent from the map has no picture — the product was
   *  deleted, or never had one. */
  candidateImageUrls?: Record<string, string>;
}

// --- Search ---

export const RESOLUTION_SORT_FIELDS = [
  "priority",
  "similarityScore",
  "decisionConfidence",
  "createdAt",
  "lastSeenAt",
] as const;

export type ProductResolutionSortField =
  (typeof RESOLUTION_SORT_FIELDS)[number];

export interface ProductResolutionSearchParams {
  /** Omit to show decisions from both flows in one page. */
  flow?: ProductResolutionFlow;
  /** When neither `status` nor `statuses` is set, no status filter is applied
   *  and every row is returned — history included. */
  status?: ProductResolutionStatus;
  statuses?: ProductResolutionStatus[];
  accepted?: boolean;
  categoryId?: string;
  /** The ProductSource the reviewed listing was scraped from. */
  sourceId?: string;
  /** Any row touching this product. */
  productId?: string;
  /** Only meaningful when flow = duplicate_detection. */
  origin?: ProductResolutionOrigin;
  minSimilarityScore?: number;
  minConfidence?: number;
  /** Work a band of the queue. No default — nothing disappears silently. */
  minPriority?: number;
  /** Any-of: rows matching at least one of these. The triggers are independent
   *  suspicions rather than facets, so their intersection is rarely useful. */
  triggers?: ResolutionReviewTrigger[];
  /** `true` — only rows where nothing fired (`reviewTriggers: []`), which is
   *  exactly what auto-accept will trust. `false` — only rows where something
   *  did. Rows the sweep has not classified appear in neither. */
  untriggered?: boolean;
  /** Any-of. `["low","medium"]` is the "things the machine couldn't settle"
   *  queue. */
  aiConfidence?: ResolutionAiConfidence[];
  aiReviewed?: boolean;
  /** Any-of. `["system","ai"]` over `status: done` is the automation audit. */
  decidedBy?: ResolutionDecidedBy[];
  /** Free-text over the involved products' display names and the anchor key. */
  query?: string;
  /** `priority` (default) = most worth reviewing first. */
  sortBy?: ProductResolutionSortField;
  sortDir?: "ASC" | "DESC";
  page?: number;
  pageSize?: number;
}

export interface ProductResolutionSearchResult {
  items: ResolutionListItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export async function postSearchResolutions(
  params: ProductResolutionSearchParams,
): Promise<ProductResolutionSearchResult> {
  try {
    const response = await axiosInstance.post<ProductResolutionSearchResult>(
      "/admin-product/resolutions/search",
      params,
    );
    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(
      error?.response?.data?.message || "Resolution search failed",
    );
  }
}

export async function getResolutionById(
  id: string,
): Promise<ResolutionListItem> {
  try {
    const response = await axiosInstance.get<ResolutionListItem>(
      `/admin-product/resolutions/${id}`,
    );
    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(
      error?.response?.data?.message || "Failed to fetch resolution",
    );
  }
}

// --- Actions ---
// All four go through the backend's single orchestrator, which re-derives what
// is legal from live data before acting. A 400 here means the world changed
// since the page was rendered — refresh the row and look at `blockedReasons`.

export interface DeclineResolutionBody {
  correction: ResolutionCorrection;
  /** Required when `correction` is `merge_into`. */
  targetProductId?: string;
  note?: string;
}

async function postAction(
  id: string,
  action: ResolutionActionName,
  body?: unknown,
  failureMessage?: string,
): Promise<ResolutionListItem> {
  try {
    const response = await axiosInstance.post<ResolutionListItem>(
      `/admin-product/resolutions/${id}/${action}`,
      body ?? {},
    );
    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(
      error?.response?.data?.message ||
        failureMessage ||
        `Failed to ${action} resolution`,
    );
  }
}

/** "The system got this right." Performs the proposed merge if one is still
 *  pending; otherwise records the confirmation. */
export function postAcceptResolution(
  id: string,
  note?: string,
): Promise<ResolutionListItem> {
  return postAction(id, "accept", { note }, "Failed to accept resolution");
}

/** "The current state is wrong." Which corrections are legal comes from the
 *  last performed action — see `state.availableActions`. */
export function postDeclineResolution(
  id: string,
  body: DeclineResolutionBody,
): Promise<ResolutionListItem> {
  return postAction(id, "decline", body, "Failed to decline resolution");
}

/** Puts a decided row back in the queue. Catalog effects are not undone — the
 *  reopened row offers the correction that reverses them. */
export function postReopenResolution(
  id: string,
  note?: string,
): Promise<ResolutionListItem> {
  return postAction(id, "reopen", { note }, "Failed to reopen resolution");
}

/** Re-runs an action that failed, against freshly derived state. */
export function postRetryResolution(id: string): Promise<ResolutionListItem> {
  return postAction(id, "retry", {}, "Failed to retry resolution");
}

// --- Delete ---

export async function deleteResolution(id: string): Promise<void> {
  try {
    await axiosInstance.delete(`/admin-product/resolutions/${id}`);
  } catch (error: AxiosError | any) {
    throw new Error(
      error?.response?.data?.message || "Failed to delete resolution",
    );
  }
}

// --- AI review ---
// Two entry points onto one pipeline: one row now, or the top of the queue in a
// batch. Both judge; whether they *act* depends on server config, which is why
// every response says what happened rather than assuming it did.

/** Why a recommendation was not carried out. Absent when it was. */
export type AiReviewNotExecutedReason =
  /** Server is in dry-run: judged and recorded, but nothing was acted on. */
  | "dry_run"
  /** Only `high` acts. Low and medium stay as advice. */
  | "not_confident"
  /** `executeActions` is off — every verdict is advisory. */
  | "execution_disabled"
  /** A merge or split (or accepting an unexecuted duplicate proposal) while
   *  `executeDestructive` is off. */
  | "destructive_disabled"
  /** The row could not legally take the recommended action. */
  | "action_unavailable"
  /** The row changed between intake and the verdict — a re-scrape, or you
   *  decided it first — so the action was discarded rather than applied to a
   *  question the model had not been asked. */
  | "stale"
  /** The action itself threw; see `review.error`. */
  | "failed";

export interface AiReviewResult {
  resolutionId: string;
  review: ProductResolutionAiReview;
  confidence: ResolutionAiConfidence;
  notExecutedReason?: AiReviewNotExecutedReason;
}

export interface AiReviewBatchSummary {
  rowsReviewed: number;
  /** A recommendation was carried out. */
  executed: number;
  /** Judged and left for a human — low/medium confidence, a kill switch, or an
   *  action the row could not take. Includes the abstains. */
  advisory: number;
  abstained: number;
  /** Row moved between intake and verdict; the action was discarded. */
  skippedStale: number;
  failed: number;
  costUsd: number;
  /** Stopped on the row cap or the cost cap — more work is waiting. */
  capped: boolean;
  dryRun: boolean;
  durationMs: number;
}

export interface RunAiReviewBody {
  maxPerRun?: number;
  minPriority?: number;
  dryRun?: boolean;
  /** Can only ever *tighten* the server's setting — passing `true` when the
   *  server says `false` does not enable merges. */
  executeDestructive?: boolean;
}

/** Hands one row to the reviewer immediately. */
export async function postAiReviewResolution(
  id: string,
): Promise<AiReviewResult> {
  try {
    const response = await axiosInstance.post<AiReviewResult>(
      `/admin-product/resolutions/${id}/ai-review`,
      {},
    );
    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(error?.response?.data?.message || "AI review failed");
  }
}

/** Runs the same batch the nightly scheduler runs, over the top of the queue. */
export async function postRunAiReview(
  body: RunAiReviewBody = {},
): Promise<AiReviewBatchSummary> {
  try {
    const response = await axiosInstance.post<AiReviewBatchSummary>(
      "/admin-product/resolutions/ai-review/run",
      body,
    );
    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(
      error?.response?.data?.message || "Failed to run AI review",
    );
  }
}

// --- Trigger duplicate detection ---

export interface DuplicateDetectionRunSummary {
  categoriesProcessed: number;
  totalPairsEvaluated: number;
  /** Pairs written to the review queue. Detection never merges — every merge
   *  goes through a human accepting the row. */
  recorded: number;
  skipped: number;
  durationMs: number;
}

export async function postTriggerDuplicateDetection(
  categoryId?: string,
): Promise<DuplicateDetectionRunSummary> {
  try {
    const response = await axiosInstance.post<DuplicateDetectionRunSummary>(
      "/admin-product/resolutions/trigger",
      { categoryId },
    );
    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(
      error?.response?.data?.message ||
        "Failed to trigger duplicate detection",
    );
  }
}
