"use client";

import { ReactNode, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Center,
  Divider,
  Group,
  Loader,
  Modal,
  Portal,
  Stack,
  Table,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { isEmpty } from "lodash";
import { IoWarning } from "react-icons/io5";
import { PiRobot } from "react-icons/pi";
import {
  AiReviewResult,
  getResolutionById,
  postAiReviewResolution,
  ProductResolutionRecord,
  ResolutionCorrection,
  ResolutionListItem,
} from "@/api-actions/product/product-resolutions";
import {
  AI_CONFIDENCE_COLORS,
  AI_CONFIDENCE_LABELS,
  AI_VERDICT_LABELS,
  CORRECTION_LABELS,
  NOT_EXECUTED_REASONS,
} from "./resolution-labels";

/** The correction each recommendation maps to, so the suggestion can be named
 *  in the same words the Decline menu uses. `accept` is not a correction. */
const CORRECTION_BY_ACTION: Record<string, ResolutionCorrection | undefined> = {
  accept: undefined,
  dismiss: "dismiss",
  split: "split",
  merge_into: "merge_into",
};

/**
 * Ask the AI about this one row, and read the whole answer before going back to
 * the queue.
 *
 * A model call costs money and replaces whatever verdict the row already had,
 * so it gets a confirmation rather than firing on the click. What comes back is
 * more than a notification can hold — a verdict, a confidence, a recommended
 * action, the reasoning, the evidence it says it used, and, when it did not act,
 * *which* of the several possible reasons that was. So the result is read here,
 * in place, and the modal stays open until it has been.
 *
 * The row is refetched rather than reconstructed from the verdict: the endpoint
 * returns what the model decided, not what the row became, and the two are only
 * the same when the AI was allowed to act. One extra request buys a card that
 * cannot disagree with the database.
 */
export function ResolutionAiReviewModal({
  resolution,
  opened,
  onClose,
  onUpdated,
}: {
  resolution: ProductResolutionRecord;
  opened: boolean;
  onClose: () => void;
  onUpdated: (updated: ResolutionListItem) => void;
}) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<AiReviewResult | null>(null);

  const isRerun = !!resolution.aiReviewedAt;

  const handleClose = () => {
    // While a call is in flight there is nothing to go back to and a verdict to
    // lose, so closing is refused rather than merely discouraged.
    if (running) return;
    onClose();
    // Cleared on the way out, not on the way in: the result should survive the
    // closing animation rather than blanking under the reader's eyes.
    setResult(null);
  };

  const handleRun = async () => {
    setRunning(true);
    try {
      const review = await postAiReviewResolution(resolution.id);
      setResult(review);

      // Refresh the card even when nothing was executed — an advisory verdict is
      // still stored on the row, and the panel above the fold is driven by it.
      const refreshed = await getResolutionById(resolution.id);
      onUpdated(refreshed);
    } catch (err) {
      notifications.show({
        color: "red",
        title: "AI review failed",
        message: err instanceof Error ? err.message : "An error occurred",
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <Portal reuseTargetNode={false}>
      <Modal
        opened={opened}
        onClose={handleClose}
        title={
          <Group gap="xs">
            <ThemeIcon color="grape" variant="light" size="sm" radius="sm">
              <PiRobot size={14} />
            </ThemeIcon>
            <Text fw={600}>
              {isRerun ? "Re-review with AI" : "Review with AI"}
            </Text>
          </Group>
        }
        centered
        size="lg"
        closeOnClickOutside={!running}
        closeOnEscape={!running}
        withCloseButton={!running}
      >
        <Stack gap="md">
          {!result && !running && (
            <ConfirmBody resolution={resolution} isRerun={isRerun} />
          )}

          {running && <RunningBody />}

          {result && !running && <ReviewResult result={result} />}

          <Divider />

          <Group justify="flex-end">
            <Button variant="default" onClick={handleClose} disabled={running}>
              {result ? "Close" : "Cancel"}
            </Button>
            <Button
              color="grape"
              loading={running}
              leftSection={running ? undefined : <PiRobot size={16} />}
              onClick={handleRun}
            >
              {result ? "Run again" : "Confirm and run"}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Portal>
  );
}

/** What the click is about to cost, and what it will overwrite. */
function ConfirmBody({
  resolution,
  isRerun,
}: {
  resolution: ProductResolutionRecord;
  isRerun: boolean;
}) {
  return (
    <Stack gap="sm">
      <Text size="sm">
        Hand this row to the AI reviewer now, instead of waiting for the nightly
        batch. It judges whether the system&apos;s decision holds up, using the
        evidence already stored on the record.
      </Text>

      <Alert color="grape" variant="light" p="sm">
        <Stack gap={4}>
          <Text size="xs">· One model call — this is spend, however small.</Text>
          <Text size="xs">
            · Only a <b>high-confidence</b> verdict is acted on automatically,
            and only if the server allows it. Anything less comes back as advice
            for you.
          </Text>
          {isRerun && (
            <Text size="xs">
              · This row was already reviewed
              {resolution.aiConfidence
                ? ` (${AI_CONFIDENCE_LABELS[resolution.aiConfidence]})`
                : ""}
              . The previous verdict is <b>replaced</b>.
            </Text>
          )}
        </Stack>
      </Alert>
    </Stack>
  );
}

function RunningBody() {
  return (
    <Center py="xl">
      <Stack align="center" gap="xs">
        <Loader color="grape" />
        <Text size="sm" fw={500}>
          Asking the model about this row…
        </Text>
        <Text size="xs" c="dimmed" ta="center" maw={360}>
          It reads the same stored evidence the card shows. This takes a few
          seconds — closing is disabled so the verdict is not lost.
        </Text>
      </Stack>
    </Center>
  );
}

/** The verdict in full: what it concluded, whether that changed anything, and
 *  — when it did not — which of the several reasons applied. */
function ReviewResult({ result }: { result: AiReviewResult }) {
  const { review, confidence, notExecutedReason } = result;
  const correction = CORRECTION_BY_ACTION[review.recommendedAction];
  const suggestion = correction
    ? CORRECTION_LABELS[correction].replace("…", "")
    : "Accept it — the system was right";

  const rows: { label: string; value: ReactNode }[] = [
    {
      label: "Verdict",
      value: (
        <Badge color="gray" variant="outline" size="sm" tt="none">
          {AI_VERDICT_LABELS[review.verdict]}
        </Badge>
      ),
    },
    {
      label: "Confidence",
      value: (
        <Badge
          color={AI_CONFIDENCE_COLORS[confidence]}
          variant="light"
          size="sm"
          tt="none"
        >
          {AI_CONFIDENCE_LABELS[confidence]}
        </Badge>
      ),
    },
    {
      label: "Recommends",
      value: (
        <Text size="sm" fw={600}>
          {suggestion}
        </Text>
      ),
    },
    {
      label: "Outcome",
      value: review.executed ? (
        <Badge color="green" variant="filled" size="sm" tt="none">
          carried out — the row was changed
        </Badge>
      ) : (
        <Badge color="blue" variant="light" size="sm" tt="none">
          advice only — nothing was changed
        </Badge>
      ),
    },
    {
      label: "Model",
      value: (
        <Text size="xs" c="dimmed">
          {review.model}
        </Text>
      ),
    },
  ];

  if (review.costUsd != null) {
    rows.push({
      label: "Cost",
      value: (
        <Text size="xs" c="dimmed">
          ${review.costUsd.toFixed(4)}
        </Text>
      ),
    });
  }

  return (
    <Stack gap="sm">
      <Table verticalSpacing={6} horizontalSpacing={8} fz="sm" withTableBorder>
        <Table.Tbody>
          {rows.map((row) => (
            <Table.Tr key={row.label}>
              <Table.Td w={130} c="dimmed">
                {row.label}
              </Table.Td>
              <Table.Td>{row.value}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      {/* Why it was not applied is the question a reader has the moment they see
          "advice only", so it sits directly under the outcome rather than being
          left to infer from the confidence. */}
      {!review.executed && notExecutedReason && (
        <Alert
          color={notExecutedReason === "failed" ? "red" : "blue"}
          variant="light"
          p="sm"
          icon={<IoWarning size={16} />}
          title="Why it was not applied"
        >
          <Text size="xs">{NOT_EXECUTED_REASONS[notExecutedReason]}</Text>
        </Alert>
      )}

      <Stack gap={4}>
        <Text size="xs" c="dimmed" fw={600} tt="uppercase">
          Reasoning
        </Text>
        <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
          {review.reasoning}
        </Text>
      </Stack>

      {!isEmpty(review.evidenceCited) && (
        <Stack gap={4}>
          <Text size="xs" c="dimmed" fw={600} tt="uppercase">
            Evidence it says it used
          </Text>
          <Group gap={4} wrap="wrap">
            {review.evidenceCited.map((evidence) => (
              <Badge
                key={evidence}
                size="xs"
                variant="outline"
                color="gray"
                tt="none"
              >
                {evidence}
              </Badge>
            ))}
          </Group>
        </Stack>
      )}

      {review.error && (
        <Alert color="red" variant="light" p="sm" icon={<IoWarning size={16} />}>
          <Text size="xs">
            The AI tried to carry this out and it failed: {review.error}
          </Text>
        </Alert>
      )}

      <Text size="xs" c="dimmed">
        The card behind this modal has already been updated.
        {!review.executed &&
          " An advisory verdict appears on the row with an “Apply this” button."}
      </Text>
    </Stack>
  );
}
