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
  Group,
  Loader,
  MultiSelect,
  Pagination,
  Select,
  Table,
  Text,
  TextInput,
} from "@mantine/core";
import { format } from "date-fns";
import { isEmpty, isNil } from "lodash";
import {
  ProductSource,
  ProductSourceSearchParams,
  ProductSourceType,
} from "@/models/dtos/product-source-search-models";
import { useProductSourceSearch } from "@/hooks/useProductSourceSearch";
import Link from "next/link";
import { routes } from "@/utils/routes";

const formatDate = (value?: string | null): string => {
  if (!value) {
    return "-";
  }

  return format(new Date(value), "yyyy-MM-dd HH:mm:ss");
};

export function ProductSourceTable() {
  const [data, setData] = useState<ProductSource[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [schedulingEnabledFilter, setSchedulingEnabledFilter] = useState<
    "all" | "true" | "false"
  >("all");
  const [typesFilter, setTypesFilter] = useState<ProductSourceType[]>([]);

  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);

  const { search, loading, searchResult } = useProductSourceSearch();
  const columnHelper = useMemo(() => createColumnHelper<ProductSource>(), []);

  useEffect(() => {
    setData(searchResult?.items || []);
    setTotalPages(searchResult?.totalPages || 1);
    setTotalItems(searchResult?.totalItems ?? null);
  }, [searchResult]);

  useEffect(() => {
    if (loading || !page || !pageSize) {
      return;
    }

    const sortField = sorting[0]?.id as ProductSourceSearchParams["sort"];
    const sortOrder =
      sorting[0]?.desc === true ? "DESC" : sorting.length ? "ASC" : undefined;

    const searchParams: ProductSourceSearchParams = {
      page,
      pageSize,
      searchTerm: isEmpty(searchTerm) ? undefined : searchTerm,
      schedulingEnabled:
        schedulingEnabledFilter === "all"
          ? undefined
          : schedulingEnabledFilter === "true"
          ? true
          : false,
      types: isEmpty(typesFilter) ? undefined : typesFilter,
      sort: sortField,
      order: sortOrder,
    };

    search(searchParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    pageSize,
    sorting,
    searchTerm,
    schedulingEnabledFilter,
    typesFilter,
  ]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        id: "name",
        header: ({ column }) => (
          <Text
            fw={500}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            style={{ cursor: "pointer" }}
          >
            Name
          </Text>
        ),
        cell: (props) => {
          const source = props.row.original;

          return (
            <Link href={routes.productSources.details(source.id)}>
              {props.getValue()}
            </Link>
          );
        },
      }),
      columnHelper.accessor("type", {
        id: "type",
        header: ({ column }) => (
          <Text
            fw={500}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            style={{ cursor: "pointer" }}
          >
            Type
          </Text>
        ),
        cell: (props) => (
          <Badge tt="none" variant="light" color="gray">
            {props.getValue()}
          </Badge>
        ),
      }),
      columnHelper.accessor("schedulingEnabled", {
        id: "schedulingEnabled",
        header: ({ column }) => (
          <Text
            fw={500}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            style={{ cursor: "pointer" }}
          >
            Scheduling
          </Text>
        ),
        cell: (props) => (
          <Badge tt="none" color={props.getValue() ? "green" : "red"}>
            {props.getValue() ? "on" : "off"}
          </Badge>
        ),
      }),
      columnHelper.accessor("processingEnabled", {
        id: "processingEnabled",
        header: ({ column }) => (
          <Text
            fw={500}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            style={{ cursor: "pointer" }}
          >
            Processing
          </Text>
        ),
        cell: (props) => (
          <Badge tt="none" color={props.getValue() ? "green" : "red"}>
            {props.getValue() ? "on" : "off"}
          </Badge>
        ),
      }),
      columnHelper.accessor("priority", {
        id: "priority",
        header: ({ column }) => (
          <Text
            fw={500}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            style={{ cursor: "pointer" }}
          >
            Priority
          </Text>
        ),
      }),
      columnHelper.accessor("maxConcurrent", {
        id: "maxConcurrent",
        header: ({ column }) => (
          <Text
            fw={500}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            style={{ cursor: "pointer" }}
          >
            Max Concurrent
          </Text>
        ),
      }),
      columnHelper.accessor("requestsPerHour", {
        id: "requestsPerHour",
        header: ({ column }) => (
          <Text
            fw={500}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            style={{ cursor: "pointer" }}
          >
            Req / Hour
          </Text>
        ),
      }),
      columnHelper.accessor("fullSyncInterval", {
        id: "fullSyncInterval",
        header: ({ column }) => (
          <Text
            fw={500}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            style={{ cursor: "pointer" }}
          >
            Full Sync
          </Text>
        ),
        cell: (props) => props.getValue() ?? "-",
      }),
      columnHelper.accessor("lastFullSyncAt", {
        id: "lastFullSyncAt",
        header: ({ column }) => (
          <Text
            fw={500}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            style={{ cursor: "pointer" }}
          >
            Last Full Sync
          </Text>
        ),
        cell: (props) => formatDate(props.getValue()),
      }),
      columnHelper.accessor("nextFullSyncAt", {
        id: "nextFullSyncAt",
        header: ({ column }) => (
          <Text
            fw={500}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            style={{ cursor: "pointer" }}
          >
            Next Full Sync
          </Text>
        ),
        cell: (props) => formatDate(props.getValue()),
      }),
      columnHelper.accessor("incrementalSyncInterval", {
        id: "incrementalSyncInterval",
        header: ({ column }) => (
          <Text
            fw={500}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            style={{ cursor: "pointer" }}
          >
            Incr. Sync
          </Text>
        ),
        cell: (props) => props.getValue() ?? "-",
      }),
      columnHelper.accessor("lastIncrementalSyncAt", {
        id: "lastIncrementalSyncAt",
        header: ({ column }) => (
          <Text
            fw={500}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            style={{ cursor: "pointer" }}
          >
            Last Incr. Sync
          </Text>
        ),
        cell: (props) => formatDate(props.getValue()),
      }),
      columnHelper.accessor("nextIncrementalSyncAt", {
        id: "nextIncrementalSyncAt",
        header: ({ column }) => (
          <Text
            fw={500}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            style={{ cursor: "pointer" }}
          >
            Next Incr. Sync
          </Text>
        ),
        cell: (props) => formatDate(props.getValue()),
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
        cell: (props) => formatDate(props.getValue()),
      }),
      columnHelper.accessor("updatedAt", {
        id: "updatedAt",
        header: ({ column }) => (
          <Text
            fw={500}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            style={{ cursor: "pointer" }}
          >
            Updated
          </Text>
        ),
        cell: (props) => formatDate(props.getValue()),
      }),
    ],
    [columnHelper],
  );

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
      {loading ? (
        <Center p="xl">
          <Loader />
        </Center>
      ) : (
        <>
          <Card shadow="sm" padding="sm" radius="sm" mb="xl" withBorder>
            <Group gap="md" align="flex-end">
              <TextInput
                label="Search by name"
                placeholder="Type source name"
                value={searchTerm}
                onChange={(event) => {
                  setPage(1);
                  setSearchTerm(event.currentTarget.value);
                }}
              />

              <Select
                label="Scheduling"
                value={schedulingEnabledFilter}
                data={[
                  { value: "all", label: "All" },
                  { value: "true", label: "Enabled" },
                  { value: "false", label: "Disabled" },
                ]}
                onChange={(value) => {
                  setPage(1);
                  setSchedulingEnabledFilter(
                    (value as "all" | "true" | "false") ?? "all",
                  );
                }}
                w={160}
              />

              <MultiSelect
                label="Filter by type"
                placeholder="Select types"
                data={Object.values(ProductSourceType).map((type) => ({
                  value: type,
                  label: type,
                }))}
                value={typesFilter as unknown as string[]}
                onChange={(values) => {
                  setPage(1);
                  setTypesFilter(values as unknown as ProductSourceType[]);
                }}
                clearable
                searchable
                maw={300}
              />
            </Group>
          </Card>

          <Group justify="space-between" mb="sm">
            <Text size="sm" c="dimmed">
              {!isNil(totalItems) ? `${totalItems} total product sources` : ""}
            </Text>

            <Group gap="sm">
              <Select
                size="xs"
                label="Per page"
                data={["20", "50", "100"]}
                value={String(pageSize)}
                onChange={(value) => {
                  if (value) {
                    setPage(1);
                    setPageSize(Number(value));
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
              {table.getHeaderGroups().map((headerGroup) => (
                <Table.Tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    if (header.isPlaceholder) {
                      return <th key={header.id}></th>;
                    }

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
                            header.getContext(),
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
                  <Table.Td colSpan={16}>
                    <Center>No product sources found</Center>
                  </Table.Td>
                </Table.Tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <Table.Tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <Table.Td key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
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
