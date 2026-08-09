import { axiosInstance } from "../axios-instance";
import { isAxiosError } from "axios";

export interface KeywordResearchDebugAllocation {
  searchPriority: number;
  backlog: number;
  normalizedPriority: number;
  deficitScore: number;
  score: number;
  keywordCount: number;
}

export interface KeywordResearchDebugSearchedKeyword {
  keyword: string;
  /** null = never searched (the backend folds Infinity into null). */
  weeksSinceLastSearch: number | null;
  threadsDiscovered: number;
  threadsProcessed: number;
  threadsRejected: number;
}

export interface KeywordResearchDebugCooldown {
  keyword: string;
  weeksSinceLastSearch: number;
}

export interface KeywordResearchDebugPlan {
  plannedKeywords: string[];
  survivors: string[];
  sliced: string[];
  droppedByCooldown: string[];
  plannerCost: number;
  plannerLatencyMs: number;
  plannerModel: string;
  requestCount: number;
  allocatedCount: number;
  baseKeywords: string[];
  topProducts: string[];
  searchedKeywords: KeywordResearchDebugSearchedKeyword[];
  cooldown: KeywordResearchDebugCooldown[];
}

export interface KeywordResearchDebugCategoryResult {
  categorySlug: string;
  categoryName: string;
  categoryId: string;
  allocation: KeywordResearchDebugAllocation;
  plan: KeywordResearchDebugPlan | null;
  skipped: boolean;
  skippedReason: string | null;
  error: string | null;
  durationMs: number;
}

export interface KeywordResearchDebugResult {
  totalKeywordsBudget: number;
  categoriesEligible: number;
  categoriesProcessed: number;
  categoriesFailed: number;
  totalPlannerCost: number;
  durationMs: number;
  categories: KeywordResearchDebugCategoryResult[];
}

export interface KeywordResearchDebugRequest {
  categorySlugs?: string[];
  overrideTotal?: number;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

function isAllocation(value: unknown): value is KeywordResearchDebugAllocation {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.searchPriority === "number" &&
    typeof v.backlog === "number" &&
    typeof v.normalizedPriority === "number" &&
    typeof v.deficitScore === "number" &&
    typeof v.score === "number" &&
    typeof v.keywordCount === "number"
  );
}

function isSearchedKeyword(
  value: unknown,
): value is KeywordResearchDebugSearchedKeyword {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.keyword === "string" &&
    (v.weeksSinceLastSearch === null ||
      typeof v.weeksSinceLastSearch === "number") &&
    typeof v.threadsDiscovered === "number" &&
    typeof v.threadsProcessed === "number" &&
    typeof v.threadsRejected === "number"
  );
}

function isCooldown(value: unknown): value is KeywordResearchDebugCooldown {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.keyword === "string" && typeof v.weeksSinceLastSearch === "number"
  );
}

function isPlan(value: unknown): value is KeywordResearchDebugPlan {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    isStringArray(v.plannedKeywords) &&
    isStringArray(v.survivors) &&
    isStringArray(v.sliced) &&
    isStringArray(v.droppedByCooldown) &&
    typeof v.plannerCost === "number" &&
    typeof v.plannerLatencyMs === "number" &&
    typeof v.plannerModel === "string" &&
    typeof v.requestCount === "number" &&
    typeof v.allocatedCount === "number" &&
    isStringArray(v.baseKeywords) &&
    isStringArray(v.topProducts) &&
    Array.isArray(v.searchedKeywords) &&
    v.searchedKeywords.every(isSearchedKeyword) &&
    Array.isArray(v.cooldown) &&
    v.cooldown.every(isCooldown)
  );
}

function isCategoryResult(
  value: unknown,
): value is KeywordResearchDebugCategoryResult {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.categorySlug === "string" &&
    typeof v.categoryName === "string" &&
    typeof v.categoryId === "string" &&
    isAllocation(v.allocation) &&
    (v.plan === null || isPlan(v.plan)) &&
    typeof v.skipped === "boolean" &&
    (v.skippedReason === null || typeof v.skippedReason === "string") &&
    (v.error === null || typeof v.error === "string") &&
    typeof v.durationMs === "number"
  );
}

function isDebugResult(value: unknown): value is KeywordResearchDebugResult {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.totalKeywordsBudget === "number" &&
    typeof v.categoriesEligible === "number" &&
    typeof v.categoriesProcessed === "number" &&
    typeof v.categoriesFailed === "number" &&
    typeof v.totalPlannerCost === "number" &&
    typeof v.durationMs === "number" &&
    Array.isArray(v.categories) &&
    v.categories.every(isCategoryResult)
  );
}

export type KeywordResearchDebugErrorKind = "http" | "malformed" | "network";

export class KeywordResearchDebugError extends Error {
  constructor(
    message: string,
    public readonly kind: KeywordResearchDebugErrorKind,
    public readonly status?: number,
    public readonly responseBody?: unknown,
  ) {
    super(message);
    this.name = "KeywordResearchDebugError";
  }
}

export async function postKeywordResearchDebug(
  params: KeywordResearchDebugRequest = {},
): Promise<KeywordResearchDebugResult> {
  let response;
  try {
    response = await axiosInstance.post<unknown>(
      "/admin-keyword-research/debug",
      params,
    );
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      const status = error.response?.status;
      const body = error.response?.data as { message?: unknown } | undefined;
      const serverMessage =
        typeof body?.message === "string" ? body.message : undefined;
      if (status) {
        throw new KeywordResearchDebugError(
          serverMessage ??
            `Keyword research debug request failed with status ${status}.`,
          "http",
          status,
          body,
        );
      }
      throw new KeywordResearchDebugError(
        serverMessage ??
          "Keyword research debug request failed (network error).",
        "network",
      );
    }
    throw new KeywordResearchDebugError(
      "Keyword research debug request failed.",
      "network",
    );
  }

  if (!isDebugResult(response.data)) {
    throw new KeywordResearchDebugError(
      "Keyword research debug response did not match the expected shape. The server may have returned an empty or malformed payload.",
      "malformed",
      response.status,
      response.data,
    );
  }

  return response.data;
}
