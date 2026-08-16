import { BaseEntity } from "./base-entity";
import { ProductSource } from "./dtos/product-source-search-models";

export type SellerType = "business" | "private";

export interface Seller extends BaseEntity {
  name: string;
  slug?: string | null;
  type: SellerType;
  domains?: string[];
  logoUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  location?: string;
  verified: boolean;
  active: boolean;
  productSources?: ProductSource[];
}
