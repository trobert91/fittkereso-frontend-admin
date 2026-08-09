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
} from "@mantine/core";
import { isEmpty } from "lodash";
import { format } from "date-fns";
import {
  ThreadSearchKeyword,
  ThreadSearchKeywordSearchParams,
  ThreadPlatform,
} from "@/models/dtos/thread-search-keyword-search-models";
import { useThreadSearchKeywordSearch } from "@/hooks/useThreadSearchKeywordSearch";
import { postCategorySearch } from "@/api-actions/category/category-search";
import { ProductCategory } from "@/models/product-category";

const formatDate = (value?: string | null): string => {
  if (!value) return "-";
  return format(new Date(value), "yyyy-MM-dd HH:mm:ss");
};

export function ThreadSearchKeywordTable() {
  const [data, setData] = useState<ThreadSearchKeyword[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState<number | null>(null);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [categoryIdsFilter, setCategoryIdsFilter] = useState<string[]>([]);
  const [platformsFilter, setPlatformsFilter] = useState<ThreadPlatform[]>([]);

  const [sorting, setSorting] = useState<SortingState>([
    { id: "lastSearchedAt", desc: true },
  ]);

  const { search, loading, searchResult } = useThreadSearchKeywordSearch();
  const columnHelper = useMemo(
    () => createColumnHelper<ThreadSearchKeyword>(),
    []
  );

  useEffect(() => {
    const loadCategories = async () => {
      const result = await postCategorySearch({ page: 1, pageSize: 200 });
      setCategories(result.items ?? []);
    };
    loadCategories();
  }, []);

  useEffect(() => {
    setData(searchResult?.items || []);
    setTotalPages(searchResult?.totalPages || 1);
    setTotalItems(searchResult?.totalItems ?? null);
  }, [searchResult]);

  useEffect(() => {
    if (loading || !pageSize || !page) {
      return;
    }

    const sortField = sorting[0]?.id as ThreadSearchKeywordSearchParams["sort"];
    const sortOrder =
      sorting[0]?.desc === true ? "DESC" : sorting.length ? "ASC" : undefined;

    const searchParams: ThreadSearchKeywordSearchParams = {
      page,
      pageSize,
      sort: sortField,
      order: sortOrder,
      categoryIds: categoryIdsFilter.length ? categoryIdsFilter : undefined,
      platforms: platformsFilter.length ? platformsFilter : undefined,
    };

    search(searchParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sorting, pageSize, categoryIdsFilter, platformsFilter]);

  const columns = useMemo(
    () => [
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
        cell: (props) => (
          <Text size="sm" fw={500}>
            {props.getValue()}
          </Text>
        ),
      }),

      columnHelper.accessor("category", {
        id: "category",
        enableSorting: false,
        header: () => <Text fw={500}>Category</Text>,
        cell: (props) => {
          const category = props.getValue();
          return (
            <Text size="sm" c="dimmed">
              {category?.name ?? "—"}
            </Text>
          );
        },
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

      columnHelper.accessor("lastSearchedAt", {
        id: "lastSearchedAt",
        header: ({ column }) => (
          <Text
            fw={500}
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
            style={{ cursor: "pointer" }}
          >
            Last Searched
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

      columnHelper.accessor("updatedAt", {
        id: "updatedAt",
        header: ({ column }) => (
          <Text
            fw={500}
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
            style={{ cursor: "pointer" }}
          >
            Updated
          </Text>
        ),
        cell: (props) => <Text size="sm">{formatDate(props.getValue())}</Text>,
      }),
    ],
    [columnHelper]
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
      {loading ? (
        <Center p="xl">
          <Loader />
        </Center>
      ) : (
        <>
          <Card shadow="sm" padding="sm" radius="sm" mb="xl" withBorder>
            <Group gap="md">
              <MultiSelect
                label="Filter by category"
                placeholder="Select categories"
                data={categories.map((c) => ({ value: c.id, label: c.name }))}
                value={categoryIdsFilter}
                onChange={(vals) => {
                  setPage(1);
                  setCategoryIdsFilter(vals);
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
                ? `${totalItems} total thread search keywords`
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
                  <Table.Td colSpan={6}>
                    <Center>No thread search keywords found</Center>
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
