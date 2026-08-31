import { BaseEntity } from "./base-entity";
import { Brand } from "./brand";
import { Offer } from "./offer";
import { ProductAlias } from "./product-alias";
import { ProductCategory } from "./product-category";
import { ProductImage } from "./product-image";
import { ProductSourceRecord } from "./product-source";
import { OrderedSpec, ProductSpecs } from "./product-specs";
import { ProductRating } from "./rating-types";
import { ScrapeTask } from "./dtos/scrape-task-search-models";

export interface ProductModel extends BaseEntity {
  displayName: string;
  model: string;
  slug?: string | null;

  brand: Brand;
  productCategory: ProductCategory;

  mainImage?: ProductImage;
  images?: ProductImage[];

  normalizedName?: string; // adminList
  enabled?: boolean; // adminList
  releaseYear?: number; // adminList/details

  // Denormalized from this product's cheapest active offer (see
  // ProductMergeService.recomputePrice on the backend), so listings can filter
  // and sort by price without joining Offers.
  price?: number;
  /** That same offer's pre-discount price; absent when it is not discounted. */
  priceWithoutDiscount?: number;

  specs?: ProductSpecs; // adminList/details
  orderedSpecs?: OrderedSpec[];
  specValid?: boolean;
  specErrors?: Record<string, any>;

  description?: string; // details

  rating?: ProductRating | null;
  ratingLastUpdated?: string | null; // adminList

  // Every offer on this product across all sellers, returned by the product
  // details endpoint (newest `lastSeenAt` first). Distinct from
  // `sources[].offers`, which is only the subset tied to one source listing.
  offers?: Offer[]; // details

  // Admin only:
  sources?: ProductSourceRecord[];
  aliases?: ProductAlias[];
  scrapeTasks?: ScrapeTask[];
}
