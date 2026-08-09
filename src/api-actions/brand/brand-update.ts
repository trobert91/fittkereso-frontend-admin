import { axiosInstance } from "../axios-instance";
import { AxiosError } from "axios";
import { Brand } from "@/models/brand";
import { BrandUpdateDto } from "@/models/dtos/brand-update.dto";

export async function postBrandUpdate(
  id: string,
  dto: BrandUpdateDto
): Promise<Brand> {
  try {
    const response = await axiosInstance.put<Brand>(
      `/admin-brand/${id}`,
      dto
    );

    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(error?.response?.data?.message || "Brand update failed");
  }
}
