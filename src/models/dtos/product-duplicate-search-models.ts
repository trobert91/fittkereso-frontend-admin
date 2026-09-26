import { BasePageResult } from "./base-page-result";
import { ProductModel } from "../product-model";

export type ProductDuplicateDetectedBy = "scrape" | "scan" | "merge";

/**
 * What connects a pair: names that look alike (`name`, `alias`), or an
 * identifier both products carry — a size one shop declared as a sibling, a
 * GTIN, or an MPN within one brand.
 */
export type ProductDuplicateMatchedOn =
  | "name"
  | "alias"
  | "sibling"
  | "gtin"
  | "mpn";

export type ProductDuplicatePairStatus = "open" | "dismissed";

export type ProductDuplicateGate =
  | "primarySpecMismatch"
  | "modelNumberMismatch"
  | "matcherSpecMismatch"
  // Only one of the two states a spec the category will not match without.
  | "specMissing";

/** A contradiction between the two products, with each one's value. */
export interface ProductDuplicateFailedGate {
  gate: ProductDuplicateGate;
  /** The spec key, for spec gates. */
  spec?: string;
  severity: number;
  /** Null on the side a `specMissing` gate found without the spec. */
  productAValue: unknown;
  productBValue: unknown;
}

export interface ProductDuplicatePair {
  id: string;
  createdAt: string;
  updatedAt: string;
  productAId: string;
  productBId: string;
  productA: ProductModel;
  productB: ProductModel;
  similarityScore: number;
  matchedOn: ProductDuplicateMatchedOn;
  matchedValue: string;
  failedGates: ProductDuplicateFailedGate[];
  nameSimilarity?: {
    trigram: number;
    levenshtein: number;
    /** Absent on rows detected before baseScore became a blend. */
    alignment?: number;
  } | null;
  detectedBy: ProductDuplicateDetectedBy;
  dismissedAt?: string | null;
}

export interface ProductDuplicatePairSearchParams {
  status?: ProductDuplicatePairStatus;
  categoryIds?: string[];
  brandIds?: string[];
  productId?: string;
  minScore?: number;
  maxScore?: number;
  detectedBy?: ProductDuplicateDetectedBy[];

  page?: number;
  pageSize?: number;

  sort?: "similarityScore" | "createdAt";
  order?: "ASC" | "DESC";
}

export type ProductDuplicatePairSearchResult =
  BasePageResult<ProductDuplicatePair> & {
    status?: ProductDuplicatePairStatus;
    categoryIds?: string[];
    minScore?: number;
    maxScore?: number;
  };

export type ProductDuplicateScanResult = { started: boolean } | { pairs: number };
