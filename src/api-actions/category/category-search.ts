import { axiosInstance } from "../axios-instance";
import { AxiosError } from "axios";
import {
  CategorySearchParams,
  CategorySearchResult,
} from "@/models/dtos/category-search-models";
import {
  CategoryWithConfigResponse,
} from "@/models/product-category";

interface CategorySearchResultResponse {
  page?: number;
  pageSize?: number;
  totalItems?: number;
  totalPages?: number;
  sort?: string;
  order?: "ASC" | "DESC";
  items?: CategoryWithConfigResponse[];
}

export async function postCategorySearch(
  params: CategorySearchParams
): Promise<CategorySearchResult> {
  try {
    const response = await axiosInstance.post<CategorySearchResultResponse>(
      "/admin-category/search",
      params
    );

    const items = (response.data.items ?? []).map((item) => ({
      ...item.category,
      config: item.config,
    }));

    return { ...response.data, items } as CategorySearchResult;
  } catch (error: AxiosError | any) {
    throw new Error(error?.response?.data?.message || "Category search failed");
  }
}
