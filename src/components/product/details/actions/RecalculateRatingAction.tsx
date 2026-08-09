"use client";

import { useState } from "react";
import { useDispatch } from "react-redux";
import { notifications } from "@mantine/notifications";
import { Button, Group, Modal, Portal, Stack, Text } from "@mantine/core";
import { IoIosRefresh } from "react-icons/io";
import { recalculateProductRating } from "@/api-actions/product/product-actions";
import { setProduct } from "@/store/slices/product-slice";

export const RecalculateRatingAction = ({
  productId,
}: {
  productId: string;
}) => {
  const dispatch = useDispatch();

  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const onConfirm = async () => {
    setLoading(true);

    try {
      const updatedProduct = await recalculateProductRating(productId);

      notifications.show({
        title: "Success",
        message: "Product rating recalculated successfully",
        color: "green",
      });

      dispatch(setProduct(updatedProduct));
      setModalOpen(false);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to recalculate product rating",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        leftSection={<IoIosRefresh size={16} />}
        onClick={() => setModalOpen(true)}
      >
        Recalculate rating
      </Button>

      <Portal reuseTargetNode={false}>
        <Modal
          opened={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Recalculate rating"
          centered
          size="lg"
        >
          <Stack gap="md">
            <Text>
              Are you sure you want to recalculate the rating for this product?
              This will recompute the rating based on all current reviews.
            </Text>

            <Group justify="flex-end">
              <Button variant="default" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button loading={loading} onClick={onConfirm}>
                Recalculate
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Portal>
    </>
  );
};
