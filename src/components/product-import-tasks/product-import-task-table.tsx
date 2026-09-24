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
import {
  ProductImportTask,
  ProductImportTaskSearchParams,
  ProductImportTaskKind,
  ProductSourceType,
  TaskStatus,
} from "@/models/dtos/product-import-task-search-models";
import { useProductImportTaskSearch } from "@/hooks/useProductImportTaskSearch";
import { routes } from "@/utils/routes";
import Link from "next/link";
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

import { useListRegistration } from "@/components/list/list-context";
import { ListPagination } from "@/components/list/list-pagination";

export function ProductImportTaskTable() {
  const [data, setData] = useState<ProductImportTask[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState<number | null>(null);
  const [statusesFilter, setStatusesFilter] = useState<TaskStatus[]>([]);
  const [kindsFilter, setKindsFilter] = useState<ProductImportTaskKind[]>([]);
  const [sourceTypesFilter, setSourceTypesFilter] = useState<ProductSourceType[]>([]);
  const [selectedTask, setSelectedTask] = useState<ProductImportTask | null>(null);
  const [detailsOpened, { open: openDetails, close: closeDetails }] =
    useDisclosure(false);
  const clipboard = useClipboard({ timeout: 2000 });

  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);

  const { search, loading, searchResult } = useProductImportTaskSearch();
  const columnHelper = useMemo(() => createColumnHelper<ProductImportTask>(), []);

  useEffect(() => {
    setData(searchResult?.items || []);
    setTotalPages(searchResult?.totalPages || 1);
    setTotalItems(searchResult?.totalItems ?? null);
  }, [searchResult]);

  const buildSearchParams = (): ProductImportTaskSearchParams => {
    const sortField = sorting[0]?.id as ProductImportTaskSearchParams["sort"];
    const sortOrder =
      sorting[0]?.desc === true ? "DESC" : sorting.length ? "ASC" : undefined;

    return {
      page,
      pageSize,
      sort: sortField,
      order: sortOrder,
      statuses: statusesFilter.length ? statusesFilter : undefined,
      kinds: kindsFilter.length ? kindsFilter : undefined,
      sourceTypes: sourceTypesFilter.length ? sourceTypesFilter : undefined,
    };
  };

  const refresh = () => {
    search(buildSearchParams());
  };

  useListRegistration({ totalItems, loading, onRefresh: refresh });

  useEffect(() => {
    if (loading || !pageSize || !page) {
      return;
    }

    search(buildSearchParams());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sorting, pageSize, statusesFilter, kindsFilter, sourceTypesFilter]);

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

      columnHelper.accessor("kind", {
        id: "kind",
        header: ({ column }) => (
          <Text
            fw={500}
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
            style={{ cursor: "pointer" }}
          >
            Kind
          </Text>
        ),
        cell: (props) => (
          <Badge variant="light" color="gray" tt="none">
            {props.getValue()}
          </Badge>
        ),
      }),

      columnHelper.accessor("priority", {
        id: "priority",
        header: ({ column }) => (
          <Text
            fw={500}
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
            style={{ cursor: "pointer" }}
          >
            Priority
          </Text>
        ),
        cell: (props) => <Text size="sm">{props.getValue()}</Text>,
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
        title={`Import task details — ${selectedTask?.id ?? ""}`}
        size="xl"
      >
        {selectedTask && (
          <Stack gap="xs">
            <Text size="sm">
              <strong>ID:</strong> {selectedTask.id}
            </Text>
            <Text size="sm">
              <strong>Kind:</strong> {selectedTask.kind}
            </Text>
            <Text size="sm">
              <strong>Priority:</strong> {selectedTask.priority}
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
            {selectedTask.identityDecision != null && (
              <>
                <Group justify="space-between" align="center" mt="sm">
                  <Text size="sm" fw={500}>
                    Identity Decision:
                  </Text>
                  <Tooltip label={clipboard.copied ? "Copied!" : "Copy"} withArrow>
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      color={clipboard.copied ? "green" : "gray"}
                      onClick={() =>
                        clipboard.copy(
                          JSON.stringify(selectedTask.identityDecision, null, 2)
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
                  {JSON.stringify(selectedTask.identityDecision, null, 2)}
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
                label="Filter by kind"
                placeholder="Select kinds"
                data={Object.values(ProductImportTaskKind).map((kind) => ({
                  value: kind,
                  label: kind,
                }))}
                value={kindsFilter as unknown as string[]}
                onChange={(vals) => {
                  setPage(1);
                  setKindsFilter(vals as unknown as ProductImportTaskKind[]);
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

          <ListPagination
            page={page}
            pageSize={pageSize}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPage(1);
              setPageSize(size);
            }}
          />

          <Table>
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
                    <Center>No import tasks found</Center>
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

          <ListPagination
            placement="bottom"
            page={page}
            pageSize={pageSize}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPage(1);
              setPageSize(size);
            }}
          />
        </>
      )}
    </>
  );
}
