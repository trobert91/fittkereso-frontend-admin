import { axiosInstance } from "../axios-instance";
import { AxiosError } from "axios";
import { Thread } from "@/models/thread";

export async function postScheduleThreadProcessing(
  threadId: string
): Promise<Thread> {
  try {
    // ⚙️ Call the NestJS login endpoint
    const response = await axiosInstance.post<Thread>(
      `/admin-thread/${threadId}/run-pipeline`
    );

    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(error?.response?.data?.message || "Thread creation failed");
  }
}

export async function deleteThread(threadId: string): Promise<Thread> {
  try {
    const response = await axiosInstance.delete<Thread>(
      `/admin-thread/${threadId}`
    );
    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(error?.response?.data?.message || "Thread deletion failed");
  }
}

export async function resetThread(threadId: string): Promise<Thread> {
  try {
    const response = await axiosInstance.post<Thread>(
      `/admin-thread/${threadId}/reset`
    );
    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(error?.response?.data?.message || "Thread reset failed");
  }
}
