"use client";

import { Card, Stack } from "@mantine/core";
import { useAppSelector } from "@/store/store-hooks";
import { selectThread, selectThreadLoading } from "@/store/slices/thread-slice";
import { ThreadDetailsTable } from "./ThreadDetailTable";
import { ThreadCommentTree } from "./ThreadCommentTree";
import { ThreadCommentFilter } from "./ThreadCommentFilter";
import { ThreadRunsTable } from "./ThreadRunsTable";

export const ThreadDetails = () => {
  const thread = useAppSelector(selectThread);
  const loading = useAppSelector(selectThreadLoading);
  if (!thread || (loading && !thread)) {
    return <div>Loading...</div>;
  }

  return (
    <Stack gap="xl" mt="lg">
      <Card p="md" radius="md" withBorder>
        <ThreadDetailsTable thread={thread} />
      </Card>
      <Card p="md" radius="md" withBorder>
        <ThreadRunsTable runs={thread.runs ?? []} />
      </Card>
      <ThreadCommentFilter threadId={thread.id} />
      <ThreadCommentTree />
    </Stack>
  );
};
