import { ProductModel } from "@/models/product-model";
import { axiosInstance } from "../axios-instance";
import { AxiosError } from "axios";

// --- On-demand similarity search (existing endpoint) ---

export interface DuplicateSearchParams {
  categoryId?: string;
  brandId?: string;
  minSimilarity?: number;
  page?: number;
  pageSize?: number;
}

export interface DuplicatePairItem {
  id: string;
  displayName: string;
  normalizedName: string;
  brandName: string;
  reviewCount: number;
  orderedSpecs?: { key: string; label: string; value: any }[];
}

export interface DuplicatePair {
  productA: DuplicatePairItem;
  productB: DuplicatePairItem;
  similarityScore: number;
  categoryName: string;
  categoryId: string;
}

export interface DuplicateSearchResult {
  items: DuplicatePair[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export async function postSearchDuplicates(
  params: DuplicateSearchParams,
): Promise<DuplicateSearchResult> {
  try {
    const response = await axiosInstance.post<DuplicateSearchResult>(
      "/admin-product/duplicates",
      params,
    );
    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(
      error?.response?.data?.message || "Duplicate search failed",
    );
  }
}

// --- ProductDuplicate entity search (stored pairs) ---

export type ProductDuplicateDecision =
  | "auto_merged"
  | "pending_review"
  | "rejected"
  | "approved";

export type SpecMatchResult = "match" | "compatible" | "mismatch";

export interface SpecMatchDetail {
  key: string;
  isPrimary: boolean;
  valueA: any;
  valueB: any;
  match: SpecMatchResult;
}

export interface SpecMatchDetails {
  comparableCount: number;
  matchingCount: number;
  primaryMismatches: number;
  nonPrimaryMismatches: number;
  details: SpecMatchDetail[];
}

export interface ProductDuplicateRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  productA: ProductModel;
  productB: ProductModel;
  decision: ProductDuplicateDecision;
  similarityScore: number;
  specMatchDetails?: SpecMatchDetails;
  pendingReasons?: string[];
  mergedAt?: string;
  reviewedAt?: string;
  reviewNote?: string;
}

export interface ProductDuplicatePairSearchParams {
  decision?: ProductDuplicateDecision;
  categoryId?: string;
  page?: number;
  pageSize?: number;
}

export interface ProductDuplicatePairSearchResult {
  items: ProductDuplicateRecord[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export async function postSearchDuplicatePairs(
  params: ProductDuplicatePairSearchParams,
): Promise<ProductDuplicatePairSearchResult> {
  try {
    const response =
      await axiosInstance.post<ProductDuplicatePairSearchResult>(
        "/admin-product/duplicate-pairs/search",
        params,
      );
    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(
      error?.response?.data?.message || "Duplicate pair search failed",
    );
  }
}

// --- Get single duplicate pair ---

export async function getDuplicatePairById(
  id: string,
): Promise<ProductDuplicateRecord> {
  try {
    const response = await axiosInstance.get<ProductDuplicateRecord>(
      `/admin-product/duplicate-pairs/${id}`,
    );
    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(
      error?.response?.data?.message || "Failed to fetch duplicate pair",
    );
  }
}

// --- Approve / Reject ---

export async function postApproveDuplicatePair(
  id: string,
): Promise<ProductDuplicateRecord> {
  try {
    const response = await axiosInstance.post<ProductDuplicateRecord>(
      `/admin-product/duplicate-pairs/${id}/approve`,
    );
    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(
      error?.response?.data?.message || "Failed to approve duplicate pair",
    );
  }
}

export async function postRejectDuplicatePair(
  id: string,
  note?: string,
): Promise<ProductDuplicateRecord> {
  try {
    const response = await axiosInstance.post<ProductDuplicateRecord>(
      `/admin-product/duplicate-pairs/${id}/reject`,
      { note },
    );
    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(
      error?.response?.data?.message || "Failed to reject duplicate pair",
    );
  }
}

// --- Delete ---

export async function deleteProductDuplicatePair(id: string): Promise<void> {
  try {
    await axiosInstance.delete(`/admin-product/duplicate-pairs/${id}`);
  } catch (error: AxiosError | any) {
    throw new Error(
      error?.response?.data?.message || "Failed to delete duplicate pair",
    );
  }
}

// --- Trigger detection ---

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
    const response =
      await axiosInstance.post<DuplicateDetectionRunSummary>(
        "/admin-product/duplicate-pairs/trigger",
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
