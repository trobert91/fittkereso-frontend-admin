"use client";

import { useState } from "react";
import { useDispatch } from "react-redux";
import { notifications } from "@mantine/notifications";
import { Button, Group, Modal, Portal, Stack, Text } from "@mantine/core";
import { FaTrash } from "react-icons/fa";
import { deleteThread } from "@/api-actions/thread/thread-actions";
import { setThread } from "@/store/slices/thread-slice";

export const DeleteThreadAction = ({ threadId }: { threadId: string }) => {
  const dispatch = useDispatch();

  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const onConfirm = async () => {
    setLoading(true);

    try {
      const updatedThread = await deleteThread(threadId);

      notifications.show({
        title: "Success",
        message: "Thread deleted successfully",
        color: "green",
      });

      dispatch(setThread(updatedThread));
      setModalOpen(false);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to delete thread",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        color="red"
        leftSection={<FaTrash size={14} />}
        onClick={() => setModalOpen(true)}
      >
        Delete thread
      </Button>

      <Portal reuseTargetNode={false}>
        <Modal
          opened={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Delete thread"
          centered
          size="lg"
        >
          <Stack gap="md">
            <Text>
              Are you sure you want to delete this thread? All comments, product
              references, and processing traces will be removed. The thread will
              be marked as deleted.
            </Text>

            <Group justify="flex-end">
              <Button variant="default" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button color="red" loading={loading} onClick={onConfirm}>
                Delete
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Portal>
    </>
  );
};
