"use client";

import { useEffect } from "react";
import { ProductSource } from "@/models/dtos/product-source-search-models";
import { useAppDispatch } from "@/store/store-hooks";
import { setProductSource } from "@/store/slices/product-source-slice";
import { ProductSourceDetails } from "./ProductSourceDetails";

export function ProductSourceDetailsHydrator({
  productSource,
}: {
  productSource: ProductSource;
}) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (productSource) {
      dispatch(setProductSource(productSource));
    }
  }, [productSource, dispatch]);

  return <ProductSourceDetails />;
}
