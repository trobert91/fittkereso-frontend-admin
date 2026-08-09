import { axiosInstance } from "../axios-instance";
import { AxiosError } from "axios";

export interface UpdateReviewDto {
  enabled?: boolean;
}

export async function putReviewUpdate(
  id: string,
  dto: UpdateReviewDto
): Promise<{ success: boolean }> {
  try {
    const response = await axiosInstance.put<{ success: boolean }>(
      `/admin-review/${id}`,
      dto
    );

    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(error?.response?.data?.message || "Review update failed");
  }
}
