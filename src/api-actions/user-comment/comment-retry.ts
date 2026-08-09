import { axiosInstance } from "../axios-instance";
import { AxiosError } from "axios";
import { UserComment } from "@/models/user-comment";

export async function postCommentRetry(id: string): Promise<UserComment> {
  try {
    const response = await axiosInstance.post<UserComment>(
      `/admin-comment/${id}/retry`
    );
    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(error?.response?.data?.message || "Comment retry failed");
  }
}
