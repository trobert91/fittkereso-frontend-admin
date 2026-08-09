import { BaseEntity } from "./base-entity";

export interface BrandAlias extends BaseEntity {
  alias: string;
  source: string;
}

export interface Brand extends BaseEntity {
  name: string;
  slug?: string;
  domains?: string[];
  aliases?: BrandAlias[];
}
