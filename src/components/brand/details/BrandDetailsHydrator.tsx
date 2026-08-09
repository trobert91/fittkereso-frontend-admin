"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/store/store-hooks";
import { Brand } from "@/models/brand";
import { setBrand } from "@/store/slices/brand-slice";
import { BrandDetails } from "./BrandDetails";

export function BrandDetailsHydrator({ brand }: { brand: Brand }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (brand) dispatch(setBrand(brand));
  }, [brand, dispatch]);

  return <BrandDetails />;
}
