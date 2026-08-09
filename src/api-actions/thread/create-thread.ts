import { axiosInstance } from "../axios-instance";
import { AxiosError } from "axios";
import { ThreadCreateDto } from "@/models/dtos/thread-create.dto";
import { Thread } from "@/models/thread";

export async function postCreateThread(
  params: ThreadCreateDto
): Promise<Thread> {
  try {
    // ⚙️ Call the NestJS login endpoint
    const response = await axiosInstance.post<Thread>(
      "/admin-thread/create",
      params
    );

    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(error?.response?.data?.message || "Thread creation failed");
  }
}
