import { axiosInstance } from "../axios-instance";
import { AxiosError } from "axios";
import {
  CategoryWithConfigResponse,
  ProductCategory,
} from "@/models/product-category";
import { ProductCategoryUpdateDto } from "@/models/dtos/product-category-update.dto";

export async function postCategoryUpdate(
  id: string,
  dto: ProductCategoryUpdateDto,
  options?: { includeConfig?: boolean }
): Promise<ProductCategory> {
  try {
    const response = await axiosInstance.put<CategoryWithConfigResponse>(
      `/admin-category/${id}`,
      dto,
      {
        params: options?.includeConfig ? { includeConfig: true } : undefined,
      }
    );

    return { ...response.data.category, config: response.data.config };
  } catch (error: AxiosError | any) {
    throw new Error(error?.response?.data?.message || "Category update failed");
  }
}
