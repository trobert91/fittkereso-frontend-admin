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
  Text,
  Badge,
  ActionIcon,
  Group,
} from "@mantine/core";
import { isEmpty } from "lodash";
import { format } from "date-fns";
import Link from "next/link";
import { routes } from "@/utils/routes";
import { LuExternalLink } from "react-icons/lu";
import { Brand } from "@/models/brand";
import { useBrandSearch } from "@/hooks/useBrandSearch";
import { BrandSearchParams } from "@/models/dtos/brand-search-models";

export function BrandTable() {
  const [data, setData] = useState<Brand[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(40);
  const [totalPages, setTotalPages] = useState(1);

  const [sorting, setSorting] = useState<SortingState>([]);

  const { search, loading, searchResult, error } = useBrandSearch();
  const columnHelper = useMemo(() => createColumnHelper<Brand>(), []);

  useEffect(() => {
    setData(searchResult?.items || []);
    setTotalPages(searchResult?.totalPages || 1);
  }, [searchResult]);

  useEffect(() => {
    if (loading || !pageSize || !page) {
      return;
    }

    const sortField = sorting[0]?.id as BrandSearchParams["sort"];
    const sortOrder =
      sorting[0]?.desc === true ? "DESC" : sorting.length ? "ASC" : undefined;

    if (
      page !== searchResult?.page ||
      sortField !== searchResult?.sort ||
      pageSize !== searchResult?.pageSize ||
      sortOrder !== searchResult?.order
    ) {
      const searchParams: BrandSearchParams = {
        page,
        pageSize,
        sort: sortField,
        order: sortOrder,
      };

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
        cell: (props) => {
          const date = new Date(props.getValue() as string);
          return format(date, "yyyy-MM-dd HH:mm:ss");
        },
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
        cell: (props) => {
          const date = new Date(props.getValue() as string);
          return format(date, "yyyy-MM-dd HH:mm:ss");
        },
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

          <Center mt="md">
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
