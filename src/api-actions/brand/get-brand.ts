import { axiosInstance } from "../axios-instance";
import { AxiosError } from "axios";
import { Brand } from "@/models/brand";

export async function getBrandById(id: string): Promise<Brand> {
  try {
    const response = await axiosInstance.get<Brand>("/admin-brand/" + id);

    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(
      error?.response?.data?.message || "Fetching brand failed"
    );
  }
}
