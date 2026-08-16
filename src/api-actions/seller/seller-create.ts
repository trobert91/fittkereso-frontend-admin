import { axiosInstance } from "../axios-instance";
import { AxiosError } from "axios";
import { Seller } from "@/models/seller";
import { SellerCreateDto } from "@/models/dtos/seller-create.dto";

export async function postSellerCreate(dto: SellerCreateDto): Promise<Seller> {
  try {
    const response = await axiosInstance.post<Seller>("/admin-seller", dto);

    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(
      error?.response?.data?.message || "Seller create failed"
    );
  }
}
