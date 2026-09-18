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
  Anchor,
  Loader,
  Center,
  Select,
  Text,
  Badge,
  MultiSelect,
  TextInput,
  Group,
  Card,
  Stack,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { isEmpty } from "lodash";
import Link from "next/link";
import { routes } from "@/utils/routes";
import {
  AdminUser,
  ROLE_COLORS,
  ROLE_LABELS,
  USER_ROLES,
  UserRole,
} from "@/models/admin-user";
import { useUserSearch } from "@/hooks/useUserSearch";
import { UserSearchParams } from "@/models/dtos/user-search-models";
import { formatDate } from "@/utils/date";

import { useListRegistration } from "@/components/list/list-context";
import { ListPagination } from "@/components/list/list-pagination";

/**
 * The account list.
 *
 * Deliberately read-only: no inline role switch, no inline hold toggle. Sellers
 * have an inline activate button, but role is not that kind of field - changing
 * someone's access is worth the deliberate trip to their page, where the whole
 * account is in view.
 */
export function UserTable() {
  const [data, setData] = useState<AdminUser[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(40);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState<number | null>(null);

  const [searchTermInput, setSearchTermInput] = useState("");
  const [searchTerm] = useDebouncedValue(searchTermInput, 300);
  const [rolesFilter, setRolesFilter] = useState<string[]>([]);
  const [heldFilter, setHeldFilter] = useState<string | null>(null);

  // Alphabetical by default, matching the API - a directory, not a feed.
  const [sorting, setSorting] = useState<SortingState>([
    { id: "email", desc: false },
  ]);

  const { search, loading, searchResult } = useUserSearch();
  const columnHelper = useMemo(() => createColumnHelper<AdminUser>(), []);

  useEffect(() => {
    setData(searchResult?.items || []);
    setTotalPages(searchResult?.totalPages || 1);
    setTotalItems(searchResult?.totalItems ?? null);
  }, [searchResult]);

  const buildSearchParams = (): UserSearchParams => {
    const sortField = sorting[0]?.id as UserSearchParams["sort"];
    const sortOrder =
      sorting[0]?.desc === true ? "DESC" : sorting.length ? "ASC" : undefined;

    return {
      page,
      pageSize,
      sort: sortField,
      order: sortOrder,
      searchTerm: searchTerm || undefined,
      roles: rolesFilter.length ? (rolesFilter as UserRole[]) : undefined,
      passwordChangeRequired: heldFilter ? heldFilter === "true" : undefined,
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
  }, [page, sorting, pageSize, searchTerm, rolesFilter, heldFilter]);

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
          const name = props.getValue();
          const row = props.row.original;

          return (
            <Stack gap={0}>
              <Anchor
                component={Link}
                href={routes.users.details(row.id)}
                size="sm"
              >
                {/* An account can exist before anyone gives it a name. */}
                {name || "Unnamed"}
              </Anchor>
            </Stack>
          );
        },
      }),

      columnHelper.accessor("email", {
        id: "email",
        header: ({ column }) => (
          <Text
            fw={500}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            style={{ cursor: "pointer" }}
          >
            Email
          </Text>
        ),
        cell: (props) => <Text size="sm">{props.getValue()}</Text>,
      }),

      columnHelper.accessor("role", {
        id: "role",
        header: ({ column }) => (
          <Text
            fw={500}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            style={{ cursor: "pointer" }}
          >
            Role
          </Text>
        ),
        cell: (props) => {
          const role = props.getValue();
          return (
            <Badge color={ROLE_COLORS[role]} tt="none">
              {ROLE_LABELS[role]}
            </Badge>
          );
        },
      }),

      columnHelper.accessor("passwordChangeRequired", {
        id: "passwordChangeRequired",
        enableSorting: false,
        header: () => <Text fw={500}>Password</Text>,
        cell: (props) =>
          props.getValue() ? (
            <Badge color="orange" tt="none">
              Temporary
            </Badge>
          ) : (
            <Text size="sm" c="dimmed">
              Set
            </Text>
          ),
      }),

      columnHelper.accessor("lastSignInAt", {
        id: "lastSignInAt",
        header: ({ column }) => (
          <Text
            fw={500}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            style={{ cursor: "pointer" }}
          >
            Last sign-in
          </Text>
        ),
        cell: (props) => {
          const value = props.getValue();
          return value ? (
            <Text size="sm">{formatDate(value)}</Text>
          ) : (
            <Text size="sm" c="dimmed">
              Never
            </Text>
          );
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
    [columnHelper]
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
      <Card shadow="sm" padding="sm" radius="sm" mb="xl" withBorder>
        <Group gap="md">
          <TextInput
            label="Search"
            placeholder="Name or email"
            value={searchTermInput}
            onChange={(e) => {
              setPage(1);
              setSearchTermInput(e.currentTarget.value);
            }}
            maw={250}
          />
          <MultiSelect
            label="Filter by role"
            placeholder="Select roles"
            data={USER_ROLES.map((role) => ({
              value: role,
              label: ROLE_LABELS[role],
            }))}
            value={rolesFilter}
            onChange={(vals) => {
              setPage(1);
              setRolesFilter(vals);
            }}
            clearable
            maw={250}
          />
          <Select
            label="Password"
            placeholder="Any"
            data={[
              { value: "true", label: "Temporary" },
              { value: "false", label: "Set" },
            ]}
            value={heldFilter}
            onChange={(val) => {
              setPage(1);
              setHeldFilter(val);
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
                  <Table.Td colSpan={columns.length}>
                    <Center>No users found</Center>
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
