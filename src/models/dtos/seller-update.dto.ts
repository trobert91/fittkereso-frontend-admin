import { SellerType } from "@/models/seller";

export interface SellerUpdateDto {
  name: string;
  type: SellerType;
  domains?: string[];
  logoUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  location?: string;
  verified?: boolean;
  active?: boolean;
}
