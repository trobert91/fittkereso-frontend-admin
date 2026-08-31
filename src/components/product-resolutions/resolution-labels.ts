import { compact, keyBy } from "lodash";
import {
  ProductResolutionFlow,
  ProductResolutionOrigin,
  ProductResolutionRecord,
  ProductResolutionStatus,
  ResolutionActionKind,
  ResolutionCorrection,
  ResolutionVerdict,
} from "@/api-actions/product/product-resolutions";
import { ProductModel } from "@/models/product-model";

/** Drives the card's border and header tint, as the status does on the
 *  userscores comment card. */
export const STATUS_COLORS: Record<ProductResolutionStatus, string> = {
  pending: "orange",
  done: "green",
  failed: "red",
  superseded: "gray",
};

export const STATUS_LABELS: Record<ProductResolutionStatus, string> = {
  pending: "pending",
  done: "done",
  failed: "failed",
  superseded: "superseded",
};

export const STATUS_OPTIONS: { value: ProductResolutionStatus; label: string }[] =
  [
    { value: "pending", label: "Pending" },
    { value: "failed", label: "Failed" },
    { value: "done", label: "Done" },
    { value: "superseded", label: "Superseded" },
  ];

export const FLOW_LABELS: Record<ProductResolutionFlow, string> = {
  product_resolution: "Resolution",
  duplicate_detection: "Duplicate",
};

export const FLOW_COLORS: Record<ProductResolutionFlow, string> = {
  product_resolution: "cyan",
  duplicate_detection: "grape",
};

export const FLOW_OPTIONS: { value: ProductResolutionFlow; label: string }[] = [
  { value: "product_resolution", label: "Product resolution" },
  { value: "duplicate_detection", label: "Duplicate detection" },
];

export const ORIGIN_LABELS: Record<ProductResolutionOrigin, string> = {
  scrape_time: "Scrape-time",
  nightly_detection: "Nightly",
};

export const ORIGIN_OPTIONS: { value: ProductResolutionOrigin; label: string }[] =
  [
    { value: "scrape_time", label: "Scrape-time (flagged live)" },
    { value: "nightly_detection", label: "Nightly detection" },
  ];

export const VERDICT_LABELS: Record<ResolutionVerdict, string> = {
  matched_existing: "matched existing",
  created_new: "created new",
  duplicate_proposed: "duplicate proposed",
  accept: "accepted",
  decline: "declined",
  reopen: "re-opened",
};

export const ACTION_KIND_LABELS: Record<ResolutionActionKind, string> = {
  match: "matched to product",
  create: "created product",
  merge: "merged products",
  split: "split into new product",
  none: "no catalog change",
};

/** What each correction does, in the reviewer's words. Used on the decline
 *  menu, so the consequence is visible before the click. */
export const CORRECTION_LABELS: Record<ResolutionCorrection, string> = {
  split: "Split into a new product",
  merge_into: "Merge into another product…",
  dismiss: "Just record the disagreement",
};

export const CORRECTION_DESCRIPTIONS: Record<ResolutionCorrection, string> = {
  split:
    "Carve the affected listings out onto a brand-new product, rebuilt from their scraped data.",
  merge_into:
    "Fold this product into one you pick. The source product is deleted afterwards.",
  dismiss: "Record that this was wrong without touching the catalog.",
};

/** `blockedReasons` are machine-readable on purpose; this is where they become
 *  something a reviewer can act on. */
const BLOCKED_REASON_LABELS: Record<string, string> = {
  merge_already_reversed:
    "this merge was already reversed — none of the listings it moved are still on the target",
  source_record_moved:
    "the listing has moved to a different product since this decision",
  listing_product_missing:
    "the product this listing pointed at no longer exists",
  no_source_record:
    "no scraped listing is linked to this record, so there is nothing to split",
  no_listing_product: "this record has no product to merge from",
  superseded: "a newer record replaced this one",
};

export function humanizeBlockedReason(reason: string): string {
  return BLOCKED_REASON_LABELS[reason] ?? reason.split("_").join(" ");
}

export function similarityColor(score: number): string {
  if (score >= 80) return "red";
  if (score >= 60) return "orange";
  return "yellow";
}

/**
 * Every product the row carries a full object for, keyed by id.
 *
 * Candidates are stored as a jsonb snapshot holding only ids and names — no
 * images — so this is how a candidate card gets a picture when the product
 * happens to also be one of the row's joined relations (which the chosen one
 * almost always is). Candidates with no match fall back to a name-only card.
 */
export function productLookup(
  resolution: ProductResolutionRecord,
): Record<string, ProductModel> {
  return keyBy(
    compact([
      resolution.productA,
      resolution.productB,
      resolution.resolvedProduct,
      resolution.sourceRecord?.model,
    ]),
    "id",
  );
}

/** The system's own verdict — always index 0 of the append-only log. */
export function systemDecision(resolution: ProductResolutionRecord) {
  return resolution.decisions?.[0];
}

/** How many candidates were rejected by a gate. The single best "is the
 *  automated call likely wrong?" signal available without opening the row. */
export function failedGateCount(resolution: ProductResolutionRecord): number {
  return (resolution.candidates ?? []).filter(
    (candidate) => !candidate.gates?.passed,
  ).length;
}
