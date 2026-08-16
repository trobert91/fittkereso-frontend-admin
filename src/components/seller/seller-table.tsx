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
  TextInput,
  Group,
  Card,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { isEmpty } from "lodash";
import { format } from "date-fns";
import Link from "next/link";
import { LuExternalLink } from "react-icons/lu";
import { PiPower } from "react-icons/pi";
import { routes } from "@/utils/routes";
import { Seller } from "@/models/seller";
import { useSellerSearch } from "@/hooks/useSellerSearch";
import { SellerSearchParams } from "@/models/dtos/seller-search-models";
import { postSellerUpdate } from "@/api-actions/seller/seller-update";

const formatDate = (value?: string | null): string => {
  if (!value) return "-";
  return format(new Date(value), "yyyy-MM-dd HH:mm:ss");
};

export function SellerTable() {
  const [data, setData] = useState<Seller[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(40);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState<number | null>(null);

  const [searchTermInput, setSearchTermInput] = useState("");
  const [searchTerm] = useDebouncedValue(searchTermInput, 300);
  const [typesFilter, setTypesFilter] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [verifiedFilter, setVerifiedFilter] = useState<string | null>(null);

  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);

  const { search, loading, searchResult } = useSellerSearch();
  const columnHelper = useMemo(() => createColumnHelper<Seller>(), []);

  useEffect(() => {
    setData(searchResult?.items || []);
    setTotalPages(searchResult?.totalPages || 1);
    setTotalItems(searchResult?.totalItems ?? null);
  }, [searchResult]);

  useEffect(() => {
    if (loading || !pageSize || !page) {
      return;
    }

    const sortField = sorting[0]?.id as SellerSearchParams["sort"];
    const sortOrder =
      sorting[0]?.desc === true ? "DESC" : sorting.length ? "ASC" : undefined;

    const searchParams: SellerSearchParams = {
      page,
      pageSize,
      sort: sortField,
      order: sortOrder,
      searchTerm: searchTerm || undefined,
      types: typesFilter.length
        ? (typesFilter as SellerSearchParams["types"])
        : undefined,
      active: activeFilter ? activeFilter === "true" : undefined,
      verified: verifiedFilter ? verifiedFilter === "true" : undefined,
    };

    search(searchParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    sorting,
    pageSize,
    searchTerm,
    typesFilter,
    activeFilter,
    verifiedFilter,
  ]);

  const toggleActive = async (seller: Seller) => {
    try {
      await postSellerUpdate(seller.id, {
        name: seller.name,
        type: seller.type,
        active: !seller.active,
      });
      setData((prev) =>
        prev.map((s) =>
          s.id === seller.id ? { ...s, active: !seller.active } : s
        )
      );
      notifications.show({
        title: "Success",
        message: seller.active
          ? "Seller deactivated"
          : "Seller activated",
        color: "green",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update seller";
      notifications.show({ title: "Error", message, color: "red" });
    }
  };

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
              <Link href={routes.sellers.details(row.id)}>
                <ActionIcon variant="transparent" aria-label="Go to details">
                  <LuExternalLink style={{ width: "15px", height: "70%" }} />
                </ActionIcon>
              </Link>
            </Text>
          );
        },
      }),

      columnHelper.accessor("type", {
        id: "type",
        header: ({ column }) => (
          <Text
            fw={500}
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
            style={{ cursor: "pointer" }}
          >
            Type
          </Text>
        ),
        cell: (props) => (
          <Badge variant="light" color="gray" tt="none">
            {props.getValue()}
          </Badge>
        ),
      }),

      columnHelper.accessor("verified", {
        id: "verified",
        header: ({ column }) => (
          <Text
            fw={500}
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
            style={{ cursor: "pointer" }}
          >
            Verified
          </Text>
        ),
        cell: (props) => (
          <Badge color={props.getValue() ? "green" : "gray"} tt="none">
            {props.getValue() ? "Verified" : "Unverified"}
          </Badge>
        ),
      }),

      columnHelper.accessor("active", {
        id: "active",
        header: ({ column }) => (
          <Text
            fw={500}
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
            style={{ cursor: "pointer" }}
          >
            Active
          </Text>
        ),
        cell: (props) => {
          const seller = props.row.original;
          const active = props.getValue();
          return (
            <Group gap="xs" wrap="nowrap">
              <Badge color={active ? "green" : "red"} tt="none">
                {active ? "Active" : "Inactive"}
              </Badge>
              <Tooltip label={active ? "Deactivate" : "Activate"} withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color={active ? "red" : "green"}
                  onClick={() => toggleActive(seller)}
                  aria-label={active ? "Deactivate seller" : "Activate seller"}
                >
                  <PiPower size={14} />
                </ActionIcon>
              </Tooltip>
            </Group>
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <Card shadow="sm" padding="sm" radius="sm" mb="xl" withBorder>
        <Group gap="md">
          <TextInput
            label="Search by name"
            placeholder="Seller name"
            value={searchTermInput}
            onChange={(e) => {
              setPage(1);
              setSearchTermInput(e.currentTarget.value);
            }}
            maw={250}
          />
          <MultiSelect
            label="Filter by type"
            placeholder="Select types"
            data={[
              { value: "business", label: "business" },
              { value: "private", label: "private" },
            ]}
            value={typesFilter}
            onChange={(vals) => {
              setPage(1);
              setTypesFilter(vals);
            }}
            clearable
            maw={250}
          />
          <Select
            label="Verified"
            placeholder="Any"
            data={[
              { value: "true", label: "Verified" },
              { value: "false", label: "Unverified" },
            ]}
            value={verifiedFilter}
            onChange={(val) => {
              setPage(1);
              setVerifiedFilter(val);
            }}
            clearable
            maw={150}
          />
          <Select
            label="Active"
            placeholder="Any"
            data={[
              { value: "true", label: "Active" },
              { value: "false", label: "Inactive" },
            ]}
            value={activeFilter}
            onChange={(val) => {
              setPage(1);
              setActiveFilter(val);
            }}
            clearable
            maw={150}
          />
        </Group>
      </Card>

      {loading ? (
        <Center p="xl">
          <Loader />
        </Center>
      ) : (
        <>
          <Group justify="space-between" mb="sm">
            <Text size="sm" c="dimmed">
              {totalItems !== null ? `${totalItems} total sellers` : ""}
            </Text>
            <Group gap="sm">
              <Select
                size="xs"
                label="Per page"
                data={["20", "40", "100"]}
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
                  <Table.Td colSpan={columns.length}>
                    <Center>No sellers found</Center>
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
