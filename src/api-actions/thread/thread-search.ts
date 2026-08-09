import {
  ThreadSearchParams,
  ThreadSearchResult,
} from "@/models/dtos/thread-search-models";
import { axiosInstance } from "../axios-instance";
import { AxiosError } from "axios";

export async function postThreadSearch(
  params: ThreadSearchParams
): Promise<ThreadSearchResult> {
  try {
    // ⚙️ Call the NestJS login endpoint
    const response = await axiosInstance.post<ThreadSearchResult>(
      "/admin-thread/search",
      params
    );

    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(error?.response?.data?.message || "Thread search failed");
  }
}
