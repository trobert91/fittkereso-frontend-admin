import { axiosInstance } from "../axios-instance";
import { ProductSource } from "@/models/dtos/product-source-search-models";
import { ProductSourceUpdateDto } from "@/models/dtos/product-source-update.dto";

export async function putProductSourceUpdate(
  id: string,
  dto: ProductSourceUpdateDto,
): Promise<ProductSource> {
  try {
    const response = await axiosInstance.put<ProductSource>(
      `/admin-product-source/${id}`,
      dto,
    );

    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message || "Product source update failed",
    );
  }
}
