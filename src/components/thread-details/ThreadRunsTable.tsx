"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  Code,
  Modal,
  Stack,
  Table,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { format } from "date-fns";
import { ThreadRun, ThreadRunStatus } from "@/models/dtos/thread-run-search-models";

const getStatusColor = (status: ThreadRunStatus): string => {
  switch (status) {
    case ThreadRunStatus.RUNNING:
      return "blue";
    case ThreadRunStatus.COMPLETED:
      return "green";
    case ThreadRunStatus.FAILED:
      return "red";
    default:
      return "gray";
  }
};

const formatDateTime = (value?: string | Date | null): string => {
  if (!value) return "-";
  try {
    return format(new Date(value), "yyyy-MM-dd HH:mm:ss");
  } catch {
    return String(value);
  }
};

const formatDuration = (ms: number | null): string => {
  if (ms == null) return "-";
  return `${(ms / 60000).toFixed(2)}m`;
};

const formatCost = (cost: number | null): string => {
  if (cost === null || cost === undefined) return "-";
  return `$${cost.toFixed(4)}`;
};

export const ThreadRunsTable = ({ runs }: { runs: ThreadRun[] }) => {
  const [selectedRun, setSelectedRun] = useState<ThreadRun | null>(null);
  const [detailsOpened, { open: openDetails, close: closeDetails }] = useDisclosure(false);

  if (!runs || runs.length === 0) {
    return (
      <Stack gap="md">
        <Title order={4}>Thread Runs</Title>
        <Text size="sm" c="dimmed">No runs yet</Text>
      </Stack>
    );
  }

  return (
    <>
      <Modal
        opened={detailsOpened}
        onClose={closeDetails}
        title={`Thread run details — ${selectedRun?.id ?? ""}`}
        size="lg"
      >
        {selectedRun && (
          <Stack gap="xs">
            <Text size="sm"><strong>ID:</strong> {selectedRun.id}</Text>
            <Text size="sm"><strong>Status:</strong> {selectedRun.status}</Text>
            <Text size="sm"><strong>Started At:</strong> {formatDateTime(selectedRun.startedAt)}</Text>
            <Text size="sm"><strong>Completed At:</strong> {formatDateTime(selectedRun.completedAt)}</Text>
            <Text size="sm"><strong>Duration:</strong> {formatDuration(selectedRun.durationMs)}</Text>
            <Text size="sm"><strong>Total Cost (USD):</strong> {formatCost(selectedRun.totalCostUsd)}</Text>
            <Text size="sm"><strong>Created At:</strong> {formatDateTime(selectedRun.createdAt)}</Text>
            <Text size="sm"><strong>Updated At:</strong> {formatDateTime(selectedRun.updatedAt)}</Text>

            {selectedRun.details != null && (
              <>
                <Text size="sm" fw={500} mt="sm">Thread Stats:</Text>
                <Code block style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                  {JSON.stringify(selectedRun.details.thread, null, 2)}
                </Code>
                <Text size="sm" fw={500} mt="sm">Steps:</Text>
                <Code block style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                  {JSON.stringify(selectedRun.details.steps, null, 2)}
                </Code>
                <Text size="sm" fw={500} mt="sm">
                  Models ({selectedRun.details.models.totalLlmCallCount} LLM calls):
                </Text>
                <Code block style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                  {JSON.stringify(selectedRun.details.models.usage, null, 2)}
                </Code>
              </>
            )}

            {selectedRun.error != null && (
              <>
                <Text size="sm" fw={500} mt="sm">Error:</Text>
                <Code block style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                  {JSON.stringify(selectedRun.error, null, 2)}
                </Code>
              </>
            )}
          </Stack>
        )}
      </Modal>

      <Stack gap="md">
        <Title order={4}>Thread Runs</Title>
        <Table striped highlightOnHover verticalSpacing="xs">
          <Table.Thead>
            <Table.Tr>
              <Table.Th></Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Started</Table.Th>
              <Table.Th>Completed</Table.Th>
              <Table.Th>Duration</Table.Th>
              <Table.Th>Cost</Table.Th>
              <Table.Th>Error</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {runs.map((run) => (
              <Table.Tr key={run.id}>
                <Table.Td>
                  <Button
                    size="compact-sm"
                    variant="light"
                    onClick={() => {
                      setSelectedRun(run);
                      openDetails();
                    }}
                  >
                    Details
                  </Button>
                </Table.Td>
                <Table.Td>
                  <Badge color={getStatusColor(run.status)} tt="none">
                    {run.status}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{formatDateTime(run.startedAt)}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{formatDateTime(run.completedAt)}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{formatDuration(run.durationMs)}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{formatCost(run.totalCostUsd)}</Text>
                </Table.Td>
                <Table.Td>
                  {run.error ? (
                    <Tooltip label={run.error.message} multiline w={300} withArrow>
                      <Text size="sm" c="red" lineClamp={2}>
                        {run.error.name ? `${run.error.name}: ` : ""}
                        {run.error.message}
                      </Text>
                    </Tooltip>
                  ) : (
                    <Text size="sm" c="dimmed">-</Text>
                  )}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Stack>
    </>
  );
};
