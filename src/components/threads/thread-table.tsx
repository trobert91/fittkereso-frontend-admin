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
  ActionIcon,
  Badge,
  MultiSelect,
  Group,
  Stack,
  Checkbox,
  Card,
  TextInput,
  Anchor,
  Button,
} from "@mantine/core";
import { isEmpty } from "lodash";
import debounce from "lodash/debounce";
import { format } from "date-fns";
import Link from "next/link";
import { routes } from "@/utils/routes";
import { LuExternalLink } from "react-icons/lu";
import { Thread } from "@/models/thread";
import { useThreadSearch } from "@/hooks/useThreadSearch";
import { ThreadSearchParams } from "@/models/dtos/thread-search-models";
import { FaReddit } from "react-icons/fa";
import { ThreadSource, ThreadStatus } from "@/models/enums/thread-enums";
import { ProductCategory } from "@/models/product-category";
import { ThreadProductCategory } from "@/models/thread-product-category";
import { postCategorySearch } from "@/api-actions/category/category-search";
import { SourceButton } from "../buttons/SourceButton";

// Helper function to get badge color based on value (0-1 range)
const getColorForValue = (value?: number): string => {
  if (value === undefined || value === null) return "gray";
  if (value < 30) return "red";
  if (value < 50) return "orange";
  if (value < 70) return "lime";
  return "green";
};

// Helper function to get badge color based on status
const getColorForStatus = (status: ThreadStatus): string => {
  switch (status) {
    case ThreadStatus.NEW:
      return "blue";
    case ThreadStatus.SELECTED:
      return "cyan";
    case ThreadStatus.PROCESSING:
      return "yellow";
    case ThreadStatus.PROCESSED:
      return "green";
    case ThreadStatus.REPROCESSING:
      return "violet";
    case ThreadStatus.LOW_ESTIMATION:
      return "gray";
    case ThreadStatus.LLM_NO_CATEGORY:
      return "gray";
    case ThreadStatus.LLM_LOW_RELEVANCE:
      return "orange";
    case ThreadStatus.DELETED:
      return "red";
    default:
      return "gray";
  }
};

// Helper function to format status text
const formatStatusText = (status: ThreadStatus): string => {
  return status.split("_").join(" ").toLowerCase();
};

const TITLE_TRUNCATE_LENGTH = 60;

function TitleCell({ title, id }: { title: string; id: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = title.length > TITLE_TRUNCATE_LENGTH;
  const displayed =
    isLong && !expanded ? title.slice(0, TITLE_TRUNCATE_LENGTH) + "…" : title;

  return (
    <div style={{ maxWidth: "300px" }}>
      <Text size="sm" span>
        {displayed}{" "}
        <Link href={routes.threads.details(id)}>
          <ActionIcon
            variant="transparent"
            aria-label="Go to details"
            style={{ display: "inline-flex" }}
          >
            <LuExternalLink style={{ width: "15px", height: "70%" }} />
          </ActionIcon>
        </Link>
      </Text>
      {isLong && (
        <Anchor
          component="button"
          size="xs"
          onClick={() => setExpanded((v) => !v)}
          display="block"
        >
          {expanded ? "show less" : "show more"}
        </Anchor>
      )}
    </div>
  );
}

export function ThreadTable() {
  const [data, setData] = useState<Thread[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState<number | null>(null);
  const [statusesFilter, setStatusesFilter] = useState<ThreadStatus[]>([]);
  const [categoriesFilter, setCategoriesFilter] = useState<string[]>([]);
  const [filterByUncategorized, setFilterByUncategorized] = useState(false);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("");
  const [externalId, setExternalId] = useState<string>("");
  const [debouncedExternalId, setDebouncedExternalId] = useState<string>("");
  const [topicFilter, setTopicFilter] = useState<string>("");
  const [debouncedTopicFilter, setDebouncedTopicFilter] = useState<string>("");

  // TanStack sorting state
  const [sorting, setSorting] = useState<SortingState>([{ id: "relevance", desc: true }]);

  const { search, loading, searchResult, error } = useThreadSearch();
  const columnHelper = useMemo(() => createColumnHelper<Thread>(), []);

  // Debounced setter that updates the value sent to backend
  const setDebouncedSearchTermDebounced = useMemo(
    () =>
      debounce((val: string) => {
        setPage(1);
        setDebouncedSearchTerm(val);
      }, 1000),
    [],
  );

  const setDebouncedExternalIdDebounced = useMemo(
    () =>
      debounce((val: string) => {
        setPage(1);
        setDebouncedExternalId(val);
      }, 1000),
    [],
  );

  const setDebouncedTopicFilterDebounced = useMemo(
    () =>
      debounce((val: string) => {
        setPage(1);
        setDebouncedTopicFilter(val);
      }, 1000),
    [],
  );

  useEffect(() => {
    return () => {
      setDebouncedSearchTermDebounced.cancel();
      setDebouncedExternalIdDebounced.cancel();
      setDebouncedTopicFilterDebounced.cancel();
    };
  }, [setDebouncedSearchTermDebounced, setDebouncedExternalIdDebounced, setDebouncedTopicFilterDebounced]);

  // Fetch top 50 categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const result = await postCategorySearch({
          page: 1,
          pageSize: 50,
        });
        setCategories(result.items || []);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    setData(searchResult?.items || []);
    setTotalPages(searchResult?.totalPages || 1);
    setTotalItems(searchResult?.totalItems ?? null);
  }, [searchResult]);

  // Search if params change
  useEffect(() => {
    if (loading || !pageSize || !page) {
      return;
    }

    const sortField = sorting[0]?.id as ThreadSearchParams["sort"];
    const sortOrder =
      sorting[0]?.desc === true ? "DESC" : sorting.length ? "ASC" : undefined;

    const searchParams: ThreadSearchParams = {
      page,
      pageSize,
      sort: sortField,
      order: sortOrder,
      statuses: statusesFilter.length ? statusesFilter : undefined,
      categoryIds: categoriesFilter.length ? categoriesFilter : undefined,
      filterByUncategorized: filterByUncategorized || undefined,
      searchTerm: debouncedSearchTerm || undefined,
      externalId: debouncedExternalId || undefined,
      topic: debouncedTopicFilter || undefined,
    };

    search(searchParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    sorting,
    pageSize,
    statusesFilter,
    categoriesFilter,
    filterByUncategorized,
    debouncedSearchTerm,
    debouncedExternalId,
    debouncedTopicFilter,
  ]);

  //
  // Column definitions
  //
  const columns = useMemo(
    () => [
      columnHelper.group({
        id: "threadInfo",
        header: "Thread Info",
        columns: [
          columnHelper.accessor("title", {
            id: "title",
            header: ({ column }) => (
              <Text
                fw={500}
                onClick={() =>
                  column.toggleSorting(column.getIsSorted() === "asc")
                }
                style={{ cursor: "pointer" }}
              >
                Title
              </Text>
            ),
            cell: (props) => {
              const title = props.getValue();
              const id = props.row.original.id;
              return <TitleCell title={title} id={id} />;
            },
          }),

          columnHelper.accessor((row) => row, {
            id: "topic",
            header: ({ column }) => (
              <Text
                fw={500}
                onClick={() =>
                  column.toggleSorting(column.getIsSorted() === "asc")
                }
                style={{ cursor: "pointer" }}
              >
                Topic
              </Text>
            ),
            cell: (props) => {
              const { topic, source, url } = props.getValue();
              if (!topic) return <Text size="sm">-</Text>;

              let href: string | undefined;
              if (source === ThreadSource.Reddit) {
                href = `https://www.reddit.com/${topic}`;
              }

              return href ? (
                <Button
                  component="a"
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="light"
                  color="orange"
                  size="compact-sm"
                  rightSection={<LuExternalLink size={12} />}
                  tt="none"
                >
                  {topic}
                </Button>
              ) : (
                <Badge variant="light" color="gray" tt="none">
                  {topic}
                </Badge>
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
                <Badge tt="none" color={getColorForStatus(status)}>
                  {formatStatusText(status)}
                </Badge>
              );
            },
          }),

          columnHelper.accessor("relevanceEstimation", {
            id: "relevanceEstimation",
            header: ({ column }) => (
              <Text
                fw={500}
                onClick={() =>
                  column.toggleSorting(column.getIsSorted() === "asc")
                }
                style={{ cursor: "pointer" }}
              >
                Est.
              </Text>
            ),
            cell: (props) => {
              const value = props.getValue();
              if (value === undefined || value === null) {
                return <Text size="sm">-</Text>;
              }
              return <Badge color={getColorForValue(value)}>{value}</Badge>;
            },
          }),

          columnHelper.accessor("relevance", {
            id: "relevance",
            header: ({ column }) => (
              <Text
                fw={500}
                onClick={() =>
                  column.toggleSorting(column.getIsSorted() === "asc")
                }
                style={{ cursor: "pointer" }}
              >
                Relevance
              </Text>
            ),
            cell: (props) => {
              const value = props.getValue();
              if (value === undefined || value === null) {
                return <Text size="sm">-</Text>;
              }
              return <Badge color={getColorForValue(value)}>{value}</Badge>;
            },
          }),

          columnHelper.accessor((row) => row, {
            id: "source",
            header: ({ column }) => (
              <Text
                fw={500}
                onClick={() =>
                  column.toggleSorting(column.getIsSorted() === "asc")
                }
                style={{ cursor: "pointer" }}
              >
                Source
              </Text>
            ),
            cell: (props) => {
              const row = props.row.original;
              const { source, url } = row;

              const icon =
                source === ThreadSource.Reddit ? <FaReddit size={26} /> : null;

              return (
                <SourceButton
                  source={source}
                  url={url}
                  iconSize={26}
                  showLabel={false}
                />
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

      columnHelper.accessor("categories", {
        id: "categories",
        enableSorting: false,
        header: () => <Text fw={500}>Categories</Text>,
        cell: (props) => {
          const categories = props.getValue();
          if (!categories || categories.length === 0) {
            return <Text size="sm">-</Text>;
          }

          const sorted = [...categories].sort((a, b) => a.rank - b.rank);
          return (
            <Stack gap={4}>
              {sorted.map((tc: ThreadProductCategory) => (
                <Badge
                  key={tc.productCategory.id}
                  color={getColorForValue(tc.confidence)}
                  size="sm"
                  tt="none"
                >
                  {tc.confidence} · {tc.productCategory.name}
                </Badge>
              ))}
            </Stack>
          );
        },
      }),

      columnHelper.accessor("commentCount", {
        id: "commentCount",
        header: ({ column }) => (
          <Text
            fw={500}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            style={{ cursor: "pointer" }}
          >
            Comments
          </Text>
        ),
        cell: (props) => {
          const count = props.getValue();
          return <Text size="sm">{count ?? "-"}</Text>;
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
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
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
    [columnHelper],
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
          <Card shadow="sm" padding="sm" radius="sm" mb="xl" withBorder>
            <Group justify="space-between" mb="sm">
              <Stack gap="xs" style={{ flex: 1 }}>
                <Group gap="md">
                  <MultiSelect
                    label="Filter by status"
                    placeholder="Select statuses"
                    data={Object.values(ThreadStatus).map((s) => ({
                      value: s,
                      label: s.split("_").join(" "),
                    }))}
                    value={statusesFilter as unknown as string[]}
                    onChange={(vals) =>
                      setStatusesFilter(vals as unknown as ThreadStatus[])
                    }
                    clearable
                    searchable
                    maw={300}
                  />
                  <MultiSelect
                    label="Filter by category"
                    placeholder="Select categories"
                    data={categories.map((c) => ({
                      value: c.id,
                      label: c.name,
                    }))}
                    value={categoriesFilter}
                    onChange={setCategoriesFilter}
                    clearable
                    searchable
                    disabled={categoriesLoading}
                    maw={300}
                  />
                  <TextInput
                    label="Search"
                    placeholder="Search by title/topic"
                    onChange={(e) => {
                      const val = e.currentTarget.value;
                      setSearchTerm(val); // update UI immediately
                      setDebouncedSearchTermDebounced(val); // update debounced value
                    }}
                    value={searchTerm}
                    maw={300}
                  />
                  <TextInput
                    label="Topic"
                    placeholder="Filter by topic"
                    onChange={(e) => {
                      const val = e.currentTarget.value;
                      setTopicFilter(val);
                      setDebouncedTopicFilterDebounced(val);
                    }}
                    value={topicFilter}
                    maw={300}
                  />
                  <TextInput
                    label="External ID"
                    placeholder="Filter by external ID"
                    onChange={(e) => {
                      const val = e.currentTarget.value;
                      setExternalId(val); // update UI immediately
                      setDebouncedExternalIdDebounced(val); // update debounced value
                    }}
                    value={externalId}
                    maw={300}
                  />
                  <Checkbox
                    label="Show only uncategorized"
                    checked={filterByUncategorized}
                    onChange={(e) =>
                      setFilterByUncategorized(e.currentTarget.checked)
                    }
                    mt="lg"
                  />
                </Group>
              </Stack>
            </Group>
          </Card>

          <Group justify="space-between" mb="sm">
            <Text size="sm" c="dimmed">{totalItems !== null ? `${totalItems} total threads` : ""}</Text>
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
                  <Table.Td colSpan={9}>
                    <Center>No threads found</Center>
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
