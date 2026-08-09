import { axiosInstance } from "../axios-instance";
import { AxiosError } from "axios";
import {
  CommentSearchParams,
  CommentSearchResult,
} from "@/models/dtos/comment-search-models";

export async function postCommentSearch(
  params: CommentSearchParams
): Promise<CommentSearchResult> {
  try {
    // ⚙️ Call the NestJS login endpoint
    const response = await axiosInstance.post<CommentSearchResult>(
      "/admin-comment/search",
      params
    );

    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(error?.response?.data?.message || "Comment search failed");
  }
}
