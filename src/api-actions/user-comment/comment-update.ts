import { axiosInstance } from "../axios-instance";
import { AxiosError } from "axios";
import { UpdateCommentDto } from "@/models/dtos/comment-update.dto";
import { UserComment } from "@/models/user-comment";

export async function postCommentUpdate(
  id: string,
  params: UpdateCommentDto
): Promise<UserComment> {
  try {
    // ⚙️ Call the NestJS login endpoint
    const response = await axiosInstance.put<UserComment>(
      `/admin-comment/${id}`,
      params
    );

    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(error?.response?.data?.message || "Comment search failed");
  }
}
