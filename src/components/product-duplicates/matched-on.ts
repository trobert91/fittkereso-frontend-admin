import { ProductDuplicateMatchedOn } from "@/models/dtos/product-duplicate-search-models";

/** An identifier both products carry, as opposed to names that look alike. */
export type ProductDuplicateIdentifier = Extract<
  ProductDuplicateMatchedOn,
  "sibling" | "gtin" | "mpn"
>;

export const MATCHED_ON_LABELS: Record<ProductDuplicateMatchedOn, string> = {
  name: "name",
  alias: "alias",
  sibling: "declared size",
  gtin: "GTIN",
  mpn: "MPN",
};

/**
 * True for a pair an import or scan found through a shared identifier. Such a
 * pair has no name comparison behind it: its score is a flat 100, and the
 * identifier is the evidence.
 */
export function isIdentifierMatch(
  matchedOn: ProductDuplicateMatchedOn,
): matchedOn is ProductDuplicateIdentifier {
  return matchedOn === "sibling" || matchedOn === "gtin" || matchedOn === "mpn";
}
