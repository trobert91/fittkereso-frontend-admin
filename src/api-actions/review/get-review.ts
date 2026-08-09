import { axiosInstance } from "../axios-instance";
import { AxiosError } from "axios";
import { Review } from "@/models/review";

export async function getReviewById(id: string): Promise<Review> {
  try {
    const response = await axiosInstance.get<Review>(
      `/admin-review/${id}`
    );

    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(
      error?.response?.data?.message || "Fetching review failed"
    );
  }
}
