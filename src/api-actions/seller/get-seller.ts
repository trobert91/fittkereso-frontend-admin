import { axiosInstance } from "../axios-instance";
import { AxiosError } from "axios";
import { Seller } from "@/models/seller";

export async function getSellerById(id: string): Promise<Seller> {
  try {
    const response = await axiosInstance.get<Seller>("/admin-seller/" + id);

    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(
      error?.response?.data?.message || "Fetching seller failed"
    );
  }
}
