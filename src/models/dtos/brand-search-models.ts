import { Brand } from "../brand";
import { BasePageResult } from "./base-page-result";

export interface BrandSearchParams {
  searchTerm?: string;

  page?: number;
  pageSize?: number;

  sort?: "name" | "createdAt" | "updatedAt";
  order?: "ASC" | "DESC";
}

export type BrandSearchResult = BasePageResult<Brand> & {
  sort?: "name" | "createdAt" | "updatedAt";
};
