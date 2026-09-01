"use client";

import { useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Group,
  Modal,
  NumberInput,
  Portal,
  Stack,
  Switch,
  Table,
  Text,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IoWarning } from "react-icons/io5";
import { PiRobot } from "react-icons/pi";
import {
  AiReviewBatchSummary,
  postRunAiReview,
} from "@/api-actions/product/product-resolutions";

const DEFAULT_ROWS = 10;

/**
 * Runs the AI reviewer over the top of the queue, on demand.
 *
 * This is what makes the AI pass usable while you are actually working rather
 * than only at 3 AM: clear what you can by hand, then hand the next slice to the
 * model and read what it did. It takes the same rows in the same order the queue
 * shows, so it always starts from where you left off.
 *
 * The row count defaults deliberately low. A batch is spend, and the useful
 * first question is "what does it do to ten rows", not "what does it do to a
 * hundred".
 */
export function AiReviewRunModal({ onComplete }: { onComplete: () => void }) {
  const [opened, setOpened] = useState(false);
  const [running, setRunning] = useState(false);
  const [maxPerRun, setMaxPerRun] = useState<number>(DEFAULT_ROWS);
  const [minPriority, setMinPriority] = useState<number | undefined>(undefined);
  const [allowDestructive, setAllowDestructive] = useState(false);
  const [summary, setSummary] = useState<AiReviewBatchSummary | null>(null);

  const handleOpen = () => {
    setSummary(null);
    setOpened(true);
  };

  const handleRun = async () => {
    setRunning(true);
    try {
      const result = await postRunAiReview({
        maxPerRun,
        minPriority,
        executeDestructive: allowDestructive,
      });
      setSummary(result);

      notifications.show({
        color: "green",
        title: "AI review finished",
        message: `${result.rowsReviewed} reviewed · ${result.executed} acted on · ${result.advisory} left for you`,
      });

      // Every reviewed row now carries a stored verdict, so the list is stale
      // whether or not anything was acted on.
      if (result.rowsReviewed > 0) onComplete();
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
    <>
      <Button
        leftSection={<PiRobot size={16} />}
        onClick={handleOpen}
        variant="light"
        color="grape"
      >
        Run AI review
      </Button>

      <Portal reuseTargetNode={false}>
        <Modal
          opened={opened}
          onClose={() => setOpened(false)}
          title="Run AI review"
          centered
          size="lg"
        >
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              Takes the most important rows from the top of the queue — the same
              order shown here — and asks the model whether each decision holds
              up. Rows you have already decided are not included.
            </Text>

            <Group grow align="flex-start">
              <NumberInput
                label="Rows to review"
                description="Each row is one model call"
                min={1}
                max={500}
                value={maxPerRun}
                onChange={(value) =>
                  setMaxPerRun(typeof value === "number" ? value : DEFAULT_ROWS)
                }
              />
              <NumberInput
                label="Min priority"
                description="Server default if blank"
                placeholder="config default"
                min={0}
                max={100}
                value={minPriority ?? ""}
                onChange={(value) =>
                  setMinPriority(typeof value === "number" ? value : undefined)
                }
              />
            </Group>

            <Switch
              label="Allow merges and splits"
              description="Only applies to high-confidence verdicts, and only if the server permits it — this switch can restrict that setting, never widen it."
              checked={allowDestructive}
              onChange={(event) =>
                setAllowDestructive(event.currentTarget.checked)
              }
            />

            {allowDestructive && (
              <Alert
                color="orange"
                variant="light"
                icon={<IoWarning size={16} />}
              >
                A high-confidence merge deletes a product. Every action is
                reversible from the row&apos;s history, but the reversal is a
                separate step.
              </Alert>
            )}

            {summary && <RunSummary summary={summary} />}

            <Group justify="flex-end">
              <Button
                variant="default"
                onClick={() => setOpened(false)}
                disabled={running}
              >
                {summary ? "Close" : "Cancel"}
              </Button>
              <Button color="grape" loading={running} onClick={handleRun}>
                {summary ? "Run again" : "Run"}
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Portal>
    </>
  );
}

/** The outcome, broken down the way the decision to run it again depends on. */
function RunSummary({ summary }: { summary: AiReviewBatchSummary }) {
  const rows: { label: string; value: string; hint?: string }[] = [
    { label: "Reviewed", value: String(summary.rowsReviewed) },
    {
      label: "Acted on",
      value: String(summary.executed),
      hint: "High confidence, and the server allowed it",
    },
    {
      label: "Left for you",
      value: String(summary.advisory),
      hint: "Judged, but not confident enough to act — the reasoning is on the row",
    },
    {
      label: "Abstained",
      value: String(summary.abstained),
      hint: "The model declined to call it. Counted in 'left for you' as well",
    },
  ];

  if (summary.skippedStale > 0) {
    rows.push({
      label: "Skipped (row moved)",
      value: String(summary.skippedStale),
      hint: "Re-scraped or decided while the model was thinking, so the verdict was discarded rather than applied to a different question",
    });
  }
  if (summary.failed > 0) {
    rows.push({ label: "Failed", value: String(summary.failed) });
  }

  rows.push({ label: "Cost", value: `$${summary.costUsd.toFixed(4)}` });

  return (
    <Stack gap="xs">
      <Group gap="xs">
        <Text size="sm" fw={600}>
          Result
        </Text>
        {summary.capped && (
          <Badge color="orange" variant="light" size="sm" tt="none">
            stopped early — more waiting
          </Badge>
        )}
      </Group>

      <Table verticalSpacing={4} horizontalSpacing={8} fz="sm" withTableBorder>
        <Table.Tbody>
          {rows.map((row) => (
            <Table.Tr key={row.label}>
              <Table.Td w={170}>{row.label}</Table.Td>
              <Table.Td fw={600} w={70}>
                {row.value}
              </Table.Td>
              <Table.Td c="dimmed" fz="xs">
                {row.hint}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Stack>
  );
}
