import { ProductSpecs } from "./product-specs";

export enum ProductSourceType {
  arukereso = "arukereso",
  displaySpecs = "displayspecs",
  manual = "manual",
}

export interface ProductModelSource {
  id: string;
  type: ProductSourceType;
  url?: string;
  specs: ProductSpecs;
  specValid?: boolean;
  specErrors?: Record<string, any>;
  lastUpdated: string;
  deduplicated: boolean;
  sourceName?: string;
  normalizedSourceName?: string;
}
