"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/store/store-hooks";
import { ProductCategory } from "@/models/product-category";
import { setCategory } from "@/store/slices/category-slice";
import { CategoryDetails } from "./CategoryDetails";

export function CategoryDetailsHydrator({
  category,
}: {
  category: ProductCategory;
}) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (category) dispatch(setCategory(category));
  }, [category, dispatch]);

  return <CategoryDetails />;
}
