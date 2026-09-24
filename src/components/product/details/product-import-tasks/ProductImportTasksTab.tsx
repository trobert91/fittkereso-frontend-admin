"use client";

import { Anchor, Badge, Table, Text } from "@mantine/core";
import { selectProduct } from "@/store/slices/product-slice";
import { useAppSelector } from "@/store/store-hooks";
import { TaskStatus } from "@/models/dtos/product-import-task-search-models";
import { formatDate } from "@/utils/date";

const getColorForTaskStatus = (status: TaskStatus): string => {
  switch (status) {
    case TaskStatus.PENDING:
      return "yellow";
    case TaskStatus.PROCESSING:
      return "blue";
    case TaskStatus.DONE:
      return "green";
    case TaskStatus.FAILED:
      return "red";
    default:
      return "gray";
  }
};

export function ProductImportTasksTab() {
  const product = useAppSelector(selectProduct);

  if (!product) {
    return null;
  }

  const importTasks = product.importTasks ?? [];

  if (!importTasks.length) {
    return <Text c="dimmed">No import tasks</Text>;
  }

  return (
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Kind</Table.Th>
          <Table.Th>Priority</Table.Th>
          <Table.Th>URL</Table.Th>
          <Table.Th>Status</Table.Th>
          <Table.Th>Source</Table.Th>
          <Table.Th>Attempts</Table.Th>
          <Table.Th>Exec Time (s)</Table.Th>
          <Table.Th>Last Run</Table.Th>
          <Table.Th>Created</Table.Th>
        </Table.Tr>
      </Table.Thead>

      <Table.Tbody>
        {importTasks.map((task) => (
          <Table.Tr key={task.id}>
            <Table.Td>
              <Badge variant="light" color="gray" tt="none">
                {task.kind}
              </Badge>
            </Table.Td>

            <Table.Td>{task.priority}</Table.Td>

            <Table.Td>
              {task.url ? (
                <Anchor href={task.url} target="_blank" rel="noreferrer">
                  {task.url}
                </Anchor>
              ) : (
                <Text c="dimmed">—</Text>
              )}
            </Table.Td>

            <Table.Td>
              <Badge tt="none" color={getColorForTaskStatus(task.status)}>
                {task.status}
              </Badge>
            </Table.Td>

            <Table.Td>
              <Text size="sm">
                {task.source?.name ?? task.source?.type ?? "—"}
              </Text>
            </Table.Td>

            <Table.Td>
              <Text size="sm">{task.attempts}</Text>
            </Table.Td>

            <Table.Td>
              <Text size="sm">
                {task.executionTimeInSec != null
                  ? task.executionTimeInSec.toFixed(2)
                  : "—"}
              </Text>
            </Table.Td>

            <Table.Td>{formatDate(task.lastRunAt) || "—"}</Table.Td>

            <Table.Td>{formatDate(task.createdAt) || "—"}</Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
