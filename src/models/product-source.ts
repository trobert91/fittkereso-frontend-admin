import { Offer, OfferAvailability } from "./offer";
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

// Mirrors PRODUCT_SOURCE_FETCH_MODES in the backend: how every page and feed of
// a source is fetched. Proxied unless someone chose otherwise — calling a shop
// directly needs its consent, and a switch lands on the source's timeline.
export enum ProductSourceFetchMode {
  proxied = "proxied",
  direct = "direct",
}

export const DEFAULT_PRODUCT_SOURCE_FETCH_MODE = ProductSourceFetchMode.proxied;

export const PRODUCT_SOURCE_FETCH_MODE_LABELS: Record<ProductSourceFetchMode, string> = {
  [ProductSourceFetchMode.proxied]: "Proxied — Zyte, paid",
  [ProductSourceFetchMode.direct]: "Direct — free, needs the shop's consent",
};

// Short labels for badges and table cells.
export const PRODUCT_SOURCE_FETCH_MODE_SHORT_LABELS: Record<ProductSourceFetchMode, string> = {
  [ProductSourceFetchMode.proxied]: "Proxied",
  [ProductSourceFetchMode.direct]: "Direct",
};

export const PRODUCT_SOURCE_FETCH_MODE_COLORS: Record<ProductSourceFetchMode, string> = {
  [ProductSourceFetchMode.proxied]: "orange",
  [ProductSourceFetchMode.direct]: "green",
};

// Zyte truncates a body over 10 MB, so a document that large has to be direct.
export const FETCH_MODE_DESCRIPTION =
  "How every page and feed of this source is fetched. Proxied goes through Zyte and is paid per request. Direct calls the shop itself for free: only for a shop that agreed to be read, or a feed over 10 MB, which Zyte truncates.";

export const PRODUCT_SOURCE_FETCH_MODE_OPTIONS = Object.values(ProductSourceFetchMode).map(
  (mode) => ({ value: mode, label: PRODUCT_SOURCE_FETCH_MODE_LABELS[mode] }),
);

// The declarative scraping definition stored on ProductSource.config (jsonb).
// Only the handful of top-level keys the admin UI surfaces are named — the rest
// of the pipeline (listPage, detailPage, discovery, …) is edited as raw JSON,
// so the shape stays open rather than mirroring the backend interface.
export interface ProductSourceConfig {
  baseUrl?: string;
  fullSyncStartUrl?: string;
  categories?: Record<string, { enabled: boolean; sourceTitle?: string }>;
  // Caps one run; unset means no cap. A feed run counts its rows, a scraping
  // run the detail pages it queues across all its list pages.
  maxItems?: number;
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

// One offer as a listing stated it, before the seller's sources are composed
// into the Offer — see ScrapedOffer on the backend. A key the source maps but
// found empty is null; a key it does not map is absent, and then the seller's
// other sources decide that field.
export interface ScrapedOffer {
  price: number;
  priceWithoutDiscount?: number | null;
  currency?: string | null;
  availability?: OfferAvailability | null;
  url?: string | null;
  externalId?: string;
  // The Offer.externalId the entry was stored under. Null when its id collided
  // with another entry on the same page, so it has no offer of its own.
  resolvedExternalId?: string | null;
  gtin?: string | null;
  mpn?: string | null;
  locations?: string[] | null;
  specs?: ProductSpecs;
}

/**
 * Why a listing lacks a field (ScrapedProduct.flags on the backend):
 * - `identity_off`: its source's `postProcess.identity` is off, so no AI
 *   identity extraction ran.
 * - `identity_failed`: the extraction ran but returned no model name; the next
 *   import retries it.
 */
export type ScrapedProductFlag = "identity_off" | "identity_failed";

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
    category?: { id: string; slug: string; name: string };
    brand?: string;
    // The model name the AI identity extraction read off the title. Set only
    // when it returned one; otherwise absent, and `flags` says why.
    model?: string;
    // `${brand} ${model}`, set exactly when `model` is.
    displayName?: string;
    aliases?: string[];
    externalId?: string;
    // The title exactly as the shop publishes it.
    originalName?: string;
    // What its import did that its fields alone don't show — why it has no
    // `model`, say. See the backend's SCRAPED_PRODUCT_FLAGS.
    flags?: ScrapedProductFlag[];
    releaseYear?: number;
    specs?: ProductSpecs;
    // The deterministic, label-matching spec mapping before the LLM
    // post-process pass merges its own contribution on top to produce
    // `specs` above — also exactly what was sent to the LLM as input.
    extractedSpecs?: ProductSpecs;
    // The offer-level part of `extractedSpecs` (frame size, colour…), which
    // goes to the offer entries rather than to the product's specs.
    offerLevelDeterministicSpecs?: ProductSpecs;
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
    offers?: ScrapedOffer[];
  };
  specValid?: boolean;
  specErrors?: Record<string, any>;
  lastUpdated: string;
  deduplicated: boolean;
  // Normalized identity key used for Path-1 dedup matching (see backend
  // ProductScrapeUpdaterService), derived from scrapedProduct at scrape time.
  // Null on a source that does not identify products: nothing matches on it.
  normalizedSourceName?: string | null;
  // The linked supplier/source config, e.g. "ebikeshop". Null for manual (admin-entered) specs.
  // The product details route also joins its seller and multi-source settings.
  source?: {
    id: string;
    name: string;
    type?: ProductSourceType;
    priority?: number;
    identifiesProducts?: boolean;
    hasAllProducts?: boolean;
    seller?: { id: string; name: string } | null;
  } | null;
  // The offers this listing supplied the price of — the seller's
  // highest-priority listing of each. Other fields may come from its other sources.
  offers?: Offer[];
}
