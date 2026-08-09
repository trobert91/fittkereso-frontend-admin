"use client";

import { Button, Divider, Drawer, Stack } from "@mantine/core";
import { IoMdSettings } from "react-icons/io";
import { ScheduleThreadProcessingAction } from "./actions/ScheduleThreadProcessingAction";
import { ResetThreadAction } from "./actions/ResetThreadAction";
import { DeleteThreadAction } from "./actions/DeleteThreadAction";
import { useSelector } from "react-redux";
import { selectThreadId } from "@/store/slices/thread-slice";
import { useState } from "react";

export const ThreadActions = () => {
  const threadId = useSelector(selectThreadId);

  const [opened, setOpened] = useState(false);

  if (!threadId) {
    return null;
  }

  return (
    <>
      <Button
        leftSection={<IoMdSettings size={16} />}
        onClick={() => setOpened(true)}
      >
        Actions
      </Button>

      <Drawer
        opened={opened}
        onClose={() => setOpened(false)}
        title="Thread Actions"
        position="right"
        size="md"
      >
        <Stack gap="md">
          <ScheduleThreadProcessingAction threadId={threadId} />
          <ResetThreadAction threadId={threadId} />
          <Divider />
          <DeleteThreadAction threadId={threadId} />
        </Stack>
      </Drawer>
    </>
  );
};
