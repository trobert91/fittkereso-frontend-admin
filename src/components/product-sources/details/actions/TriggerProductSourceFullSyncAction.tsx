"use client";

import { useEffect, useRef, useState } from "react";
import {
  Button,
  Group,
  Modal,
  MultiSelect,
  Stack,
  Text,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { postTriggerProductSourceFullSync } from "@/api-actions/product-source/product-source-actions";
import { postCategorySearch } from "@/api-actions/category/category-search";

interface CategoryOption {
  value: string;
  label: string;
}

export function TriggerProductSourceFullSyncAction({
  productSourceId,
}: {
  productSourceId: string;
}) {
  const [opened, setOpened] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const categoriesFetchStartedRef = useRef(false);

  useEffect(() => {
    if (!opened || categoriesFetchStartedRef.current) {
      return;
    }

    categoriesFetchStartedRef.current = true;
    setCategoriesLoading(true);

    postCategorySearch({
      page: 1,
      pageSize: 500,
      sort: "name",
      order: "ASC",
    })
      .then((result) => {
        const options = (result.items ?? []).map((category) => ({
          value: category.id,
          label: category.name,
        }));

        setCategoryOptions(options);
      })
      .catch(() => {
        categoriesFetchStartedRef.current = false;
        notifications.show({
          title: "Error",
          message: "Failed to load categories",
          color: "red",
        });
      })
      .finally(() => {
        setCategoriesLoading(false);
      });
  }, [opened]);

  const handleClose = () => {
    setOpened(false);
    setSelectedCategoryIds([]);
  };

  const onConfirm = async () => {
    setLoading(true);

    try {
      await postTriggerProductSourceFullSync(
        productSourceId,
        selectedCategoryIds.length > 0
          ? { categoryIds: selectedCategoryIds }
          : undefined,
      );

      notifications.show({
        title: "Success",
        message:
          selectedCategoryIds.length > 0
            ? `Full sync queued for ${selectedCategoryIds.length} categor${
                selectedCategoryIds.length === 1 ? "y" : "ies"
              }`
            : "Full sync queued",
        color: "green",
      });

      handleClose();
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to queue full sync",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpened(true)}>Trigger full sync</Button>

      <Modal
        opened={opened}
        onClose={handleClose}
        title="Trigger full sync"
        centered
      >
        <Stack>
          <Text>
            Are you sure you want to trigger a full sync for this product
            source?
          </Text>

          <MultiSelect
            label="Categories (optional)"
            description="Leave empty to sync all categories"
            placeholder={
              categoriesLoading ? "Loading categories..." : "Select categories"
            }
            data={categoryOptions}
            value={selectedCategoryIds}
            onChange={setSelectedCategoryIds}
            searchable
            clearable
            disabled={categoriesLoading}
            nothingFoundMessage="No categories found"
          />

          <Group justify="flex-end">
            <Button variant="default" onClick={handleClose}>
              Cancel
            </Button>
            <Button loading={loading} onClick={onConfirm}>
              Queue full sync
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
