import { axiosInstance } from "../axios-instance";
import { AxiosError } from "axios";
import {
  ReviewSearchParams,
  ReviewSearchResult,
} from "@/models/dtos/review-search-models";

export async function postReviewSearch(
  params: ReviewSearchParams
): Promise<ReviewSearchResult> {
  try {
    const response = await axiosInstance.post<ReviewSearchResult>(
      "/admin-review/search",
      params
    );

    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(error?.response?.data?.message || "Review search failed");
  }
}
