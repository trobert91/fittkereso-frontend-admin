"use client";

import { useState } from "react";
import { useDispatch } from "react-redux";
import { notifications } from "@mantine/notifications";
import { Button, Group, Modal, Portal, Stack, Text } from "@mantine/core";
import { IoIosRefresh } from "react-icons/io";
import { resetThread } from "@/api-actions/thread/thread-actions";
import { setThread } from "@/store/slices/thread-slice";

export const ResetThreadAction = ({ threadId }: { threadId: string }) => {
  const dispatch = useDispatch();

  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const onConfirm = async () => {
    setLoading(true);

    try {
      const updatedThread = await resetThread(threadId);

      notifications.show({
        title: "Success",
        message: "Thread reset to NEW successfully",
        color: "green",
      });

      dispatch(setThread(updatedThread));
      setModalOpen(false);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to reset thread",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        color="orange"
        leftSection={<IoIosRefresh size={16} />}
        onClick={() => setModalOpen(true)}
      >
        Reset thread
      </Button>

      <Portal reuseTargetNode={false}>
        <Modal
          opened={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Reset thread"
          centered
          size="lg"
        >
          <Stack gap="md">
            <Text>
              Are you sure you want to reset this thread? All comments, product
              references, and processing traces will be deleted. The thread
              itself will be kept and its status will be reset to NEW, ready for
              reprocessing.
            </Text>

            <Group justify="flex-end">
              <Button variant="default" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button color="orange" loading={loading} onClick={onConfirm}>
                Reset
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Portal>
    </>
  );
};
