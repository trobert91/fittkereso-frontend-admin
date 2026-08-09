import { axiosInstance } from "../axios-instance";
import { AxiosError } from "axios";
import { ProductModelUpdateDto } from "@/models/dtos/product-model-update.dto";
import { ProductModel } from "@/models/product-model";
import { ProductSpecUpdateDto } from "@/models/dtos/product-spec-update.dto";

export async function postProductUpdate(
  id: string,
  dto: ProductModelUpdateDto
): Promise<ProductModel> {
  try {
    // ⚙️ Call the NestJS login endpoint
    const response = await axiosInstance.put<ProductModel>(
      `/admin-product/${id}`,
      dto
    );

    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(error?.response?.data?.message || "Product update failed");
  }
}

export async function postProductSpecUpdate(
  id: string,
  dto: ProductSpecUpdateDto
): Promise<ProductModel> {
  try {
    // ⚙️ Call the NestJS login endpoint
    const response = await axiosInstance.post<ProductModel>(
      `/admin-product/${id}/update-manual-specs`,
      dto
    );

    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(error?.response?.data?.message || "Product update failed");
  }
}
