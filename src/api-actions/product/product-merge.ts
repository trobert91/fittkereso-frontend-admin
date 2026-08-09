import { axiosInstance } from "../axios-instance";
import { AxiosError } from "axios";
import { ProductModel } from "@/models/product-model";

export async function mergeProduct(
  sourceId: string,
  targetProductId: string,
): Promise<ProductModel> {
  try {
    const response = await axiosInstance.post<ProductModel>(
      `/admin-product/${sourceId}/merge`,
      { targetProductId },
    );
    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(error?.response?.data?.message || "Product merge failed");
  }
}
