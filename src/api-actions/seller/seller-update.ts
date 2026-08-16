import { axiosInstance } from "../axios-instance";
import { AxiosError } from "axios";
import { Seller } from "@/models/seller";
import { SellerUpdateDto } from "@/models/dtos/seller-update.dto";

export async function postSellerUpdate(
  id: string,
  dto: SellerUpdateDto
): Promise<Seller> {
  try {
    const response = await axiosInstance.put<Seller>(
      `/admin-seller/${id}`,
      dto
    );

    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(error?.response?.data?.message || "Seller update failed");
  }
}
