import {
  ProductSourceSearchParams,
  ProductSourceSearchResult,
} from "@/models/dtos/product-source-search-models";
import { axiosInstance } from "../axios-instance";

export async function postSellerProductSourceSearch(
  sellerId: string,
  params: ProductSourceSearchParams
): Promise<ProductSourceSearchResult> {
  try {
    const response = await axiosInstance.post<ProductSourceSearchResult>(
      `/admin-seller/${sellerId}/product-sources/search`,
      params
    );

    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message || "Product source search failed"
    );
  }
}
