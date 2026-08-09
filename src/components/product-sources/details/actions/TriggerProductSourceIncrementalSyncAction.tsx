"use client";

import { useState } from "react";
import { Button, Group, Modal, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { postTriggerProductSourceIncrementalSync } from "@/api-actions/product-source/product-source-actions";

export function TriggerProductSourceIncrementalSyncAction({
  productSourceId,
}: {
  productSourceId: string;
}) {
  const [opened, setOpened] = useState(false);
  const [loading, setLoading] = useState(false);

  const onConfirm = async () => {
    setLoading(true);

    try {
      await postTriggerProductSourceIncrementalSync(productSourceId);

      notifications.show({
        title: "Success",
        message: "Incremental sync queued",
        color: "green",
      });

      setOpened(false);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to queue incremental sync",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="light" onClick={() => setOpened(true)}>
        Trigger incremental sync
      </Button>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Trigger incremental sync"
        centered
      >
        <Stack>
          <Text>
            Are you sure you want to trigger an incremental sync for this
            product source?
          </Text>

          <Group justify="flex-end">
            <Button variant="default" onClick={() => setOpened(false)}>
              Cancel
            </Button>
            <Button loading={loading} onClick={onConfirm}>
              Queue incremental sync
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
