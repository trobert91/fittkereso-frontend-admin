"use client";

import { useState } from "react";
import { notifications } from "@mantine/notifications";
import { Button, Group, Modal, Portal, Stack, Text } from "@mantine/core";
import { IoIosFlash } from "react-icons/io";
import { queueProductReviewAnalysis } from "@/api-actions/product/product-actions";

export const QueueReviewAnalysisAction = ({
  productId,
}: {
  productId: string;
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const onConfirm = async () => {
    setLoading(true);

    try {
      await queueProductReviewAnalysis(productId);

      notifications.show({
        title: "Queued",
        message: "Product review analysis task queued",
        color: "green",
      });

      setModalOpen(false);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to queue product review analysis",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        leftSection={<IoIosFlash size={16} />}
        onClick={() => setModalOpen(true)}
      >
        Run review analysis
      </Button>

      <Portal reuseTargetNode={false}>
        <Modal
          opened={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Run review analysis"
          centered
          size="lg"
        >
          <Stack gap="md">
            <Text>
              Queue a new product review analysis task for this product? The
              task runs asynchronously and regenerates the TL;DR, summary,
              pros, cons, and per-label headlines/narratives.
            </Text>

            <Group justify="flex-end">
              <Button variant="default" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button loading={loading} onClick={onConfirm}>
                Queue
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Portal>
    </>
  );
};
