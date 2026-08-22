import { Offer } from "./offer";
import { ProductSpecs } from "./product-specs";

export enum ProductSourceType {
  arukereso = "arukereso",
  displaySpecs = "displayspecs",
  manual = "manual",
}

// A single raw label/value row exactly as scraped, before deterministic
// mapping to canonical field names — see ScrapedProductSpec on the backend.
export interface ScrapedProductSpec {
  name: string;
  sectionTitle?: string;
  description?: string;
  values?: string[];
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
    // The raw, unfiltered title/model text exactly as scraped, before
    // brand/marketing/size/color boilerplate is stripped into `model`.
    originalName?: string;
    releaseYear?: number;
    specs?: ProductSpecs;
    rawSpecs?: ScrapedProductSpec[];
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
