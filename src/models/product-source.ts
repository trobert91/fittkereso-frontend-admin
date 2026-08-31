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

// A single scraped image URL with its position in the source listing's
// gallery/pipeline output order — order 0 is the listing's primary image.
// See ProductSourceImage on the backend.
export interface ProductSourceImage {
  url: string;
  order: number;
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
    // The deterministic, label-matching spec mapping before the LLM
    // post-process pass merges its own contribution on top to produce
    // `specs` above — also exactly what was sent to the LLM as input.
    extractedSpecs?: ProductSpecs;
    rawSpecs?: ScrapedProductSpec[];
    // Free-text marketing/description copy from the listing, when the
    // source's config extracts one. Lower-confidence prose, not a
    // structured field — only fed to the model-spec LLM call, never the
    // offer-identity one.
    description?: string;
    images?: ProductSourceImage[];
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
