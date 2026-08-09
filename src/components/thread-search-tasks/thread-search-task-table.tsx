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
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { isEmpty } from "lodash";
import { format } from "date-fns";
import {
  ThreadSearchTask,
  ThreadSearchTaskSearchParams,
  ThreadPlatform,
  TaskStatus,
} from "@/models/dtos/thread-search-task-search-models";
import { useThreadSearchTaskSearch } from "@/hooks/useThreadSearchTaskSearch";

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

export function ThreadSearchTaskTable() {
  const [data, setData] = useState<ThreadSearchTask[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState<number | null>(null);
  const [statusesFilter, setStatusesFilter] = useState<TaskStatus[]>([]);
  const [platformsFilter, setPlatformsFilter] = useState<ThreadPlatform[]>([]);
  const [selectedTask, setSelectedTask] = useState<ThreadSearchTask | null>(
    null
  );
  const [detailsOpened, { open: openDetails, close: closeDetails }] =
    useDisclosure(false);

  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);

  const { search, loading, searchResult } = useThreadSearchTaskSearch();
  const columnHelper = useMemo(
    () => createColumnHelper<ThreadSearchTask>(),
    []
  );

  useEffect(() => {
    setData(searchResult?.items || []);
    setTotalPages(searchResult?.totalPages || 1);
    setTotalItems(searchResult?.totalItems ?? null);
  }, [searchResult]);

  useEffect(() => {
    if (loading || !pageSize || !page) {
      return;
    }

    const sortField = sorting[0]?.id as ThreadSearchTaskSearchParams["sort"];
    const sortOrder =
      sorting[0]?.desc === true ? "DESC" : sorting.length ? "ASC" : undefined;

    const searchParams: ThreadSearchTaskSearchParams = {
      page,
      pageSize,
      sort: sortField,
      order: sortOrder,
      statuses: statusesFilter.length ? statusesFilter : undefined,
      platforms: platformsFilter.length ? platformsFilter : undefined,
    };

    search(searchParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sorting, pageSize, statusesFilter, platformsFilter]);

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

      columnHelper.accessor("keyword", {
        id: "keyword",
        header: ({ column }) => (
          <Text
            fw={500}
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
            style={{ cursor: "pointer" }}
          >
            Keyword
          </Text>
        ),
        cell: (props) => <Text size="sm">{props.getValue()}</Text>,
      }),

      columnHelper.accessor("platform", {
        id: "platform",
        header: ({ column }) => (
          <Text
            fw={500}
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
            style={{ cursor: "pointer" }}
          >
            Platform
          </Text>
        ),
        cell: (props) => (
          <Badge variant="light" color="gray" tt="none">
            {props.getValue()}
          </Badge>
        ),
      }),

      columnHelper.accessor("categorySlug", {
        id: "categorySlug",
        header: ({ column }) => (
          <Text
            fw={500}
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
            style={{ cursor: "pointer" }}
          >
            Category
          </Text>
        ),
        cell: (props) => <Text size="sm">{props.getValue()}</Text>,
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

      columnHelper.accessor("duplicates", {
        id: "duplicates",
        header: ({ column }) => (
          <Text
            fw={500}
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
            style={{ cursor: "pointer" }}
          >
            Duplicates
          </Text>
        ),
        cell: (props) => <Text size="sm">{props.getValue()}</Text>,
      }),

      columnHelper.accessor("discovered", {
        id: "discovered",
        header: ({ column }) => (
          <Text
            fw={500}
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
            style={{ cursor: "pointer" }}
          >
            Discovered
          </Text>
        ),
        cell: (props) => <Text size="sm">{props.getValue()}</Text>,
      }),

      columnHelper.accessor("belowRelevance", {
        id: "belowRelevance",
        header: ({ column }) => (
          <Text
            fw={500}
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
            style={{ cursor: "pointer" }}
          >
            Below Relevance
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
        title={`Thread search task details — ${selectedTask?.id ?? ""}`}
        size="xl"
      >
        {selectedTask && (
          <Stack gap="xs">
            <Text size="sm">
              <strong>ID:</strong> {selectedTask.id}
            </Text>
            <Text size="sm">
              <strong>Keyword:</strong> {selectedTask.keyword}
            </Text>
            <Text size="sm">
              <strong>Platform:</strong> {selectedTask.platform}
            </Text>
            <Text size="sm">
              <strong>Category:</strong> {selectedTask.categorySlug}
            </Text>
            <Text size="sm">
              <strong>Status:</strong> {selectedTask.status}
            </Text>
            <Text size="sm">
              <strong>Attempts:</strong> {selectedTask.attempts}
            </Text>
            <Text size="sm">
              <strong>Duplicates:</strong> {selectedTask.duplicates}
            </Text>
            <Text size="sm">
              <strong>Discovered:</strong> {selectedTask.discovered}
            </Text>
            <Text size="sm">
              <strong>Below Relevance:</strong> {selectedTask.belowRelevance}
            </Text>
            <Text size="sm">
              <strong>Exec Time (s):</strong>{" "}
              {selectedTask.executionTimeInSec != null
                ? selectedTask.executionTimeInSec.toFixed(2)
                : "-"}
            </Text>
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
                label="Filter by platform"
                placeholder="Select platforms"
                data={Object.values(ThreadPlatform).map((p) => ({
                  value: p,
                  label: p,
                }))}
                value={platformsFilter as unknown as string[]}
                onChange={(vals) => {
                  setPage(1);
                  setPlatformsFilter(vals as unknown as ThreadPlatform[]);
                }}
                clearable
                searchable
                maw={300}
              />
            </Group>
          </Card>

          <Group justify="space-between" mb="sm">
            <Text size="sm" c="dimmed">
              {totalItems !== null
                ? `${totalItems} total thread search tasks`
                : ""}
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
                  <Table.Td colSpan={13}>
                    <Center>No thread search tasks found</Center>
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
