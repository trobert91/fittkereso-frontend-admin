"use client";

import { Stack } from "@mantine/core";
import { ProductSourceDetailsForm } from "./ProductSourceDetailsForm";
import {
  selectProductSource,
  selectProductSourceLoading,
} from "@/store/slices/product-source-slice";
import { useAppSelector } from "@/store/store-hooks";

export function ProductSourceDetails() {
  const productSource = useAppSelector(selectProductSource);
  const loading = useAppSelector(selectProductSourceLoading);

  if (!productSource || loading) {
    return <div>Loading...</div>;
  }

  return (
    <Stack gap="xl" mt="lg">
      <ProductSourceDetailsForm />
    </Stack>
  );
}
