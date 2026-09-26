import { BasePageResult } from "./base-page-result";
import { OfferAvailability } from "../offer";
import { ProductSourceRecord, ProductSourceType } from "../product-source";
import { SpecDefinitionJsonSchema } from "../product-specs";

/** One listing of a source, as the list shows it. See the backend's ProductSourceRecordRow. */
export interface ProductSourceRecordRow {
  id: string;
  sourceId: string;
  sourceName: string;
  sourceType: ProductSourceType;
  sellerId: string | null;
  sellerName: string | null;
  url: string | null;
  externalId: string | null;
  /** The externalIds its offers are stored under. */
  offerExternalIds: string[];
  title: string | null;
  brand: string | null;
  categoryName: string | null;
  /** How many offer entries (sizes, colours…) the listing states. */
  offerCount: number;
  /** The lowest price among its offer entries. */
  price: number | null;
  /** That entry's old price, when it is discounted. */
  priceWithoutDiscount: number | null;
  currency: string | null;
  availability: OfferAvailability | null;
  specValid: boolean;
  /** Null while the listing waits unattached. */
  productId: string | null;
  productName: string | null;
  /** When its source last listed it. */
  seenAt: string;
  lastUpdated: string;
  createdAt: string;
}

export type ProductSourceRecordSort =
  | "title"
  | "brand"
  | "productName"
  | "sourceName"
  | "externalId"
  | "price"
  | "seenAt"
  | "lastUpdated"
  | "createdAt";

export interface ProductSourceRecordSearchParams {
  sourceIds?: string[];
  /** True: on a product. False: unattached. Omitted: both. */
  attached?: boolean;
  /** True: specs valid. False: failed spec validation. Omitted: both. */
  valid?: boolean;
  /** The listing's URL, externalIds or title. */
  search?: string;
  /** The name of the product the listing sits on. */
  productName?: string;
  /** The brand the listing states. */
  brand?: string;
  /** The category the listing was imported into. */
  categoryIds?: string[];

  page?: number;
  pageSize?: number;

  sort?: ProductSourceRecordSort;
  order?: "ASC" | "DESC";
}

export type ProductSourceRecordSearchResult =
  BasePageResult<ProductSourceRecordRow>;

/** One listing with its source, offers and product, and the schema its specs are labelled with. */
export interface ProductSourceRecordDetails {
  record: ProductSourceRecord;
  schema: SpecDefinitionJsonSchema | null;
}
