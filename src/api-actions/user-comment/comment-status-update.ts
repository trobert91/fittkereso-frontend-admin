import { axiosInstance } from "../axios-instance";
import { AxiosError } from "axios";
import { UserComment } from "@/models/user-comment";
import { CommentStatus } from "@/models/enums/comment-enums";

export async function postCommentStatusUpdate(
  id: string,
  status: CommentStatus
): Promise<UserComment> {
  try {
    const response = await axiosInstance.put<UserComment>(
      `/admin-comment/${id}/status`,
      { status }
    );

    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(error?.response?.data?.message || "Comment search failed");
  }
}

export async function postCommentToggleChecked(
  id: string
): Promise<UserComment> {
  try {
    const response = await axiosInstance.put<UserComment>(
      `/admin-comment/${id}/toggle-checked`
    );
    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(
      error?.response?.data?.message || "Comment toggle checked failed"
    );
  }
}
