"use client";

import { useState } from "react";
import { Button, Group, Modal, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { deleteProductSource } from "@/api-actions/product/product-actions";
import { useAppDispatch } from "@/store/store-hooks";
import { setProduct } from "@/store/slices/product-slice";

interface DeleteSourceButtonProps {
  productId: string;
  sourceId: string;
}

export function DeleteSourceButton({
  productId,
  sourceId,
}: DeleteSourceButtonProps) {
  const [opened, setOpened] = useState(false);
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();

  const onConfirm = async () => {
    setLoading(true);

    try {
      const updatedProduct = await deleteProductSource(productId, sourceId);
      dispatch(setProduct(updatedProduct));

      notifications.show({
        title: "Success",
        message: "Source deleted",
        color: "green",
      });

      setOpened(false);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to delete source",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        size="xs"
        variant="light"
        color="red"
        onClick={() => setOpened(true)}
      >
        Delete
      </Button>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Delete source"
        centered
      >
        <Stack>
          <Text>Are you sure you want to delete this source?</Text>
          <Text c="dimmed" size="sm">
            This action cannot be undone.
          </Text>

          <Group justify="flex-end">
            <Button variant="default" onClick={() => setOpened(false)}>
              Cancel
            </Button>
            <Button color="red" loading={loading} onClick={onConfirm}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
