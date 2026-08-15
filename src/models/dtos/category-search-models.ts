import { ProductCategory } from "../product-category";
import { BasePageResult } from "./base-page-result";

export interface CategorySearchParams {
  searchTerm?: string;

  page?: number;
  pageSize?: number;

  sort?: "name" | "createdAt" | "updatedAt" | "enabled";
  order?: "ASC" | "DESC";

  includeConfig?: boolean;
  enabled?: boolean;
}

export type CategorySearchResult = BasePageResult<ProductCategory> & {
  sort?: "name" | "createdAt" | "updatedAt" | "enabled";
};
