import {
  SellerSearchParams,
  SellerSearchResult,
} from "@/models/dtos/seller-search-models";
import { axiosInstance } from "../axios-instance";
import { AxiosError } from "axios";

export async function postSellerSearch(
  params: SellerSearchParams
): Promise<SellerSearchResult> {
  try {
    const response = await axiosInstance.post<SellerSearchResult>(
      "/admin-seller/search",
      params
    );

    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(
      error?.response?.data?.message || "Seller search failed"
    );
  }
}
