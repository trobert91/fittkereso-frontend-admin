import {
  ScrapeTaskSearchParams,
  ScrapeTaskSearchResult,
} from "@/models/dtos/scrape-task-search-models";
import { axiosInstance } from "../axios-instance";
import { AxiosError } from "axios";

export async function postScrapeTaskSearch(
  params: ScrapeTaskSearchParams
): Promise<ScrapeTaskSearchResult> {
  try {
    const response = await axiosInstance.post<ScrapeTaskSearchResult>(
      "/admin-scrape-task/search",
      params
    );

    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(
      error?.response?.data?.message || "Scrape task search failed"
    );
  }
}
