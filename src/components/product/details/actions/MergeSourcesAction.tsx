"use client";

import { useState } from "react";
import { useDispatch } from "react-redux";
import { notifications } from "@mantine/notifications";
import { Button, Group, Modal, Portal, Stack, Text } from "@mantine/core";
import { IoIosGitMerge } from "react-icons/io";
import { mergeProductSources } from "@/api-actions/product/product-actions";
import { setProduct } from "@/store/slices/product-slice";

export const MergeSourcesAction = ({ productId }: { productId: string }) => {
  const dispatch = useDispatch();

  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const onConfirm = async () => {
    setLoading(true);

    try {
      const updatedProduct = await mergeProductSources(productId);

      notifications.show({
        title: "Success",
        message: "Product sources merged successfully",
        color: "green",
      });

      dispatch(setProduct(updatedProduct));
      setModalOpen(false);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to merge product sources",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        leftSection={<IoIosGitMerge size={16} />}
        onClick={() => setModalOpen(true)}
      >
        Merge sources
      </Button>

      <Portal reuseTargetNode={false}>
        <Modal
          opened={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Merge sources"
          centered
          size="lg"
        >
          <Stack gap="md">
            <Text>
              Are you sure you want to recompute this product from its
              sources? This will recompute its specs and identity fields
              (brand, model, display name, release year, aliases) from all of
              its current sources.
            </Text>

            <Group justify="flex-end">
              <Button variant="default" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button loading={loading} onClick={onConfirm}>
                Merge sources
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Portal>
    </>
  );
};
