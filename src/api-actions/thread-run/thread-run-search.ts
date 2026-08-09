import { axiosInstance } from "@/api-actions/axios-instance";
import { AxiosError } from "axios";
import { ThreadRunSearchParams, ThreadRunSearchResult } from "@/models/dtos/thread-run-search-models";

export async function postThreadRunSearch(
  params: ThreadRunSearchParams
): Promise<ThreadRunSearchResult> {
  try {
    const response = await axiosInstance.post<ThreadRunSearchResult>(
      "/admin-thread-run/search",
      params
    );
    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(error?.response?.data?.message || "Thread run search failed");
  }
}
