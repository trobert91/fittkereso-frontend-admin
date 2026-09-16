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
  Group,
} from "@mantine/core";
import { isEmpty } from "lodash";
import Link from "next/link";
import { routes } from "@/utils/routes";
import { LuExternalLink } from "react-icons/lu";
import { Brand } from "@/models/brand";
import { useBrandSearch } from "@/hooks/useBrandSearch";
import { BrandSearchParams } from "@/models/dtos/brand-search-models";
import { formatDate } from "@/utils/date";

import { useListRegistration } from "@/components/list/list-context";
import { ListPagination } from "@/components/list/list-pagination";

export function BrandTable() {
  const [data, setData] = useState<Brand[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(40);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState<number | null>(null);

  const [sorting, setSorting] = useState<SortingState>([]);

  const { search, loading, searchResult, error } = useBrandSearch();
  const columnHelper = useMemo(() => createColumnHelper<Brand>(), []);

  useEffect(() => {
    setData(searchResult?.items || []);
    setTotalPages(searchResult?.totalPages || 1);
    setTotalItems(searchResult?.totalItems ?? null);
  }, [searchResult]);

  const buildSearchParams = (): BrandSearchParams => {
    const sortField = sorting[0]?.id as BrandSearchParams["sort"];
    const sortOrder =
      sorting[0]?.desc === true ? "DESC" : sorting.length ? "ASC" : undefined;

    return { page, pageSize, sort: sortField, order: sortOrder };
  };

  /* Re-runs the query as it stands. It cannot go through the effect below, which deliberately
     skips a search whose parameters already match what is loaded - so asking for the page you
     are already on would do nothing, which is exactly what refresh asks for. */
  const refresh = () => {
    search(buildSearchParams());
  };

  useListRegistration({ totalItems, loading, onRefresh: refresh });

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

  const columns = useMemo(
    () => [
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

          return (
            <Text size="sm">
              {name}{" "}
              <Link href={routes.brands.details(row.id)}>
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
        cell: (props) => formatDate(props.getValue() as string),
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
        cell: (props) => formatDate(props.getValue() as string),
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
                    <Center>No brands found</Center>
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
