import { ProductSpecs } from "../product-specs";

export interface ProductModelUpdateDto {
  productCategoryId?: string;
  brandId?: string;
  displayName?: string;
  model?: string;
  normalizedName?: string;
  manualSpecs?: ProductSpecs;
  description?: string;
  aliases?: string[];
  enabled?: boolean;
  releaseYear?: number;
  mainImageId?: string;
}
