import { axiosInstance } from "../axios-instance";
import { AxiosError } from "axios";
import {
  CategoryWithConfigResponse,
  ProductCategory,
} from "@/models/product-category";

export async function getCategoryById(
  id: string,
  options?: { includeConfig?: boolean }
): Promise<ProductCategory> {
  try {
    const response = await axiosInstance.get<CategoryWithConfigResponse>(
      "/admin-category/" + id,
      {
        params: options?.includeConfig ? { includeConfig: true } : undefined,
      }
    );

    return { ...response.data.category, config: response.data.config };
  } catch (error: AxiosError | any) {
    throw new Error(
      error?.response?.data?.message || "Fetching category failed"
    );
  }
}
