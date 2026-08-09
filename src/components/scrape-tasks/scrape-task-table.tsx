"use client";
"use no memo";

import { useEffect, useMemo, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  Loader,
  Center,
  Pagination,
  Select,
  Text,
  Badge,
  MultiSelect,
  Group,
  Card,
  Button,
  Modal,
  Stack,
  Code,
  Anchor,
  Tooltip,
  ActionIcon,
} from "@mantine/core";
import { useClipboard } from "@mantine/hooks";
import { FiCopy, FiCheck } from "react-icons/fi";
import { useDisclosure } from "@mantine/hooks";
import { isEmpty } from "lodash";
import { format } from "date-fns";
import {
  ScrapeTask,
  ScrapeTaskSearchParams,
  ScrapeQueueName,
  ProductSourceType,
  TaskStatus,
} from "@/models/dtos/scrape-task-search-models";
import { useScrapeTaskSearch } from "@/hooks/useScrapeTaskSearch";
import { routes } from "@/utils/routes";
import Link from "next/link";

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

const formatDate = (value?: string | null): string => {
  if (!value) return "-";
  return format(new Date(value), "yyyy-MM-dd HH:mm:ss");
};

export function ScrapeTaskTable() {
  const [data, setData] = useState<ScrapeTask[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState<number | null>(null);
  const [statusesFilter, setStatusesFilter] = useState<TaskStatus[]>([]);
  const [queuesFilter, setQueuesFilter] = useState<ScrapeQueueName[]>([]);
  const [sourceTypesFilter, setSourceTypesFilter] = useState<ProductSourceType[]>([]);
  const [selectedTask, setSelectedTask] = useState<ScrapeTask | null>(null);
  const [detailsOpened, { open: openDetails, close: closeDetails }] =
    useDisclosure(false);
  const clipboard = useClipboard({ timeout: 2000 });

  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);

  const { search, loading, searchResult } = useScrapeTaskSearch();
  const columnHelper = useMemo(() => createColumnHelper<ScrapeTask>(), []);

  useEffect(() => {
    setData(searchResult?.items || []);
    setTotalPages(searchResult?.totalPages || 1);
    setTotalItems(searchResult?.totalItems ?? null);
  }, [searchResult]);

  useEffect(() => {
    if (loading || !pageSize || !page) {
      return;
    }

    const sortField = sorting[0]?.id as ScrapeTaskSearchParams["sort"];
    const sortOrder =
      sorting[0]?.desc === true ? "DESC" : sorting.length ? "ASC" : undefined;

    const searchParams: ScrapeTaskSearchParams = {
      page,
      pageSize,
      sort: sortField,
      order: sortOrder,
      statuses: statusesFilter.length ? statusesFilter : undefined,
      queues: queuesFilter.length ? queuesFilter : undefined,
      sourceTypes: sourceTypesFilter.length ? sourceTypesFilter : undefined,
    };

    search(searchParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sorting, pageSize, statusesFilter, queuesFilter, sourceTypesFilter]);

  const columns = useMemo(
    () => [
      columnHelper.accessor((row) => row, {
        id: "actions",
        enableSorting: false,
        header: () => "",
        cell: (props) => (
          <Button
            size="compact-sm"
            variant="light"
            onClick={() => {
              setSelectedTask(props.getValue());
              openDetails();
            }}
          >
            Details
          </Button>
        ),
      }),

      columnHelper.accessor("queue", {
        id: "queue",
        header: ({ column }) => (
          <Text
            fw={500}
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
            style={{ cursor: "pointer" }}
          >
            Queue
          </Text>
        ),
        cell: (props) => (
          <Badge variant="light" color="gray" tt="none">
            {props.getValue()}
          </Badge>
        ),
      }),

      columnHelper.accessor("url", {
        id: "url",
        enableSorting: false,
        header: () => <Text fw={500}>URL</Text>,
        cell: (props) => {
          const url = props.getValue();
          return url ? (
            <Anchor
              href={url}
              target="_blank"
              rel="noreferrer"
              size="sm"
              style={{ maxWidth: 300, display: "block" }}
              lineClamp={1}
            >
              {url}
            </Anchor>
          ) : (
            <Text c="dimmed" size="sm">
              —
            </Text>
          );
        },
      }),

      columnHelper.accessor("status", {
        id: "status",
        header: ({ column }) => (
          <Text
            fw={500}
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
            style={{ cursor: "pointer" }}
          >
            Status
          </Text>
        ),
        cell: (props) => {
          const status = props.getValue();
          return (
            <Badge tt="none" color={getColorForTaskStatus(status)}>
              {status}
            </Badge>
          );
        },
      }),

      columnHelper.accessor("source", {
        id: "source",
        enableSorting: false,
        header: () => <Text fw={500}>Source</Text>,
        cell: (props) => {
          const source = props.getValue();
          return (
            <Text size="sm">{source?.name ?? source?.type ?? "—"}</Text>
          );
        },
      }),

      columnHelper.accessor("product", {
        id: "product",
        enableSorting: false,
        header: () => <Text fw={500}>Product</Text>,
        cell: (props) => {
          const product = props.getValue();
          if (!product) {
            return (
              <Text c="dimmed" size="sm">
                —
              </Text>
            );
          }
          return (
            <Anchor
              component={Link}
              href={routes.products.details(product.id)}
              size="sm"
            >
              {product.displayName}
            </Anchor>
          );
        },
      }),

      columnHelper.accessor("attempts", {
        id: "attempts",
        header: ({ column }) => (
          <Text
            fw={500}
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
            style={{ cursor: "pointer" }}
          >
            Attempts
          </Text>
        ),
        cell: (props) => <Text size="sm">{props.getValue()}</Text>,
      }),

      columnHelper.accessor("executionTimeInSec", {
        id: "executionTimeInSec",
        header: ({ column }) => (
          <Text
            fw={500}
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
            style={{ cursor: "pointer" }}
          >
            Exec Time (s)
          </Text>
        ),
        cell: (props) => {
          const value = props.getValue();
          return (
            <Text size="sm">{value != null ? value.toFixed(2) : "-"}</Text>
          );
        },
      }),

      columnHelper.accessor("scheduledAt", {
        id: "scheduledAt",
        header: ({ column }) => (
          <Text
            fw={500}
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
            style={{ cursor: "pointer" }}
          >
            Scheduled At
          </Text>
        ),
        cell: (props) => <Text size="sm">{formatDate(props.getValue())}</Text>,
      }),

      columnHelper.accessor("lastRunAt", {
        id: "lastRunAt",
        header: ({ column }) => (
          <Text
            fw={500}
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
            style={{ cursor: "pointer" }}
          >
            Last Run At
          </Text>
        ),
        cell: (props) => <Text size="sm">{formatDate(props.getValue())}</Text>,
      }),

      columnHelper.accessor("createdAt", {
        id: "createdAt",
        header: ({ column }) => (
          <Text
            fw={500}
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
            style={{ cursor: "pointer" }}
          >
            Created
          </Text>
        ),
        cell: (props) => <Text size="sm">{formatDate(props.getValue())}</Text>,
      }),
    ],
    [columnHelper, openDetails]
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: true,
    manualPagination: true,
  });

  return (
    <>
      <Modal
        opened={detailsOpened}
        onClose={closeDetails}
        title={`Scrape task details — ${selectedTask?.id ?? ""}`}
        size="xl"
      >
        {selectedTask && (
          <Stack gap="xs">
            <Text size="sm">
              <strong>ID:</strong> {selectedTask.id}
            </Text>
            <Text size="sm">
              <strong>Queue:</strong> {selectedTask.queue}
            </Text>
            <Text size="sm">
              <strong>Status:</strong> {selectedTask.status}
            </Text>
            <Text size="sm">
              <strong>Attempts:</strong> {selectedTask.attempts}
            </Text>
            <Text size="sm">
              <strong>Exec Time (s):</strong>{" "}
              {selectedTask.executionTimeInSec != null
                ? selectedTask.executionTimeInSec.toFixed(2)
                : "-"}
            </Text>
            <Text size="sm">
              <strong>Source:</strong>{" "}
              {selectedTask.source?.name ?? selectedTask.source?.type ?? "-"}
            </Text>
            <Text size="sm">
              <strong>Product:</strong>{" "}
              {selectedTask.product ? (
                <Anchor
                  component={Link}
                  href={routes.products.details(selectedTask.product.id)}
                >
                  {selectedTask.product.displayName}
                </Anchor>
              ) : (
                "-"
              )}
            </Text>
            {selectedTask.url && (
              <Text size="sm">
                <strong>URL:</strong>{" "}
                <Anchor
                  href={selectedTask.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {selectedTask.url}
                </Anchor>
              </Text>
            )}
            <Text size="sm">
              <strong>Scheduled At:</strong>{" "}
              {formatDate(selectedTask.scheduledAt)}
            </Text>
            <Text size="sm">
              <strong>Last Run At:</strong>{" "}
              {formatDate(selectedTask.lastRunAt)}
            </Text>
            <Text size="sm">
              <strong>Locked At:</strong> {formatDate(selectedTask.lockedAt)}
            </Text>
            <Text size="sm">
              <strong>Created At:</strong>{" "}
              {formatDate(selectedTask.createdAt)}
            </Text>
            <Text size="sm">
              <strong>Updated At:</strong>{" "}
              {formatDate(selectedTask.updatedAt)}
            </Text>
            {selectedTask.error != null && (
              <>
                <Text size="sm" fw={500} mt="sm">
                  Error:
                </Text>
                <Code
                  block
                  style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}
                >
                  {JSON.stringify(selectedTask.error, null, 2)}
                </Code>
              </>
            )}
            {selectedTask.resolutionContext != null && (
              <>
                <Group justify="space-between" align="center" mt="sm">
                  <Text size="sm" fw={500}>
                    Resolution Context:
                  </Text>
                  <Tooltip label={clipboard.copied ? "Copied!" : "Copy"} withArrow>
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      color={clipboard.copied ? "green" : "gray"}
                      onClick={() =>
                        clipboard.copy(
                          JSON.stringify(selectedTask.resolutionContext, null, 2)
                        )
                      }
                    >
                      {clipboard.copied ? (
                        <FiCheck size={14} />
                      ) : (
                        <FiCopy size={14} />
                      )}
                    </ActionIcon>
                  </Tooltip>
                </Group>
                <Code
                  block
                  style={{
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                    maxHeight: 400,
                    overflowY: "auto",
                  }}
                >
                  {JSON.stringify(selectedTask.resolutionContext, null, 2)}
                </Code>
              </>
            )}
          </Stack>
        )}
      </Modal>

      {loading ? (
        <Center p="xl">
          <Loader />
        </Center>
      ) : (
        <>
          <Card shadow="sm" padding="sm" radius="sm" mb="xl" withBorder>
            <Group gap="md">
              <MultiSelect
                label="Filter by status"
                placeholder="Select statuses"
                data={Object.values(TaskStatus).map((s) => ({
                  value: s,
                  label: s,
                }))}
                value={statusesFilter as unknown as string[]}
                onChange={(vals) => {
                  setPage(1);
                  setStatusesFilter(vals as unknown as TaskStatus[]);
                }}
                clearable
                searchable
                maw={300}
              />
              <MultiSelect
                label="Filter by queue"
                placeholder="Select queues"
                data={Object.values(ScrapeQueueName).map((q) => ({
                  value: q,
                  label: q,
                }))}
                value={queuesFilter as unknown as string[]}
                onChange={(vals) => {
                  setPage(1);
                  setQueuesFilter(vals as unknown as ScrapeQueueName[]);
                }}
                clearable
                searchable
                maw={300}
              />
              <MultiSelect
                label="Filter by source"
                placeholder="Select sources"
                data={Object.values(ProductSourceType).map((s) => ({
                  value: s,
                  label: s,
                }))}
                value={sourceTypesFilter as unknown as string[]}
                onChange={(vals) => {
                  setPage(1);
                  setSourceTypesFilter(vals as unknown as ProductSourceType[]);
                }}
                clearable
                searchable
                maw={300}
              />
            </Group>
          </Card>

          <Group justify="space-between" mb="sm">
            <Text size="sm" c="dimmed">
              {totalItems !== null ? `${totalItems} total scrape tasks` : ""}
            </Text>
            <Group gap="sm">
              <Select
                size="xs"
                label="Per page"
                data={["20", "50", "100"]}
                value={String(pageSize)}
                onChange={(val) => {
                  if (val) {
                    setPage(1);
                    setPageSize(Number(val));
                  }
                }}
                w={80}
              />
              <Pagination
                total={totalPages}
                value={page}
                onChange={setPage}
                size="sm"
                mt="auto"
              />
            </Group>
          </Group>

          <Table striped horizontalSpacing="md" verticalSpacing="md">
            <Table.Thead>
              {table.getHeaderGroups().map((hg) => (
                <Table.Tr key={hg.id}>
                  {hg.headers.map((header) => {
                    if (header.isPlaceholder) return <th key={header.id}></th>;

                    const column = header.column;
                    const sorted = column.getIsSorted();
                    const canSort = column.getCanSort();

                    return (
                      <th
                        key={header.id}
                        {...(canSort
                          ? {
                              onClick: column.getToggleSortingHandler(),
                              style: { cursor: "pointer" },
                            }
                          : {})}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          {flexRender(
                            column.columnDef.header,
                            header.getContext()
                          )}

                          {canSort && sorted === "asc" && "▲"}
                          {canSort && sorted === "desc" && "▼"}
                        </div>
                      </th>
                    );
                  })}
                </Table.Tr>
              ))}
            </Table.Thead>

            <Table.Tbody>
              {isEmpty(table.getRowModel().rows) ? (
                <Table.Tr>
                  <Table.Td colSpan={11}>
                    <Center>No scrape tasks found</Center>
                  </Table.Td>
                </Table.Tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <Table.Tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <Table.Td key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </Table.Td>
                    ))}
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>

          <Center mt="lg">
            <Pagination
              total={totalPages}
              value={page}
              onChange={setPage}
              size="md"
            />
          </Center>
        </>
      )}
    </>
  );
}
