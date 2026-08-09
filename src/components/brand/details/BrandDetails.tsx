"use client";

import { Stack } from "@mantine/core";
import { useAppSelector } from "@/store/store-hooks";
import { BrandDetailsForm } from "./BrandDetailsForm";
import { selectBrand, selectBrandLoading } from "@/store/slices/brand-slice";

export const BrandDetails = () => {
  const brand = useAppSelector(selectBrand);
  const loading = useAppSelector(selectBrandLoading);
  if (!brand || loading) {
    return <div>Loading...</div>;
  }

  return (
    <Stack gap="xl" mt="lg">
      <BrandDetailsForm />
    </Stack>
  );
};
