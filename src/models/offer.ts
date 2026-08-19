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
  currency: string;
  url?: string;
  availability: OfferAvailability;
  sourceListingId?: string;
  lastSeenAt: string;
  active: boolean;

  // Used-goods fields
  mileageKm?: number;
  purchaseDate?: string;
  batteryHealthPercent?: number;
  serviceHistory?: string;
  usedConditionNotes?: string;

  specs?: ProductSpecs;
}
