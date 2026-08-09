import {
  TaskSearchParams,
  TaskSearchResult,
} from "@/models/dtos/task-search-models";
import { axiosInstance } from "../axios-instance";
import { AxiosError } from "axios";

export async function postTaskSearch(
  params: TaskSearchParams
): Promise<TaskSearchResult> {
  try {
    const response = await axiosInstance.post<TaskSearchResult>(
      "/admin-task/search",
      params
    );

    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(error?.response?.data?.message || "Task search failed");
  }
}
