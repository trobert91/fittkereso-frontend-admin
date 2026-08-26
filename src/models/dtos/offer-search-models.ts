import { Offer } from "../offer";
import { BasePageResult } from "./base-page-result";

export interface OfferSearchParams {
  page?: number;
  pageSize?: number;
  sort?:
    | "price"
    | "lastSeenAt"
    | "createdAt"
    | "updatedAt"
    | "availability"
    | "condition";
  order?: "ASC" | "DESC";
}

export type OfferSearchResult = BasePageResult<Offer> & {
  productId?: string;
};
