import { axiosInstance } from "../axios-instance";
import { AxiosError } from "axios";
import { Brand } from "@/models/brand";
import { BrandCreateDto } from "@/models/dtos/brand-create.dto";

export async function postBrandCreate(dto: BrandCreateDto): Promise<Brand> {
  try {
    const response = await axiosInstance.post<Brand>("/admin-brand", dto);

    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(
      error?.response?.data?.message || "Brand create failed"
    );
  }
}
