import { AxiosError } from "axios";
import { axiosInstance } from "../axios-instance";
import { ProductModel } from "@/models/product-model";
import {
  ProductDuplicatePairSearchParams,
  ProductDuplicatePairSearchResult,
  ProductDuplicateScanResult,
} from "@/models/dtos/product-duplicate-search-models";

export async function postProductDuplicateSearch(
  params: ProductDuplicatePairSearchParams,
): Promise<ProductDuplicatePairSearchResult> {
  try {
    const response = await axiosInstance.post<ProductDuplicatePairSearchResult>(
      "/admin-product-duplicate/search",
      params,
    );
    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(
      error?.response?.data?.message || "Duplicate pair search failed",
    );
  }
}

/** Marks a pair as two different products. */
export async function postDismissProductDuplicate(pairId: string): Promise<void> {
  try {
    await axiosInstance.post(`/admin-product-duplicate/${pairId}/dismiss`);
  } catch (error: AxiosError | any) {
    throw new Error(
      error?.response?.data?.message || "Failed to dismiss duplicate pair",
    );
  }
}

/** Merges the pair's other product into the survivor and returns the survivor. */
export async function postMergeProductDuplicate(
  pairId: string,
  survivorProductId: string,
): Promise<ProductModel> {
  try {
    const response = await axiosInstance.post<ProductModel>(
      `/admin-product-duplicate/${pairId}/merge`,
      { survivorProductId },
    );
    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(
      error?.response?.data?.message || "Failed to merge duplicate pair",
    );
  }
}

/** Starts a full duplicate scan, or detects one product's duplicates now. */
export async function postProductDuplicateScan(
  productId?: string,
): Promise<ProductDuplicateScanResult> {
  try {
    const response = await axiosInstance.post<ProductDuplicateScanResult>(
      "/admin-product-duplicate/scan",
      { productId },
    );
    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(
      error?.response?.data?.message || "Failed to start duplicate scan",
    );
  }
}
