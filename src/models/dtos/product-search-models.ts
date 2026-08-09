import { ProductModel } from "../product-model";
import { BasePageResult } from "./base-page-result";

export interface ProductSearchParams {
  categoryIds?: string[];
  brandIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  searchTerm?: string;

  page?: number;
  pageSize?: number;

  sort?: "model" | "displayName" | "createdAt" | "updatedAt" | "rating" | "totalReviewCount";
  order?: "ASC" | "DESC";

  includeImages?: boolean;
}

export type ProductSearchResult = BasePageResult<ProductModel> & {
  sort?: "model" | "displayName" | "createdAt" | "updatedAt" | "rating" | "totalReviewCount";
};
