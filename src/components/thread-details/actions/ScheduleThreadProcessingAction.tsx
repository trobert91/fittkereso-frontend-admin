"use client";

import { useState } from "react";
import { notifications } from "@mantine/notifications";
import { Button, Modal, Portal, Stack, Text } from "@mantine/core";
import { IoIosRefresh } from "react-icons/io";
import { postScheduleThreadProcessing } from "@/api-actions/thread/thread-actions";

export const ScheduleThreadProcessingAction = ({
  threadId,
}: {
  threadId: string;
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setLoading(true);

    try {
      await postScheduleThreadProcessing(threadId);

      notifications.show({
        title: "Success",
        message: "Thread processing scheduled successfully",
        color: "green",
      });
      handleClose();
    } catch (err) {
      notifications.show({
        title: "Error",
        message: "Failed to schedule thread processing",
        color: "red",
      });
      setLoading(false);
    }
  };

  const handleClose = () => {
    setModalOpen(false);
    setLoading(false);
  };

  return (
    <>
      <Button
        leftSection={<IoIosRefresh size={16} />}
        onClick={() => setModalOpen(true)}
      >
        Trigger processing
      </Button>

      <Portal reuseTargetNode={false}>
        <Modal
          opened={modalOpen}
          onClose={handleClose}
          title="Process thread"
          centered
          size="lg"
        >
          <form>
            <Stack gap="md">
              <Text>
                Are you sure you want to schedule processing for this thread?
              </Text>

              <Button loading={loading} onClick={() => onSubmit()}>
                Schedule Processing
              </Button>
            </Stack>
          </form>
        </Modal>
      </Portal>
    </>
  );
};
