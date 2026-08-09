import { Thread } from "@/models/thread";
import { axiosInstance } from "../axios-instance";
import { AxiosError } from "axios";

export async function getThreadById(id: string): Promise<Thread> {
  try {
    const response = await axiosInstance.get<Thread>("/admin-thread/" + id);
    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(error?.response?.data?.message || "Fetching thread failed");
  }
}
