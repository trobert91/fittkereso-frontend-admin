import { axiosInstance } from "../axios-instance";
import { isAxiosError } from "axios";

export interface CategoryScoreBreakdown {
  slug: string;
  name: string;
  relevance: number;
  subredditBoost: number;
}

export type RelevanceRating = "low" | "medium" | "high";

export interface RelevanceCriteriaRatings {
  experienceDensity: RelevanceRating;
  productSpecificity: RelevanceRating;
  featureDiscussion: RelevanceRating;
  buyerResearchValue: RelevanceRating;
  comparativeContent: RelevanceRating;
}

export interface RelevanceScoreBreakdown {
  llmScore: number;
  commentCountFactor: number;
  recencyFactor: number;
}

export type SelectionOutcome =
  | "selected"
  | "llm_low_relevance"
  | "llm_no_category";

export interface SignalScores {
  category: number;
  experienceDensity: number;
  productSpecificity: number;
  featureDiscussion: number;
  buyerResearchValue: number;
  comparativeContent: number;
}

export interface RelevanceEstimationResult {
  score: number;
  signals: SignalScores;
  categoryFocus: number;
  minRelevanceForIngestion: number;
  topCategories: CategoryScoreBreakdown[];
  commentFetchFailed: boolean;
  corpusSize: number;
  wouldPersistAs: string;
}

export type HardGateCriterion =
  | "experienceDensity"
  | "productSpecificity"
  | "buyerResearchValue";

export interface RelevanceSelectionResult {
  outcome: SelectionOutcome;
  weightedScore: number;
  minWeightedScore: number;
  criteria: RelevanceCriteriaRatings;
  breakdown: RelevanceScoreBreakdown;
  categories: Array<{ slug: string; name: string; relevance: number }>;
  sampledCommentCount: number;
  wouldPersistAs: string;
  /**
   * Hard-gate criteria the LLM rated as 'low'. The gate requires
   * experienceDensity, productSpecificity, and buyerResearchValue to all
   * be at least 'medium' — any 'low' here forces LLM_LOW_RELEVANCE
   * regardless of weightedScore. Empty array means the gate passed.
   */
  hardGateFailedCriteria: HardGateCriterion[];
}

export interface ThreadRelevanceDebugResult {
  externalId: string;
  title: string;
  topic: string;
  url: string;
  commentCount: number;
  estimation: RelevanceEstimationResult;
  selectionRan: boolean;
  selection: RelevanceSelectionResult | null;
  selectionError: string | null;
  finalWouldPersistAs: string;
}

export interface ThreadRelevanceDebugRequest {
  externalId: string;
  llmCalculation?: boolean;
}

function isCategoryScoreBreakdown(value: unknown): value is CategoryScoreBreakdown {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.slug === "string" &&
    typeof v.name === "string" &&
    typeof v.relevance === "number" &&
    typeof v.subredditBoost === "number"
  );
}

function isSignalScores(value: unknown): value is SignalScores {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.category === "number" &&
    typeof v.experienceDensity === "number" &&
    typeof v.productSpecificity === "number" &&
    typeof v.featureDiscussion === "number" &&
    typeof v.buyerResearchValue === "number" &&
    typeof v.comparativeContent === "number"
  );
}

function isEstimation(value: unknown): value is RelevanceEstimationResult {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.score === "number" &&
    typeof v.categoryFocus === "number" &&
    typeof v.minRelevanceForIngestion === "number" &&
    typeof v.commentFetchFailed === "boolean" &&
    typeof v.corpusSize === "number" &&
    typeof v.wouldPersistAs === "string" &&
    isSignalScores(v.signals) &&
    Array.isArray(v.topCategories) &&
    v.topCategories.every(isCategoryScoreBreakdown)
  );
}

function isSelectedCategory(
  value: unknown,
): value is { slug: string; name: string; relevance: number } {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.slug === "string" &&
    typeof v.name === "string" &&
    typeof v.relevance === "number"
  );
}

function isCriteria(value: unknown): value is RelevanceCriteriaRatings {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  const isRating = (r: unknown): r is RelevanceRating =>
    r === "low" || r === "medium" || r === "high";
  return (
    isRating(v.experienceDensity) &&
    isRating(v.productSpecificity) &&
    isRating(v.featureDiscussion) &&
    isRating(v.buyerResearchValue) &&
    isRating(v.comparativeContent)
  );
}

function isBreakdown(value: unknown): value is RelevanceScoreBreakdown {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.llmScore === "number" &&
    typeof v.commentCountFactor === "number" &&
    typeof v.recencyFactor === "number"
  );
}

const HARD_GATE_CRITERIA: HardGateCriterion[] = [
  "experienceDensity",
  "productSpecificity",
  "buyerResearchValue",
];

function isHardGateCriterion(value: unknown): value is HardGateCriterion {
  return (
    typeof value === "string" &&
    (HARD_GATE_CRITERIA as string[]).includes(value)
  );
}

function isSelection(value: unknown): value is RelevanceSelectionResult {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  const outcomeOk =
    v.outcome === "selected" ||
    v.outcome === "llm_low_relevance" ||
    v.outcome === "llm_no_category";
  return (
    outcomeOk &&
    typeof v.weightedScore === "number" &&
    typeof v.minWeightedScore === "number" &&
    typeof v.sampledCommentCount === "number" &&
    typeof v.wouldPersistAs === "string" &&
    isCriteria(v.criteria) &&
    isBreakdown(v.breakdown) &&
    Array.isArray(v.categories) &&
    v.categories.every(isSelectedCategory) &&
    Array.isArray(v.hardGateFailedCriteria) &&
    v.hardGateFailedCriteria.every(isHardGateCriterion)
  );
}

function isThreadRelevanceDebugResult(
  value: unknown,
): value is ThreadRelevanceDebugResult {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.externalId === "string" &&
    typeof v.title === "string" &&
    typeof v.topic === "string" &&
    typeof v.url === "string" &&
    typeof v.commentCount === "number" &&
    typeof v.finalWouldPersistAs === "string" &&
    typeof v.selectionRan === "boolean" &&
    isEstimation(v.estimation) &&
    (v.selection === null || isSelection(v.selection)) &&
    (v.selectionError === null || typeof v.selectionError === "string")
  );
}

export type RelevanceDebugErrorKind = "http" | "malformed" | "network";

export class RelevanceDebugRequestError extends Error {
  constructor(
    message: string,
    public readonly kind: RelevanceDebugErrorKind,
    public readonly status?: number,
    public readonly responseBody?: unknown,
  ) {
    super(message);
    this.name = "RelevanceDebugRequestError";
  }
}

export async function postThreadRelevanceDebug(
  params: ThreadRelevanceDebugRequest,
): Promise<ThreadRelevanceDebugResult> {
  let response;
  try {
    response = await axiosInstance.post<unknown>(
      "/admin-thread/relevance-debug",
      params,
    );
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      const status = error.response?.status;
      const body = error.response?.data as { message?: unknown } | undefined;
      const serverMessage =
        typeof body?.message === "string" ? body.message : undefined;
      if (status) {
        throw new RelevanceDebugRequestError(
          serverMessage ?? `Relevance debug request failed with status ${status}.`,
          "http",
          status,
          body,
        );
      }
      throw new RelevanceDebugRequestError(
        serverMessage ?? "Relevance debug request failed (network error).",
        "network",
      );
    }
    throw new RelevanceDebugRequestError(
      "Relevance debug request failed.",
      "network",
    );
  }

  if (!isThreadRelevanceDebugResult(response.data)) {
    throw new RelevanceDebugRequestError(
      "Relevance debug response did not match the expected shape. The server may have returned an empty or malformed payload.",
      "malformed",
      response.status,
      response.data,
    );
  }

  return response.data;
}
