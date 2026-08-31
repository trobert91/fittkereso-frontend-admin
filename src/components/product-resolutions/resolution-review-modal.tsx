"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Card,
  Center,
  Divider,
  Group,
  Loader,
  Modal,
  Portal,
  Stack,
  Text,
  Textarea,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  getResolutionById,
  ResolutionListItem,
} from "@/api-actions/product/product-resolutions";
import { ScoreRing } from "@/components/score-ring";
import { ColoredBadge } from "@/components/colored-badge";
import { ResolutionActions } from "./resolution-actions";
import { ResolutionCandidateStrip } from "./resolution-candidate-strip";
import { ResolutionDecisionTimeline } from "./resolution-decision-timeline";
import { ResolutionEvidence } from "./resolution-evidence";
import { ResolutionPairStrip } from "./resolution-pair-strip";
import {
  FLOW_COLORS,
  FLOW_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
} from "./resolution-labels";

/**
 * The decision surface: the same evidence the card shows, plus the full history
 * and the note field.
 *
 * It refetches by id rather than reusing the list row, because the detail
 * endpoint derives `state` against live data — it will tell you an action is
 * unavailable (and why) where the list's cheaper pure derivation cannot.
 */
export function ResolutionReviewModal({
  resolutionId,
  onClose,
  onUpdated,
}: {
  resolutionId: string | null;
  onClose: () => void;
  onUpdated: (updated: ResolutionListItem) => void;
}) {
  const [item, setItem] = useState<ResolutionListItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const load = useCallback(async (id: string) => {
    setLoading(true);
    try {
      setItem(await getResolutionById(id));
    } catch (err) {
      notifications.show({
        color: "red",
        title: "Failed to load details",
        message: err instanceof Error ? err.message : "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!resolutionId) {
      setItem(null);
      setNote("");
      return;
    }
    load(resolutionId);
  }, [resolutionId, load]);

  const handleUpdated = (updated: ResolutionListItem) => {
    setItem(updated);
    setNote("");
    onUpdated(updated);
  };

  return (
    <Portal reuseTargetNode={false}>
      <Modal
        opened={!!resolutionId}
        onClose={() => !busy && onClose()}
        title="Review resolution"
        centered
        size="90%"
      >
        {loading && (
          <Center py="xl">
            <Loader />
          </Center>
        )}

        {!loading && item && (
          <Stack gap="md">
            <Header item={item} />

            <Card withBorder radius="sm" p={0}>
              <Card.Section inheritPadding py="md">
                {item.resolution.flow === "duplicate_detection" ? (
                  <ResolutionPairStrip
                    resolution={item.resolution}
                    showMergeDirection={!item.state.lastPerformed}
                  />
                ) : (
                  <ResolutionCandidateStrip resolution={item.resolution} />
                )}
              </Card.Section>

              <Card.Section withBorder inheritPadding>
                <ResolutionEvidence item={item} />
              </Card.Section>
            </Card>

            <Divider label="Decision history" labelPosition="left" />
            <ResolutionDecisionTimeline resolution={item.resolution} />

            <Divider label="Your decision" labelPosition="left" />
            <Textarea
              label="Note (optional)"
              placeholder="Why is this right or wrong? Stored on the log entry this action creates."
              value={note}
              onChange={(event) => setNote(event.currentTarget.value)}
              autosize
              minRows={2}
            />

            <Group justify="flex-end">
              <ResolutionActions
                item={item}
                note={note || undefined}
                size="sm"
                onUpdated={handleUpdated}
                onBusyChange={setBusy}
              />
            </Group>
          </Stack>
        )}
      </Modal>
    </Portal>
  );
}

function Header({ item }: { item: ResolutionListItem }) {
  const { resolution } = item;
  const statusColor = STATUS_COLORS[resolution.status] ?? "gray";

  return (
    <Group gap="sm" wrap="wrap">
      <ScoreRing
        rate={resolution.similarityScore}
        size={40}
        thickness={5}
        tooltip={`similarity: ${resolution.similarityScore}`}
      />
      <Badge color={statusColor} variant="light" size="sm" tt="none">
        {STATUS_LABELS[resolution.status]}
      </Badge>
      <Badge
        color={resolution.accepted ? "green" : "gray"}
        variant={resolution.accepted ? "filled" : "outline"}
        size="sm"
        tt="none"
      >
        {resolution.accepted ? "accepted" : "not accepted"}
      </Badge>
      <Badge color={FLOW_COLORS[resolution.flow]} variant="light" size="sm" tt="none">
        {FLOW_LABELS[resolution.flow]}
      </Badge>
      {resolution.decisionConfidence != null && (
        <ColoredBadge value={resolution.decisionConfidence} label="confidence" />
      )}
      {resolution.anchorKey && (
        <Text size="xs" c="dimmed">
          anchor: {resolution.anchorKey}
        </Text>
      )}
    </Group>
  );
}
