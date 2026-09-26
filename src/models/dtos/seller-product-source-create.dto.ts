import { ProductSourceFetchMode, ProductSourceType } from "../product-source";

export const PRODUCT_SOURCE_TYPES = Object.values(ProductSourceType);

export interface SellerProductSourceCreateDto {
  name: string;
  /**
   * Decides which config format the source uses, and cannot be changed after
   * creation — the backend rejects an update that tries to.
   */
  type: ProductSourceType;
  /** Unique per seller. Omitted, the backend picks a free one. */
  priority?: number;
  /** Defaults to true; a seller's first source must identify products. */
  identifiesProducts?: boolean;
  /** Defaults to false; feed sources only. */
  hasAllProducts?: boolean;
  /** Defaults to proxied for every type. */
  fetchMode?: ProductSourceFetchMode;
}
