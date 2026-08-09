import { axiosInstance } from "../axios-instance";
import { AxiosError } from "axios";
import { ProductImage } from "@/models/product-image";
import { ProductModel } from "@/models/product-model";

export async function postProductImageUpload(
  id: string,
  formData: FormData
): Promise<ProductImage> {
  try {
    // ⚙️ Call the NestJS login endpoint
    const response = await axiosInstance.post<ProductImage>(
      `/admin-product/${id}/images`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(error?.response?.data?.message || "Product update failed");
  }
}

export async function postProductImageOrder(
  id: string,
  newOrder: { id: string; order: number }[]
): Promise<ProductModel> {
  try {
    // ⚙️ Call the NestJS login endpoint
    const response = await axiosInstance.post<ProductModel>(
      `/admin-product/${id}/image-order`,
      newOrder
    );

    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(
      error?.response?.data?.message || "Product image order update failed"
    );
  }
}

export async function sendDeleteProductImage(
  productId: string,
  imageId: string
): Promise<ProductModel> {
  try {
    // ⚙️ Call the NestJS login endpoint
    const response = await axiosInstance.delete<ProductModel>(
      `/admin-product/${productId}/images/${imageId}`,
      {}
    );

    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(
      error?.response?.data?.message || "Product image order update failed"
    );
  }
}
