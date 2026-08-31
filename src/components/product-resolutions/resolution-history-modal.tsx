"use client";

import { Modal, Portal, Stack, Text } from "@mantine/core";
import { ProductResolutionRecord } from "@/api-actions/product/product-resolutions";
import { ResolutionDecisionTimeline } from "./resolution-decision-timeline";

/**
 * The decision log on its own.
 *
 * History is reference material, not part of deciding: it answers "how did this
 * row get here" rather than "what should happen to it". Keeping it in a
 * dedicated modal — reachable from the card header, and nowhere else — keeps the
 * review surfaces about the current state, and means the log is never a thing
 * you scroll past on the way to the actions.
 */
export function ResolutionHistoryModal({
  resolution,
  opened,
  onClose,
}: {
  resolution: ProductResolutionRecord | null;
  opened: boolean;
  onClose: () => void;
}) {
  return (
    <Portal reuseTargetNode={false}>
      <Modal
        opened={opened && !!resolution}
        onClose={onClose}
        title="Decision history"
        centered
        size="lg"
      >
        {resolution && (
          <Stack gap="sm">
            <Text size="xs" c="dimmed">
              Every decision made about this record, newest first — the system&apos;s
              own verdict and each human correction since.
            </Text>
            <ResolutionDecisionTimeline resolution={resolution} />
          </Stack>
        )}
      </Modal>
    </Portal>
  );
}
