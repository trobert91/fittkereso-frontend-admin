import { axiosInstance } from "../axios-instance";
import { AxiosError } from "axios";
import { ProductModel } from "@/models/product-model";

export interface QueueStatusResult {
  status: "queued";
}

export async function recalculateProductRating(
  productId: string,
): Promise<ProductModel> {
  try {
    const response = await axiosInstance.post<ProductModel>(
      `/admin-product/${productId}/recalculate-rating`,
    );
    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(
      error?.response?.data?.message || "Rating recalculation failed",
    );
  }
}

export async function queueProductReviewAnalysis(
  productId: string,
): Promise<QueueStatusResult> {
  try {
    const response = await axiosInstance.post<QueueStatusResult>(
      `/admin-product/${productId}/queue-review-analysis`,
    );
    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(
      error?.response?.data?.message || "Queueing review analysis failed",
    );
  }
}

export async function deleteProductSource(
  productId: string,
  sourceId: string,
): Promise<ProductModel> {
  try {
    const response = await axiosInstance.delete<ProductModel>(
      `/admin-product/${productId}/sources/${sourceId}`,
    );
    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(error?.response?.data?.message || "Delete source failed");
  }
}

export async function resyncProductSource(
  productId: string,
  sourceRecordId: string,
): Promise<QueueStatusResult> {
  try {
    const response = await axiosInstance.post<QueueStatusResult>(
      `/admin-product/${productId}/resync-source`,
      { sourceRecordId },
    );

    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(error?.response?.data?.message || "Resync failed");
  }
}
