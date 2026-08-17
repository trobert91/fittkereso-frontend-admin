import { BaseEntity } from "./base-entity";
import { Brand } from "./brand";
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

  specs?: ProductSpecs; // adminList/details
  orderedSpecs?: OrderedSpec[];
  specValid?: boolean;
  specErrors?: Record<string, any>;

  description?: string; // details

  rating?: ProductRating | null;
  ratingLastUpdated?: string | null; // adminList

  // Admin only:
  sources?: ProductSourceRecord[];
  aliases?: ProductAlias[];
  scrapeTasks?: ScrapeTask[];
}
