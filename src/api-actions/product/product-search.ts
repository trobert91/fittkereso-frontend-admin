import {
  ProductSearchParams,
  ProductSearchResult,
} from "@/models/dtos/product-search-models";
import { axiosInstance } from "../axios-instance";
import { AxiosError } from "axios";

export async function postSearchProducts(
  params: ProductSearchParams
): Promise<ProductSearchResult> {
  try {
    // ⚙️ Call the NestJS login endpoint
    const response = await axiosInstance.post<ProductSearchResult>(
      "/admin-product/search",
      params
    );

    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(error?.response?.data?.message || "Product search failed");
  }
}
