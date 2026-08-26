import {
  OfferSearchParams,
  OfferSearchResult,
} from "@/models/dtos/offer-search-models";
import { axiosInstance } from "../axios-instance";

export async function postProductOfferSearch(
  productId: string,
  params: OfferSearchParams
): Promise<OfferSearchResult> {
  try {
    const response = await axiosInstance.post<OfferSearchResult>(
      `/admin-product/${productId}/offers/search`,
      params
    );

    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Offer search failed");
  }
}
