"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/store/store-hooks";
import { setProduct } from "@/store/slices/product-slice";
import { ProductDetails } from "./ProductDetails";
import { ProductModel } from "@/models/product-model";

export function ProductDetailsHydrator({ product }: { product: ProductModel }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (product) dispatch(setProduct(product));
  }, [product, dispatch]);

  return <ProductDetails />;
}
