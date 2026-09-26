import { axiosInstance } from "../axios-instance";
import {
  ProductSourceRecordDetails,
  ProductSourceRecordSearchParams,
  ProductSourceRecordSearchResult,
} from "@/models/dtos/product-source-record-models";

/** Every source's listings, filtered and paged. */
export async function postProductSourceRecordSearch(
  params: ProductSourceRecordSearchParams,
): Promise<ProductSourceRecordSearchResult> {
  try {
    const response = await axiosInstance.post<ProductSourceRecordSearchResult>(
      "/admin-product-source-record/search",
      params,
    );

    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message || "Listing search failed",
    );
  }
}

/** One listing, with what its details view shows. */
export async function getProductSourceRecord(
  id: string,
): Promise<ProductSourceRecordDetails> {
  try {
    const response = await axiosInstance.get<ProductSourceRecordDetails>(
      `/admin-product-source-record/${id}`,
    );

    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message || "Failed to load the listing",
    );
  }
}
