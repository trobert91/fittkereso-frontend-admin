import { BaseEntity } from "./base-entity";

export interface ProductImage extends BaseEntity {
  url?: string;
  fileName: string;
  sourceUrl?: string;
  order: number;
}
