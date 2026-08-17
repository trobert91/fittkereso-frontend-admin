"use client";

import { useState } from "react";
import { Button, Group, Modal, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { resyncProductSource } from "@/api-actions/product/product-actions";

interface ResyncSourceButtonProps {
  productId: string;
  sourceRecordId: string;
  sourceUrl: string;
}

export function ResyncSourceButton({
  productId,
  sourceRecordId,
  sourceUrl,
}: ResyncSourceButtonProps) {
  const [opened, setOpened] = useState(false);
  const [loading, setLoading] = useState(false);

  const onConfirm = async () => {
    setLoading(true);

    try {
      await resyncProductSource(productId, sourceRecordId);

      notifications.show({
        title: "Success",
        message: "Source resync queued",
        color: "green",
      });

      setOpened(false);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to queue source resync",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button size="xs" variant="light" onClick={() => setOpened(true)}>
        Resync
      </Button>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Resync source"
        centered
      >
        <Stack>
          <Text>Are you sure you want to queue a resync for this source?</Text>
          <Text c="dimmed" size="sm" style={{ wordBreak: "break-all" }}>
            {sourceUrl}
          </Text>

          <Group justify="flex-end">
            <Button variant="default" onClick={() => setOpened(false)}>
              Cancel
            </Button>
            <Button loading={loading} onClick={onConfirm}>
              Queue resync
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
