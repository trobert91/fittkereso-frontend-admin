import { ProductCategoryConfig } from "../product-category";

export interface ProductCategoryUpdateDto {
  name?: string;

  enabled?: boolean;

  extractionEnabled?: boolean;

  searchEnabled?: boolean;

  searchPriority?: number;

  autoDeduplicationEnabled?: boolean;

  aliases?: string[];

  config?: ProductCategoryConfig;
}
