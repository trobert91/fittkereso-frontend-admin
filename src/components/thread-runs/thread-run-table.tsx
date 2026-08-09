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
  Badge,
  Card,
  Center,
  Code,
  Group,
  Loader,
  Modal,
  MultiSelect,
  Pagination,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Button,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { isEmpty } from "lodash";
import { format } from "date-fns";
import {
  ThreadRun,
  ThreadRunSearchParams,
  ThreadRunStatus,
} from "@/models/dtos/thread-run-search-models";
import { useThreadRunSearch } from "@/hooks/useThreadRunSearch";
import { CommentDateRangePicker } from "@/components/comment/comment-date-picker";
import Link from "next/link";
import { routes } from "@/utils/routes";

const getColorForStatus = (status: ThreadRunStatus): string => {
  switch (status) {
    case ThreadRunStatus.COMPLETED:
      return "green";
    case ThreadRunStatus.RUNNING:
      return "yellow";
    case ThreadRunStatus.FAILED:
      return "red";
    default:
      return "gray";
  }
};

const formatDate = (value?: string | null): string => {
  if (!value) return "-";
  return format(new Date(value), "yyyy-MM-dd HH:mm:ss");
};

const formatDuration = (ms: number | null): string => {
  if (ms == null) return "-";
  return `${(ms / 60000).toFixed(2)}m`;
};

export function ThreadRunTable() {
  const [data, setData] = useState<ThreadRun[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState<number | null>(null);

  const [statusesFilter, setStatusesFilter] = useState<ThreadRunStatus[]>([]);
  const [threadIdFilter, setThreadIdFilter] = useState("");
  const [startedAtRange, setStartedAtRange] = useState<[string | null, string | null]>([null, null]);

  const [selectedRun, setSelectedRun] = useState<ThreadRun | null>(null);
  const [detailsOpened, { open: openDetails, close: closeDetails }] = useDisclosure(false);

  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);

  const { search, loading, searchResult } = useThreadRunSearch();
  const columnHelper = useMemo(() => createColumnHelper<ThreadRun>(), []);

  useEffect(() => {
    setData(searchResult?.items || []);
    setTotalPages(searchResult?.totalPages || 1);
    setTotalItems(searchResult?.totalItems ?? null);
  }, [searchResult]);

  useEffect(() => {
    if (loading || !pageSize || !page) {
      return;
    }

    const sortField = sorting[0]?.id as ThreadRunSearchParams["sort"];
    const sortOrder =
      sorting[0]?.desc === true ? "DESC" : sorting.length ? "ASC" : undefined;

    const searchParams: ThreadRunSearchParams = {
      page,
      pageSize,
      sort: sortField,
      order: sortOrder,
      statuses: statusesFilter.length ? statusesFilter : undefined,
      threadId: threadIdFilter.trim() || undefined,
      startedAtFrom: startedAtRange[0] ?? undefined,
      startedAtTo: startedAtRange[1] ?? undefined,
    };

    search(searchParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sorting, pageSize, statusesFilter, threadIdFilter, startedAtRange]);

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
              setSelectedRun(props.getValue());
              openDetails();
            }}
          >
            Details
          </Button>
        ),
      }),

      columnHelper.accessor("status", {
        id: "status",
        header: ({ column }) => (
          <Text
            fw={500}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            style={{ cursor: "pointer" }}
          >
            Status
          </Text>
        ),
        cell: (props) => {
          const status = props.getValue();
          return (
            <Badge tt="none" color={getColorForStatus(status)}>
              {status}
            </Badge>
          );
        },
      }),

      columnHelper.accessor((row) => row.thread?.id, {
        id: "threadId",
        enableSorting: false,
        header: () => <Text fw={500}>Thread</Text>,
        cell: (props) => {
          const threadId = props.getValue();
          if (!threadId) return <Text size="sm">-</Text>;
          return (
            <Text size="sm" style={{ fontFamily: "monospace" }}>
              <Link href={routes.threads.details(threadId)} style={{ color: "inherit" }}>
                {threadId.slice(0, 8)}…
              </Link>
            </Text>
          );
        },
      }),

      columnHelper.accessor("startedAt", {
        id: "startedAt",
        header: ({ column }) => (
          <Text
            fw={500}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            style={{ cursor: "pointer" }}
          >
            Started At
          </Text>
        ),
        cell: (props) => <Text size="sm">{formatDate(props.getValue())}</Text>,
      }),

      columnHelper.accessor("completedAt", {
        id: "completedAt",
        header: ({ column }) => (
          <Text
            fw={500}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            style={{ cursor: "pointer" }}
          >
            Completed At
          </Text>
        ),
        cell: (props) => <Text size="sm">{formatDate(props.getValue())}</Text>,
      }),

      columnHelper.accessor("durationMs", {
        id: "durationMs",
        header: ({ column }) => (
          <Text
            fw={500}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            style={{ cursor: "pointer" }}
          >
            Duration
          </Text>
        ),
        cell: (props) => <Text size="sm">{formatDuration(props.getValue())}</Text>,
      }),

      columnHelper.accessor("totalCostUsd", {
        id: "totalCostUsd",
        header: ({ column }) => (
          <Text
            fw={500}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            style={{ cursor: "pointer" }}
          >
            Cost (USD)
          </Text>
        ),
        cell: (props) => {
          const value = props.getValue();
          return <Text size="sm">{value != null ? `$${value.toFixed(4)}` : "-"}</Text>;
        },
      }),

      columnHelper.accessor("createdAt", {
        id: "createdAt",
        header: ({ column }) => (
          <Text
            fw={500}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            style={{ cursor: "pointer" }}
          >
            Created
          </Text>
        ),
        cell: (props) => <Text size="sm">{formatDate(props.getValue())}</Text>,
      }),
    ],
    [columnHelper, openDetails],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
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
        title={`Thread run details — ${selectedRun?.id ?? ""}`}
        size="lg"
      >
        {selectedRun && (
          <Stack gap="xs">
            <Text size="sm"><strong>ID:</strong> {selectedRun.id}</Text>
            <Text size="sm"><strong>Thread ID:</strong> {selectedRun.thread?.id ?? "-"}</Text>
            <Text size="sm"><strong>Status:</strong> {selectedRun.status}</Text>
            <Text size="sm"><strong>Started At:</strong> {formatDate(selectedRun.startedAt)}</Text>
            <Text size="sm"><strong>Completed At:</strong> {formatDate(selectedRun.completedAt)}</Text>
            <Text size="sm"><strong>Duration:</strong> {formatDuration(selectedRun.durationMs)}</Text>
            <Text size="sm"><strong>Total Cost (USD):</strong> {selectedRun.totalCostUsd != null ? `$${selectedRun.totalCostUsd.toFixed(4)}` : "-"}</Text>
            <Text size="sm"><strong>Created At:</strong> {formatDate(selectedRun.createdAt)}</Text>
            <Text size="sm"><strong>Updated At:</strong> {formatDate(selectedRun.updatedAt)}</Text>
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

      {loading ? (
        <Center p="xl">
          <Loader />
        </Center>
      ) : (
        <>
          <Card shadow="sm" padding="sm" radius="sm" mb="xl" withBorder>
            <Group gap="md" align="flex-end">
              <MultiSelect
                label="Filter by status"
                placeholder="Select statuses"
                data={Object.values(ThreadRunStatus).map((s) => ({
                  value: s,
                  label: s,
                }))}
                value={statusesFilter as unknown as string[]}
                onChange={(vals) => {
                  setPage(1);
                  setStatusesFilter(vals as unknown as ThreadRunStatus[]);
                }}
                clearable
                searchable
                maw={280}
              />
              <TextInput
                label="Thread ID"
                placeholder="Filter by thread UUID"
                value={threadIdFilter}
                onChange={(e) => {
                  setPage(1);
                  setThreadIdFilter(e.currentTarget.value);
                }}
                maw={320}
              />
              <CommentDateRangePicker
                value={startedAtRange}
                onSelected={(range) => {
                  setPage(1);
                  setStartedAtRange(range);
                }}
              />
            </Group>
          </Card>

          <Group justify="space-between" mb="sm">
            <Text size="sm" c="dimmed">
              {totalItems !== null ? `${totalItems} total runs` : ""}
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
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {flexRender(column.columnDef.header, header.getContext())}
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
                  <Table.Td colSpan={8}>
                    <Center>No thread runs found</Center>
                  </Table.Td>
                </Table.Tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <Table.Tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <Table.Td key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
