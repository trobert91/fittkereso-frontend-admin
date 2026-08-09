import {
  ThreadSearchKeywordSearchParams,
  ThreadSearchKeywordSearchResult,
} from "@/models/dtos/thread-search-keyword-search-models";
import { axiosInstance } from "../axios-instance";
import { AxiosError } from "axios";

export async function postThreadSearchKeywordSearch(
  params: ThreadSearchKeywordSearchParams
): Promise<ThreadSearchKeywordSearchResult> {
  try {
    const response = await axiosInstance.post<ThreadSearchKeywordSearchResult>(
      "/admin-thread-search-keyword/search",
      params
    );

    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(
      error?.response?.data?.message || "Thread search keyword search failed"
    );
  }
}
