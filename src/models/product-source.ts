import { Offer } from "./offer";
import { ProductSpecs } from "./product-specs";

export enum ProductSourceType {
  arukereso = "arukereso",
  displaySpecs = "displayspecs",
  manual = "manual",
}

export interface ProductSourceRecord {
  id: string;
  url?: string;
  externalId?: string;
  specs: ProductSpecs;
  specValid?: boolean;
  specErrors?: Record<string, any>;
  lastUpdated: string;
  deduplicated: boolean;
  // The scraped listing's own display name (used for dedup matching) — NOT the supplier name.
  sourceName?: string;
  normalizedSourceName?: string;
  // The linked supplier/source config, e.g. "ebikeshop". Null for manual (admin-entered) specs.
  source?: { id: string; name: string } | null;
  offers?: Offer[];
}
