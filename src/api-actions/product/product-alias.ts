import { axiosInstance } from "../axios-instance";
import { AxiosError } from "axios";
import { ProductModel } from "@/models/product-model";

export async function postCreateAlias(
  productId: string,
  alias: string
): Promise<ProductModel> {
  try {
    const response = await axiosInstance.post<ProductModel>(
      `/admin-product/${productId}/aliases`,
      { alias }
    );
    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(error?.response?.data?.message || "Failed to create alias");
  }
}

export async function putUpdateAlias(
  productId: string,
  aliasId: string,
  alias: string
): Promise<ProductModel> {
  try {
    const response = await axiosInstance.put<ProductModel>(
      `/admin-product/${productId}/aliases/${aliasId}`,
      { alias }
    );
    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(error?.response?.data?.message || "Failed to update alias");
  }
}

export async function sendDeleteAlias(
  productId: string,
  aliasId: string
): Promise<ProductModel> {
  try {
    const response = await axiosInstance.delete<ProductModel>(
      `/admin-product/${productId}/aliases/${aliasId}`
    );
    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(error?.response?.data?.message || "Failed to delete alias");
  }
}
