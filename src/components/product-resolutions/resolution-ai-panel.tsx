"use client";

import { useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Group,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { isEmpty } from "lodash";
import { FaCheck } from "react-icons/fa";
import { PiRobot } from "react-icons/pi";
import {
  postAcceptResolution,
  ResolutionAvailableAction,
  ResolutionCorrection,
  ResolutionListItem,
} from "@/api-actions/product/product-resolutions";
import {
  AI_CONFIDENCE_COLORS,
  AI_CONFIDENCE_LABELS,
  AI_VERDICT_LABELS,
  CORRECTION_LABELS,
} from "./resolution-labels";
import { ResolutionDeclineModal } from "./resolution-decline-modal";

/** The correction each recommendation maps to. `accept` is not a decline and
 *  has no correction — it goes through the accept path instead. */
const CORRECTION_BY_ACTION: Record<string, ResolutionCorrection | undefined> = {
  accept: undefined,
  dismiss: "dismiss",
  split: "split",
  merge_into: "merge_into",
};

/**
 * What the AI made of this row, and a way to act on it in one click.
 *
 * Only rendered for advisory verdicts — an executed one already changed the row,
 * and its reasoning belongs in the decision timeline with everything else that
 * actually happened. What is left here is a recommendation nobody has taken yet,
 * which is precisely the thing worth a button.
 *
 * The button introduces **no new action path**. It opens the same decline modal
 * a human would reach through the Decline menu, pre-filled with the AI's target
 * — so the confirmation, the target picker, and the note field are the ones
 * already trusted, and a recommendation gets no shortcut a person would not get.
 */
export function ResolutionAiPanel({
  item,
  onUpdated,
}: {
  item: ResolutionListItem;
  onUpdated: (updated: ResolutionListItem) => void;
}) {
  const [declineCorrection, setDeclineCorrection] =
    useState<ResolutionAvailableAction | null>(null);
  const [busy, setBusy] = useState(false);

  const { resolution, state } = item;
  const review = resolution.aiReview;

  // Nothing to advise on: never reviewed, or the verdict was already carried out
  // and now lives in the timeline as a decision rather than a suggestion.
  if (!review || review.executed) return null;

  const correction = CORRECTION_BY_ACTION[review.recommendedAction];
  const isAccept = review.recommendedAction === "accept";

  /** Whether the row will actually take this recommendation. The AI may have
   *  judged before something else changed the row, so this is re-read from the
   *  state the backend just shipped rather than assumed. */
  const available = state.availableActions.find((action) =>
    isAccept
      ? action.action === "accept"
      : action.action === "decline" && action.correction === correction,
  );

  const applyAccept = async () => {
    setBusy(true);
    try {
      const updated = await postAcceptResolution(
        resolution.id,
        `Applied the AI recommendation (${resolution.aiConfidence} confidence)`,
      );
      onUpdated(updated);
      notifications.show({
        color: "green",
        title: "Applied",
        message: "The AI's recommendation was carried out.",
      });
    } catch (err) {
      notifications.show({
        color: "red",
        title: "Could not apply",
        message: err instanceof Error ? err.message : "An error occurred",
      });
    } finally {
      setBusy(false);
    }
  };

  const applyDecline = () => {
    if (!available) return;
    // Hand the AI's target to the existing modal as its suggestion — the same
    // slot the backend uses to propose the product a split came from.
    setDeclineCorrection({
      ...available,
      suggestedTargetProductId:
        review.targetProductId ?? available.suggestedTargetProductId,
    });
  };

  return (
    <>
      <Card withBorder padding="sm" radius="md" bg="var(--mantine-color-grape-light)">
        <Stack gap="xs">
          <Group gap="xs" wrap="wrap">
            <Badge
              color="grape"
              variant="filled"
              size="sm"
              tt="none"
              leftSection={<PiRobot size={10} />}
            >
              AI review
            </Badge>
            {resolution.aiConfidence && (
              <Badge
                color={AI_CONFIDENCE_COLORS[resolution.aiConfidence]}
                variant="light"
                size="sm"
                tt="none"
              >
                {AI_CONFIDENCE_LABELS[resolution.aiConfidence]}
              </Badge>
            )}
            <Badge color="gray" variant="outline" size="sm" tt="none">
              {AI_VERDICT_LABELS[review.verdict]}
            </Badge>
            <Text size="xs" c="dimmed">
              suggests{" "}
              <Text span fw={600}>
                {correction
                  ? CORRECTION_LABELS[correction].replace("…", "")
                  : "accepting it"}
              </Text>
            </Text>
          </Group>

          <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
            {review.reasoning}
          </Text>

          {!isEmpty(review.evidenceCited) && (
            <Group gap={4} wrap="wrap">
              <Text size="xs" c="dimmed">
                Based on:
              </Text>
              {review.evidenceCited.map((evidence) => (
                <Badge key={evidence} size="xs" variant="outline" color="gray" tt="none">
                  {evidence}
                </Badge>
              ))}
            </Group>
          )}

          {review.error && (
            <Alert color="red" variant="light" p="xs">
              <Text size="xs">
                The AI tried to carry this out and it failed: {review.error}
              </Text>
            </Alert>
          )}

          <Group gap="xs">
            {available ? (
              <Tooltip
                label={
                  isAccept
                    ? "Applies the recommendation directly."
                    : "Opens the usual confirmation, pre-filled with what the AI suggested."
                }
                withArrow
              >
                <Button
                  size="compact-xs"
                  color="grape"
                  loading={busy}
                  leftSection={<FaCheck size={10} />}
                  onClick={isAccept ? applyAccept : applyDecline}
                >
                  Apply this
                </Button>
              </Tooltip>
            ) : (
              // The row moved since the verdict, so the suggested action is no
              // longer legal. Say so rather than offering a button that 400s.
              <Text size="xs" c="dimmed">
                This row can no longer take that action — it has changed since
                the AI looked at it.
              </Text>
            )}
          </Group>
        </Stack>
      </Card>

      <ResolutionDeclineModal
        item={item}
        correction={declineCorrection}
        note={`Applied the AI recommendation (${resolution.aiConfidence} confidence)`}
        onClose={() => setDeclineCorrection(null)}
        onUpdated={(updated) => {
          setDeclineCorrection(null);
          onUpdated(updated);
        }}
      />
    </>
  );
}
