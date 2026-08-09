"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Group,
  Loader,
  Modal,
  Portal,
  Select,
  Stack,
  Text,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { postTriggerDuplicateDetection } from "@/api-actions/product/product-duplicates";
import { postCategorySearch } from "@/api-actions/category/category-search";
import { ProductCategory } from "@/models/product-category";
import { PiShield } from "react-icons/pi";

interface TriggerDetectionModalProps {
  onComplete: () => void;
}

export function TriggerDetectionModal({
  onComplete,
}: TriggerDetectionModalProps) {
  const [opened, setOpened] = useState(false);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!opened) return;

    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const result = await postCategorySearch({
          page: 1,
          pageSize: 100,
          autoDeduplicationEnabled: true,
        });
        setCategories(result.items || []);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, [opened]);

  const handleOpen = () => {
    setSelectedCategoryId(null);
    setOpened(true);
  };

  const handleRun = async () => {
    setRunning(true);
    try {
      const summary = await postTriggerDuplicateDetection(
        selectedCategoryId || undefined,
      );

      notifications.show({
        color: "green",
        title: "Duplicate detection completed",
        message: `${summary.totalPairsEvaluated} pairs evaluated, ${summary.autoMerged} auto-merged, ${summary.pendingReview} pending review`,
      });

      setOpened(false);
      onComplete();
    } catch (err) {
      notifications.show({
        color: "red",
        title: "Detection failed",
        message: err instanceof Error ? err.message : "An error occurred",
      });
    } finally {
      setRunning(false);
    }
  };

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  return (
    <>
      <Button
        leftSection={<PiShield size={16} />}
        onClick={handleOpen}
        variant="light"
      >
        Run detection
      </Button>

      <Portal reuseTargetNode={false}>
        <Modal
          opened={opened}
          onClose={() => setOpened(false)}
          title="Run duplicate detection"
          centered
          size="md"
        >
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              Run the duplicate detection pipeline. Optionally select a category
              to limit the scan. Only categories with auto-deduplication enabled
              are shown.
            </Text>

            {categoriesLoading ? (
              <Group justify="center" py="sm">
                <Loader size="sm" />
              </Group>
            ) : (
              <Select
                label="Category (optional)"
                placeholder="All enabled categories"
                data={categoryOptions}
                value={selectedCategoryId}
                onChange={setSelectedCategoryId}
                searchable
                clearable
              />
            )}

            <Group justify="flex-end">
              <Button
                variant="default"
                onClick={() => setOpened(false)}
                disabled={running}
              >
                Cancel
              </Button>
              <Button
                color="orange"
                loading={running}
                onClick={handleRun}
                disabled={categoriesLoading}
              >
                Run detection
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Portal>
    </>
  );
}
