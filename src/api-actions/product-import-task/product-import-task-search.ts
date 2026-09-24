import {
  ProductImportTaskSearchParams,
  ProductImportTaskSearchResult,
} from "@/models/dtos/product-import-task-search-models";
import { axiosInstance } from "../axios-instance";
import { AxiosError } from "axios";

export async function postProductImportTaskSearch(
  params: ProductImportTaskSearchParams
): Promise<ProductImportTaskSearchResult> {
  try {
    const response = await axiosInstance.post<ProductImportTaskSearchResult>(
      "/admin-product-import-task/search",
      params
    );

    return response.data;
  } catch (error: AxiosError | any) {
    throw new Error(
      error?.response?.data?.message || "Import task search failed"
    );
  }
}
