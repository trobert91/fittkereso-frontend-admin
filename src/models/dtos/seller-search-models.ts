import { Seller, SellerType } from "../seller";
import { BasePageResult } from "./base-page-result";

export interface SellerSearchParams {
  searchTerm?: string;
  types?: SellerType[];
  verified?: boolean;
  active?: boolean;

  page?: number;
  pageSize?: number;

  sort?: "name" | "type" | "verified" | "active" | "createdAt" | "updatedAt";
  order?: "ASC" | "DESC";
}

export type SellerSearchResult = BasePageResult<Seller> & {
  sort?: SellerSearchParams["sort"];
  searchTerm?: string;
  types?: SellerType[];
  verified?: boolean;
  active?: boolean;
};
