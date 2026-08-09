import { BaseEntity } from "./base-entity";
import { ProductCategory } from "./product-category";

export interface ThreadProductCategory extends BaseEntity {
  productCategory: ProductCategory;
  confidence: number;
  rank: number;
}
