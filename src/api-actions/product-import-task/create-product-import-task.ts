import { ProductImportTask, ProductImportTaskKind } from "@/models/dtos/product-import-task-search-models";
import { axiosInstance } from "../axios-instance";
import { AxiosError } from "axios";

export interface ProductImportTaskCreateDto {
  kind: ProductImportTaskKind;
  productId?: string;
  url: string;
  scheduledAt?: string;
  priority?: number;
}

export async function postCreateProductImportTask(
  params: ProductImportTaskCreateDto
): Promise<ProductImportTask> {
  try {
    const response = await axiosInstance.post<ProductImportTask>(
      "/admin-product-import-task/create",
      params
    );

    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(
      error?.response?.data?.message || "Import task creation failed"
    );
  }
}
