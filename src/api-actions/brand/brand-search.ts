import {
  BrandSearchParams,
  BrandSearchResult,
} from "@/models/dtos/brand-search-models";
import { axiosInstance } from "../axios-instance";
import { AxiosError } from "axios";

export async function postBrandSearch(
  params: BrandSearchParams
): Promise<BrandSearchResult> {
  try {
    // ⚙️ Call the NestJS login endpoint
    const response = await axiosInstance.post<BrandSearchResult>(
      "/admin-brand/search",
      params
    );

    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(error?.response?.data?.message || "Brand search failed");
  }
}
