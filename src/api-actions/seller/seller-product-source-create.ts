import { axiosInstance } from "../axios-instance";
import { AxiosError } from "axios";
import { Seller } from "@/models/seller";
import { SellerProductSourceCreateDto } from "@/models/dtos/seller-product-source-create.dto";

export async function postSellerProductSourceCreate(
  sellerId: string,
  dto: SellerProductSourceCreateDto
): Promise<Seller> {
  try {
    const response = await axiosInstance.post<Seller>(
      `/admin-seller/${sellerId}/product-sources`,
      dto
    );

    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(
      error?.response?.data?.message || "Product source create failed"
    );
  }
}
