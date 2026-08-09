import {
  ProductSourceSearchParams,
  ProductSourceSearchResult,
} from "@/models/dtos/product-source-search-models";
import { axiosInstance } from "../axios-instance";

export async function postProductSourceSearch(
  params: ProductSourceSearchParams,
): Promise<ProductSourceSearchResult> {
  try {
    const response = await axiosInstance.post<ProductSourceSearchResult>(
      "/admin-product-source/search",
      params,
    );

    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message || "Product source search failed",
    );
  }
}
