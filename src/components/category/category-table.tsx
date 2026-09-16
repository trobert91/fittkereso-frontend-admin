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
  ActionIcon,
} from "@mantine/core";
import { isArray, isEmpty } from "lodash";
import Image from "next/image";
import Link from "next/link";
import { routes } from "@/utils/routes";
import { LuExternalLink } from "react-icons/lu";
import { ProductCategory } from "@/models/product-category";
import { useCategorySearch } from "@/hooks/useCategorySearch";
import { CategorySearchParams } from "@/models/dtos/category-search-models";
import { formatDate } from "@/utils/date";

//
// Component
//
import { useListRegistration } from "@/components/list/list-context";
import { ListPagination } from "@/components/list/list-pagination";

export function CategoryTable() {
  const [data, setData] = useState<ProductCategory[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(40);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState<number | null>(null);

  // TanStack sorting state
  const [sorting, setSorting] = useState<SortingState>([]);

  const { search, loading, searchResult, error } = useCategorySearch();
  const columnHelper = useMemo(() => createColumnHelper<ProductCategory>(), []);

  useEffect(() => {
    setData(searchResult?.items || []);
    setTotalPages(searchResult?.totalPages || 1);
    setTotalItems(searchResult?.totalItems ?? null);
  }, [searchResult]);

  const buildSearchParams = (): CategorySearchParams => {
    const sortField = sorting[0]?.id as CategorySearchParams["sort"];
    const sortOrder =
      sorting[0]?.desc === true ? "DESC" : sorting.length ? "ASC" : undefined;

    return { page, pageSize, sort: sortField, order: sortOrder };
  };

  /* Re-runs the query as it stands, bypassing the guard below - which would otherwise skip a
     search whose parameters already match what is loaded. */
  const refresh = () => {
    search(buildSearchParams());
  };

  useListRegistration({ totalItems, loading, onRefresh: refresh });

  // Search if params change
  useEffect(() => {
    if (loading || !pageSize || !page) {
      return;
    }

    const searchParams = buildSearchParams();

    if (
      page !== searchResult?.page ||
      searchParams.sort !== searchResult?.sort ||
      pageSize !== searchResult?.pageSize ||
      searchParams.order !== searchResult?.order
    ) {
      search(searchParams);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sorting, pageSize]);

  //
  // Column definitions
  //
  const columns = useMemo(
    () => [
      columnHelper.group({
        id: "productInfo",
        header: "Product Info",
        columns: [
          columnHelper.accessor("name", {
            id: "name",
            header: ({ column }) => (
              <Text
                fw={500}
                onClick={() =>
                  column.toggleSorting(column.getIsSorted() === "asc")
                }
                style={{ cursor: "pointer" }}
              >
                Name
              </Text>
            ),
            cell: (props) => {
              const name = props.getValue();
              const row = props.row.original;
              const id = row.id;

              return (
                <Text size="sm">
                  {name}{" "}
                  <Link href={routes.categories.details(id)}>
                    <ActionIcon
                      variant="transparent"
                      aria-label="Go to details"
                    >
                      <LuExternalLink
                        style={{ width: "15px", height: "70%" }}
                      />
                    </ActionIcon>
                  </Link>
                </Text>
              );
            },
          }),

          columnHelper.accessor((row) => row, {
            id: "alerts",
            header: () => "",
            cell: (props) => {
              const row = props.getValue();

              // TODO: implement alerts if needed

              return null;
            },
          }),
        ],
      }),

      columnHelper.accessor("enabled", {
        id: "enabled",
        enableSorting: true,
        header: ({ column }) => (
          <Text
            fw={500}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            style={{ cursor: "pointer" }}
          >
            Enabled
          </Text>
        ),
        cell: (props) => (
          <Badge color={props.getValue() ? "green" : "gray"} size="sm" variant="filled">
            {props.getValue() ? "Yes" : "No"}
          </Badge>
        ),
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
        cell: (props) => formatDate(props.getValue() as string),
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
        cell: (props) => formatDate(props.getValue() as string),
      }),
    ],
    [columnHelper]
  );

  //
  // TanStack table instance
  //
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(), // sorting displayed, NOT backend sort logic
    manualSorting: true, // important for backend sort
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
                  <Table.Td colSpan={columns.length}>
                    <Center>No categories found</Center>
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
