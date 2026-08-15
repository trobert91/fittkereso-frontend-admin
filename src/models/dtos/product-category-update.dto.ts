import { ProductCategoryConfig } from "../product-category";

export interface ProductCategoryUpdateDto {
  name?: string;

  enabled?: boolean;

  aliases?: string[];

  config?: ProductCategoryConfig;
}
