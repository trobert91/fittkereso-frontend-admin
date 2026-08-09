"use client";

import { useState } from "react";
import { Button, Drawer, Stack } from "@mantine/core";
import { IoMdSettings } from "react-icons/io";
import { useAppSelector } from "@/store/store-hooks";
import { selectProductSource } from "@/store/slices/product-source-slice";
import { TriggerProductSourceFullSyncAction } from "./TriggerProductSourceFullSyncAction";
import { TriggerProductSourceIncrementalSyncAction } from "./TriggerProductSourceIncrementalSyncAction";

export function ProductSourceActions() {
  const productSource = useAppSelector(selectProductSource);
  const [opened, setOpened] = useState(false);

  if (!productSource) {
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
        title="Product Source Actions"
        position="right"
        size="md"
      >
        <Stack gap="md">
          <TriggerProductSourceFullSyncAction
            productSourceId={productSource.id}
          />
          <TriggerProductSourceIncrementalSyncAction
            productSourceId={productSource.id}
          />
        </Stack>
      </Drawer>
    </>
  );
}
