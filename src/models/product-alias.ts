import { BaseEntity } from "./base-entity";

export type ProductAliasSource = "scraped" | "auto_generated" | "manual";

export interface ProductAlias extends BaseEntity {
  alias: string;
  source: ProductAliasSource;
}
