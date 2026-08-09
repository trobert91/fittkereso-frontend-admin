import { axiosInstance } from "../axios-instance";
import { AxiosError } from "axios";
import { ProductModel } from "@/models/product-model";

export async function getProductById(id: string): Promise<ProductModel | null> {
  try {
    const response = await axiosInstance.get<ProductModel>(
      "/admin-product/" + id
    );

    return response.data;
  } catch (error: AxiosError | any) {
    if (error?.response?.status === 404) return null;
    throw new Error(error?.response?.data?.message || "Product search failed");
  }
}
