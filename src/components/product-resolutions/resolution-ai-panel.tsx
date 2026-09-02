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
 * What the AI made of this row — and, when the recommendation is still open, a
 * way to act on it in one click.
 *
 * Two shapes, on one distinction:
 *
 * - **Advisory** — nobody has taken the recommendation yet, so it carries the
 *   apply button. This is the case worth a button.
 * - **Executed** — the AI already carried it out, so there is nothing to apply
 *   and the panel is read-only. It still renders: "the AI closed this row" is
 *   exactly when a reviewer most wants to see the reasoning, and making them
 *   open the history modal to find out why hides it behind a click.
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

  // Never reviewed — there is no verdict to show either way.
  if (!review) return null;

  const executed = review.executed;
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
      {/* The tint is a call to action, so only the advisory shape wears it. An
          executed verdict is a record; colouring it the same would put a
          "something needs you here" signal on a row already settled. */}
      <Card
        withBorder
        padding="sm"
        radius="md"
        bg={executed ? undefined : "var(--mantine-color-grape-light)"}
      >
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
            {executed && (
              <Badge color="green" variant="light" size="sm" tt="none">
                carried out
              </Badge>
            )}
            {/* Past tense once it happened: "suggests dismissing" beside a row
                the AI already dismissed reads as a pending decision. */}
            <Text size="xs" c="dimmed">
              {executed ? "did" : "suggests"}{" "}
              <Text span fw={600}>
                {correction
                  ? CORRECTION_LABELS[correction].replace("…", "")
                  : executed
                    ? "accepted it"
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

          {/* Read-only once executed: there is nothing left to apply, and an
              "unavailable" note would be misleading — the action is not
              unavailable, it already happened. */}
          {executed ? (
            <Text size="xs" c="dimmed">
              The AI was confident enough to act on this itself. What it did is
              in the decision history; reopening the row offers the correction
              that reverses it.
            </Text>
          ) : (
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
          )}
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
