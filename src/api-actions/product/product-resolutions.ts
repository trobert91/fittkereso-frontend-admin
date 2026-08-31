import { ProductModel } from "@/models/product-model";
import { axiosInstance } from "../axios-instance";
import { AxiosError } from "axios";

// --- ProductResolution entity search ---
// Unified record of a product-resolution decision, from either flow:
// 'product_resolution' (real-time identity resolution, run at scrape time) or
// 'duplicate_detection' (nightly cron + scrape-time safety net comparing
// existing catalog products). Every row is actionable via decision/approve/
// reject, regardless of flow — see ProductResolutionDecision.

export type ProductResolutionFlow = "product_resolution" | "duplicate_detection";

export type ProductResolutionDecision =
  | "auto_accepted"
  | "pending_review"
  | "rejected"
  | "approved";

export type ProductResolutionOrigin = "scrape_time" | "nightly_detection";

export type SpecMatchResult = "match" | "compatible" | "mismatch";

export interface SpecMatchDetail {
  key: string;
  isPrimary: boolean;
  isMatcher?: boolean;
  valueA: any;
  valueB: any;
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

export interface ProductResolutionRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  flow: ProductResolutionFlow;
  /** Only meaningful when flow = duplicate_detection. */
  origin?: ProductResolutionOrigin;
  decision: ProductResolutionDecision;
  similarityScore: number;
  /** duplicate_detection only. */
  productA?: ProductModel;
  /** duplicate_detection only. */
  productB?: ProductModel;
  /** product_resolution only — set when the resolution succeeded. */
  resolvedProduct?: ProductModel;
  specMatchDetails?: SpecMatchDetails;
  pendingReasons?: string[];
  /** duplicate_detection only — set when approve triggered a merge. */
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

export interface ProductResolutionSearchParams {
  /** Omit to show decisions from both flows in one page. */
  flow?: ProductResolutionFlow;
  decision?: ProductResolutionDecision;
  categoryId?: string;
  /** Only meaningful when flow = duplicate_detection. */
  origin?: ProductResolutionOrigin;
  page?: number;
  pageSize?: number;
}

export interface ProductResolutionSearchResult {
  items: ProductResolutionRecord[];
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
): Promise<ProductResolutionRecord> {
  try {
    const response = await axiosInstance.get<ProductResolutionRecord>(
      `/admin-product/resolutions/${id}`,
    );
    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(
      error?.response?.data?.message || "Failed to fetch resolution",
    );
  }
}

// --- Approve / Reject ---
// Behavior differs by flow: duplicate_detection's approve triggers a real
// merge (unchanged from before); product_resolution's approve/reject are
// confirmation-only, recording a human judgment for tuning thresholds later,
// with no catalog mutation.

export async function postApproveResolution(
  id: string,
): Promise<ProductResolutionRecord> {
  try {
    const response = await axiosInstance.post<ProductResolutionRecord>(
      `/admin-product/resolutions/${id}/approve`,
    );
    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(
      error?.response?.data?.message || "Failed to approve resolution",
    );
  }
}

export async function postRejectResolution(
  id: string,
  note?: string,
): Promise<ProductResolutionRecord> {
  try {
    const response = await axiosInstance.post<ProductResolutionRecord>(
      `/admin-product/resolutions/${id}/reject`,
      { note },
    );
    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(
      error?.response?.data?.message || "Failed to reject resolution",
    );
  }
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

// --- Trigger nightly duplicate detection ---

export interface DuplicateDetectionRunSummary {
  categoriesProcessed: number;
  totalPairsEvaluated: number;
  autoMerged: number;
  pendingReview: number;
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
