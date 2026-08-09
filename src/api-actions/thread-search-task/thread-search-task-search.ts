import {
  ThreadSearchTaskSearchParams,
  ThreadSearchTaskSearchResult,
} from "@/models/dtos/thread-search-task-search-models";
import { axiosInstance } from "../axios-instance";
import { AxiosError } from "axios";

export async function postThreadSearchTaskSearch(
  params: ThreadSearchTaskSearchParams
): Promise<ThreadSearchTaskSearchResult> {
  try {
    const response = await axiosInstance.post<ThreadSearchTaskSearchResult>(
      "/admin-thread-search-task/search",
      params
    );

    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(
      error?.response?.data?.message || "Thread search task search failed"
    );
  }
}
