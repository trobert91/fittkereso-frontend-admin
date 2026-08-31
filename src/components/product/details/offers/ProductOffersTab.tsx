"use client";

import { selectProduct } from "@/store/slices/product-slice";
import { useAppSelector } from "@/store/store-hooks";
import { ProductOffersList } from "./ProductOffersList";

export function ProductOffersTab() {
  const product = useAppSelector(selectProduct);

  if (!product) {
    return null;
  }

  return <ProductOffersList offers={product.offers} />;
}
