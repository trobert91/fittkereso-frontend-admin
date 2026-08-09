"use client";

import { Alert, Stack, Tabs } from "@mantine/core";
import { GrGallery } from "react-icons/gr";
import { FaDatabase, FaEdit, FaList, FaStar, FaTable, FaTags, FaTasks } from "react-icons/fa";
import { useAppSelector } from "@/store/store-hooks";
import {
  selectProduct,
  selectProductLoading,
} from "@/store/slices/product-slice";
import { ProductBaseInfoTab } from "./ProductBaseInfoTab";
import ProductGalleryEditor from "./gallery/ProductGalleryEditor";
import { ProductSpecEditor } from "./specs/ProductSpecEditor";
import { AdminSpecTable } from "./specs/AdminSpecTable";
import { ProductHeroHeader } from "./hero/ProductHeroHeader";
import { IoMdAlert } from "react-icons/io";
import { ProductSourcesTab } from "./sources/ProductSourcesTab";
import { ProductScrapeTasksTab } from "./scrape-tasks/ProductScrapeTasksTab";
import { ProductAliasesTab } from "./aliases/ProductAliasesTab";
import { ProductRatingTab } from "./rating/ProductRatingTab";

export const ProductDetails = () => {
  const product = useAppSelector(selectProduct);
  const loading = useAppSelector(selectProductLoading);
  if (!product || (loading && !product)) {
    return <div>Loading...</div>;
  }

  return (
    <Stack gap="xl" mt="lg">
      {!product.specValid && (
        <Alert
          title="Specification errors detected"
          variant="light"
          color="red"
          icon={<IoMdAlert />}
        >
          {JSON.stringify(product.specErrors, null, 2)}
        </Alert>
      )}

      <ProductHeroHeader product={product} />

      <Tabs defaultValue="baseInfo">
        <Tabs.List>
          <Tabs.Tab value="baseInfo" leftSection={<GrGallery size={12} />}>
            Base info
          </Tabs.Tab>
          <Tabs.Tab value="gallery" leftSection={<GrGallery size={12} />}>
            Gallery
          </Tabs.Tab>
          <Tabs.Tab value="specsView" leftSection={<FaTable size={12} />}>
            Specifications
          </Tabs.Tab>
          <Tabs.Tab value="specsEdit" leftSection={<FaEdit size={12} />}>
            Edit specs
          </Tabs.Tab>
          <Tabs.Tab value="rating" leftSection={<FaStar size={12} />}>
            Rating
          </Tabs.Tab>
          <Tabs.Tab value="sources" leftSection={<FaDatabase size={12} />}>
            Sources
          </Tabs.Tab>
          <Tabs.Tab value="scrapeTasks" leftSection={<FaTasks size={12} />}>
            Scrape Tasks
          </Tabs.Tab>
          <Tabs.Tab value="aliases" leftSection={<FaTags size={12} />}>
            Aliases
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="baseInfo" pt="lg">
          <ProductBaseInfoTab />
        </Tabs.Panel>

        <Tabs.Panel value="gallery" pt="lg">
          <ProductGalleryEditor product={product} />
        </Tabs.Panel>

        <Tabs.Panel value="specsView" pt="lg">
          <AdminSpecTable specs={product.orderedSpecs ?? []} />
        </Tabs.Panel>

        <Tabs.Panel value="specsEdit" pt="lg">
          <ProductSpecEditor product={product} />
        </Tabs.Panel>

        <Tabs.Panel value="rating" pt="lg">
          <ProductRatingTab />
        </Tabs.Panel>

        <Tabs.Panel value="sources" pt="lg">
          <ProductSourcesTab />
        </Tabs.Panel>

        <Tabs.Panel value="scrapeTasks" pt="lg">
          <ProductScrapeTasksTab />
        </Tabs.Panel>

        <Tabs.Panel value="aliases" pt="lg">
          <ProductAliasesTab />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
};
