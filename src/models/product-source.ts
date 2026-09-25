import { Offer } from "./offer";
import type { ProductModel } from "./product-model";
import { ProductSpecs } from "./product-specs";

// Mirrors PRODUCT_SOURCE_TYPES in the backend. Decides which config format a
// source uses, and is fixed at creation.
//
// Previously listed arukereso/displayspecs/manual, none of which were ever
// ProductSource types — the backend had no type column at all, so the filters
// built on this enum were sent and silently ignored.
export enum ProductSourceType {
  scraping = "scraping",
  arukereso = "arukereso",
  googleshop = "googleshop",
}

// Mirrors isFeedSourceType in the backend: only a feed run sees the whole
// catalog in one pass, so only a feed source may set hasAllProducts.
export const isFeedSourceType = (type?: ProductSourceType): boolean =>
  type === ProductSourceType.arukereso || type === ProductSourceType.googleshop;

export const PRODUCT_SOURCE_TYPE_LABELS: Record<ProductSourceType, string> = {
  [ProductSourceType.scraping]: "Scraping — page pipelines",
  [ProductSourceType.arukereso]: "Árukereső — product feed",
  [ProductSourceType.googleshop]: "Google Shopping — TSV product feed",
};

// The badge colour of each type, wherever a source's type is shown.
export const PRODUCT_SOURCE_TYPE_COLORS: Record<ProductSourceType, string> = {
  [ProductSourceType.scraping]: "blue",
  [ProductSourceType.arukereso]: "grape",
  [ProductSourceType.googleshop]: "teal",
};

// The declarative scraping definition stored on ProductSource.config (jsonb).
// Only the handful of top-level keys the admin UI surfaces are named — the rest
// of the pipeline (listPage, detailPage, discovery, …) is edited as raw JSON,
// so the shape stays open rather than mirroring the backend interface.
export interface ProductSourceConfig {
  baseUrl?: string;
  fullSyncStartUrl?: string;
  categories?: Record<string, { enabled: boolean; sourceTitle?: string }>;
  [key: string]: unknown;
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
  // The product this listing currently sits on. Only populated where the
  // backend joins it — a merge can move a listing between products, so this is
  // the live answer to "where did this end up".
  model?: ProductModel;
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
    // structured field — fed to spec unification, and to the identity
    // extraction only where the source config opts in.
    description?: string;
    // The source-native ids of the other sizes this page declares as the
    // same bike (ebikeshop's frame-size variations). An import attaches a
    // listing to the product any of them already sits on.
    siblingExternalIds?: string[];
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
