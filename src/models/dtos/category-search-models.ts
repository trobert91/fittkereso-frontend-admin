import { ProductCategory } from "../product-category";
import { BasePageResult } from "./base-page-result";

export interface CategorySearchParams {
  searchTerm?: string;

  page?: number;
  pageSize?: number;

  sort?:
    | "name"
    | "createdAt"
    | "updatedAt"
    | "enabled"
    | "extractionEnabled"
    | "searchEnabled"
    | "searchPriority";
  order?: "ASC" | "DESC";

  includeConfig?: boolean;
  autoDeduplicationEnabled?: boolean;
  enabled?: boolean;
  searchEnabled?: boolean;
}

export type CategorySearchResult = BasePageResult<ProductCategory> & {
  sort?:
    | "name"
    | "createdAt"
    | "updatedAt"
    | "enabled"
    | "extractionEnabled"
    | "searchEnabled"
    | "searchPriority";
};
