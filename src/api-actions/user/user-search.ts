import {
  UserSearchParams,
  UserSearchResult,
} from "@/models/dtos/user-search-models";
import { axiosInstance } from "../axios-instance";

export async function postUserSearch(
  params: UserSearchParams
): Promise<UserSearchResult> {
  try {
    const response = await axiosInstance.post<UserSearchResult>(
      "/admin-user/search",
      params
    );

    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "User search failed");
  }
}
