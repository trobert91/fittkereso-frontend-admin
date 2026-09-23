import { ProductSourceType } from "../product-source";

export const PRODUCT_SOURCE_TYPES = Object.values(ProductSourceType);

export interface SellerProductSourceCreateDto {
  name: string;
  /**
   * Decides which config format the source uses, and cannot be changed after
   * creation — the backend rejects an update that tries to.
   */
  type: ProductSourceType;
}
