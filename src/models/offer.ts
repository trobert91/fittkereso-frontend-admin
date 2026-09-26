import { BaseEntity } from "./base-entity";
import { ProductSpecs } from "./product-specs";

export enum OfferCondition {
  new = "new",
  used = "used",
  refurbished = "refurbished",
}

export enum OfferAvailability {
  in_stock = "in_stock",
  out_of_stock = "out_of_stock",
  preorder = "preorder",
  unknown = "unknown",
}

export interface OfferSeller {
  id: string;
  name: string;
  slug?: string | null;
  logoUrl?: string;
  location?: string;
  verified: boolean;
}

export interface Offer extends BaseEntity {
  seller: OfferSeller;
  condition: OfferCondition;
  price: number;
  priceWithoutDiscount?: number;
  currency: string;
  url?: string;
  /** Absent when the source publishes no stock data at all — distinct from `unknown`, which means it published something unmappable. */
  availability?: OfferAvailability | null;
  externalId?: string;
  /**
   * The size's GS1 barcode, as a checksum-valid GTIN-14 (an EAN-13 gains a
   * leading zero). Null when the source published none, or an invalid one.
   */
  gtin?: string | null;
  /** The manufacturer's article number, uppercased with spaces and hyphens removed. */
  mpn?: string | null;
  lastSynced: string;

  // Used-goods fields
  mileageKm?: number;
  purchaseDate?: string;
  batteryHealthPercent?: number;
  serviceHistory?: string;
  usedConditionNotes?: string;

  locations?: string[];
  specs?: ProductSpecs;
}
