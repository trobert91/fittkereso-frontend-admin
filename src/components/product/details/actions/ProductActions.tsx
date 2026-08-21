"use client";

import { Button, Drawer, Stack } from "@mantine/core";
import { IoMdSettings } from "react-icons/io";
import { useSelector } from "react-redux";
import { selectProduct } from "@/store/slices/product-slice";
import { useState } from "react";
import { MergeProductAction } from "./MergeProductAction";
import { MergeSourcesAction } from "./MergeSourcesAction";
import { QueueReviewAnalysisAction } from "./QueueReviewAnalysisAction";
import { RecalculateRatingAction } from "./RecalculateRatingAction";

export const ProductActions = () => {
  const product = useSelector(selectProduct);

  const [opened, setOpened] = useState(false);

  if (!product) {
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
        title="Product Actions"
        position="right"
        size="md"
      >
        <Stack gap="md">
          <RecalculateRatingAction productId={product.id} />
          <QueueReviewAnalysisAction productId={product.id} />
          <MergeProductAction sourceProduct={product} />
          <MergeSourcesAction productId={product.id} />
        </Stack>
      </Drawer>
    </>
  );
};
