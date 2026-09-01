import { ProductModel } from "../product-model";
import { BasePageResult } from "./base-page-result";

export interface ProductSearchParams {
  categoryIds?: string[];
  brandIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  searchTerm?: string;
  /** Exact product id. Kept separate from `searchTerm` so pasting a uuid finds
   *  that one product rather than whatever the trigram ranker scores near it. */
  id?: string;

  page?: number;
  pageSize?: number;

  sort?: "model" | "displayName" | "createdAt" | "updatedAt";
  order?: "ASC" | "DESC";

  includeImages?: boolean;
}

export type ProductSearchResult = BasePageResult<ProductModel> & {
  sort?: "model" | "displayName" | "createdAt" | "updatedAt";
};
