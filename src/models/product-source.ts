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
  // The full scraped payload this record was built from — specs and the
  // listing's own brand/model/displayName/releaseYear live here, not as
  // separate top-level fields. See ProductSourceRecord.scrapedProduct on
  // the backend entity.
  scrapedProduct?: {
    brand?: string;
    model?: string;
    displayName?: string;
    releaseYear?: number;
    specs?: ProductSpecs;
  };
  specValid?: boolean;
  specErrors?: Record<string, any>;
  lastUpdated: string;
  deduplicated: boolean;
  // Normalized identity key used for Path-1 dedup matching (see backend
  // ProductScrapeUpdaterService), derived from scrapedProduct at scrape time.
  normalizedSourceName?: string;
  // The linked supplier/source config, e.g. "ebikeshop". Null for manual (admin-entered) specs.
  source?: { id: string; name: string } | null;
  offers?: Offer[];
}
