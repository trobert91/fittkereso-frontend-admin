"use client";

import { Stack, Tabs } from "@mantine/core";
import { FaEdit, FaDatabase } from "react-icons/fa";
import { useAppSelector } from "@/store/store-hooks";
import { SellerDetailsForm } from "./SellerDetailsForm";
import { selectSeller, selectSellerLoading } from "@/store/slices/seller-slice";
import { SellerProductSourcesTab } from "./product-sources/SellerProductSourcesTab";

export const SellerDetails = () => {
  const seller = useAppSelector(selectSeller);
  const loading = useAppSelector(selectSellerLoading);
  if (!seller || loading) {
    return <div>Loading...</div>;
  }

  return (
    <Stack gap="xl" mt="lg">
      <Tabs defaultValue="details">
        <Tabs.List>
          <Tabs.Tab value="details" leftSection={<FaEdit size={12} />}>
            Details
          </Tabs.Tab>
          <Tabs.Tab value="productSources" leftSection={<FaDatabase size={12} />}>
            Product Sources
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="details" pt="lg">
          <SellerDetailsForm />
        </Tabs.Panel>

        <Tabs.Panel value="productSources" pt="lg">
          <SellerProductSourcesTab />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
};
