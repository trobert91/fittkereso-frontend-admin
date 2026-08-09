import { ScrapeTask, ScrapeQueueName } from "@/models/dtos/scrape-task-search-models";
import { axiosInstance } from "../axios-instance";
import { AxiosError } from "axios";

export interface ScrapeTaskCreateDto {
  queue: ScrapeQueueName;
  sourceId: string;
  productId?: string;
  url: string;
  scheduledAt?: string;
}

export async function postCreateScrapeTask(
  params: ScrapeTaskCreateDto
): Promise<ScrapeTask> {
  try {
    const response = await axiosInstance.post<ScrapeTask>(
      "/admin-scrape-task/create",
      params
    );

    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(
      error?.response?.data?.message || "Scrape task creation failed"
    );
  }
}
