import { sortBy } from "lodash";
import { ProductModel } from "@/models/product-model";

/**
 * The best image to show for a product, or undefined when it has none.
 *
 * A ProductImage carries two locations: `url`, our own copy on the CDN, and
 * `sourceUrl`, the shop's original. Only the first source scraped for a product
 * has its images copied, and the copy happens after the scrape, so a product
 * can sit with images that have a `sourceUrl` and no `url` yet. Reading `url`
 * alone shows nothing for those — which is why the gallery carousel has always
 * fallen back to `sourceUrl`.
 */
export function productImageUrl(
  product: Pick<ProductModel, "mainImage" | "images"> | null | undefined,
): string | undefined {
  if (!product) return undefined;

  const candidates = [
    product.mainImage,
    ...sortBy(product.images ?? [], "order"),
  ];

  for (const image of candidates) {
    const source = image?.url ?? image?.sourceUrl;
    if (source) return source;
  }

  return undefined;
}
