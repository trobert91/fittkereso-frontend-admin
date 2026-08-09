import { ProductModel } from "./product-model";
import { ProductReference } from "./product-reference";
import { ProductReferenceCandidate } from "./product-reference-candidate";

/**
 * Read-side helpers that mirror the backend's `getPrimaryCandidate` /
 * `getPrimaryModel` / `getPrimaryConfidence` family. The primary candidate
 * (`isPrimary === true`) is the single source of truth for "the resolved
 * product" on a reference. Multiple candidates mean the resolution was
 * ambiguous and the user's vote is split — the primary is still the top pick.
 */

export function getPrimaryCandidate(
  ref: Pick<ProductReference, "candidates"> | undefined | null,
): ProductReferenceCandidate | undefined {
  return ref?.candidates?.find((candidate) => candidate.isPrimary);
}

export function getPrimaryModel(
  ref: Pick<ProductReference, "candidates"> | undefined | null,
): ProductModel | undefined {
  return getPrimaryCandidate(ref)?.model;
}

export function getPrimaryConfidence(
  ref: Pick<ProductReference, "candidates"> | undefined | null,
): number | undefined {
  return getPrimaryCandidate(ref)?.confidence;
}

/** True when the reference has no resolved product. Mirrors backend `isUnresolved`. */
export function isUnresolved(
  ref: Pick<ProductReference, "candidates"> | undefined | null,
): boolean {
  return getPrimaryCandidate(ref) == null;
}
