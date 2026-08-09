import { axiosInstance } from "../axios-instance";
import { ProductSource } from "@/models/dtos/product-source-search-models";

export async function getProductSourceById(id: string): Promise<ProductSource> {
  try {
    const response = await axiosInstance.get<ProductSource>(
      `/admin-product-source/${id}`,
    );

    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message || "Fetching product source failed",
    );
  }
}
