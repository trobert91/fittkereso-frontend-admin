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

/** Statuses that still need attention — the queue's default filter. */
export const OPEN_RESOLUTION_STATUSES: ProductResolutionStatus[] = [
  "pending",
  "failed",
];

// --- Decision log ---

export type ResolutionActor = "system" | "admin";

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
  /** Denormalized from decisionSnapshot.confidence, for sorting/filtering. */
  decisionConfidence?: number;
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
}

/** One row plus what can be done to it. Every read and write endpoint returns
 *  this shape, so an action's response is enough to re-render the card. */
export interface ResolutionListItem {
  resolution: ProductResolutionRecord;
  state: ProductResolutionState;
}

// --- Search ---

export const RESOLUTION_SORT_FIELDS = [
  "relevance",
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
  /** When neither `status` nor `statuses` is set the backend returns only rows
   *  that still need attention — the queue shows work, not history. */
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
  /** Free-text over the involved products' display names and the anchor key. */
  query?: string;
  /** `relevance` (default) = pending first, then closest calls. */
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
