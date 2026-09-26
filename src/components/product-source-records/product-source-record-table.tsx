"use client";
"use no memo";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Center,
  CloseButton,
  Group,
  Input,
  Loader,
  LoadingOverlay,
  MultiSelect,
  SegmentedControl,
  Stack,
  Table,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { FaExternalLinkAlt } from "react-icons/fa";
import { isEmpty } from "lodash";
import { postProductSourceSearch } from "@/api-actions/product-source/product-source-search";
import { postCategorySearch } from "@/api-actions/category/category-search";
import { useProductSourceRecordSearch } from "@/hooks/useProductSourceRecordSearch";
import {
  ProductSourceRecordRow,
  ProductSourceRecordSearchParams,
  ProductSourceRecordSort,
} from "@/models/dtos/product-source-record-models";
import { PRODUCT_SOURCE_TYPE_COLORS } from "@/models/product-source";
import { availabilityBadge } from "@/components/product/details/offers/OfferCard";
import {
  formatMoney,
  formatSpecValue,
} from "@/components/product/details/sources/listing-fields";
import { useListRegistration } from "@/components/list/list-context";
import { ListPagination } from "@/components/list/list-pagination";
import { formatDate, formatRelativeDate } from "@/utils/date";
import { routes } from "@/utils/routes";
import { ProductSourceRecordDetailsModal } from "./ProductSourceRecordDetailsModal";

type Attachment = "all" | "attached" | "unattached";
type Validity = "all" | "valid" | "invalid";

const ATTACHED_PARAM: Record<Attachment, boolean | undefined> = {
  all: undefined,
  attached: true,
  unattached: false,
};

const VALID_PARAM: Record<Validity, boolean | undefined> = {
  all: undefined,
  valid: true,
  invalid: false,
};

interface TextFilters {
  search: string;
  productName: string;
  brand: string;
}

interface Filters extends TextFilters {
  sourceIds: string[];
  categoryIds: string[];
  attachment: Attachment;
  validity: Validity;
}

const TEXT_FILTER_KEYS: (keyof TextFilters)[] = ["search", "productName", "brand"];

// A product's price carries no currency of its own; its offers default to HUF.
const PRODUCT_PRICE_CURRENCY = "HUF";

// The filters live in the URL too, so a filtered list can be linked to — the
// source details page links here with its own source selected.
function filtersFromUrl(params: URLSearchParams): Filters {
  const booleanParam = (key: string) =>
    params.get(key) === "true" ? true : params.get(key) === "false" ? false : undefined;
  const attached = booleanParam("attached");
  const valid = booleanParam("valid");

  return {
    sourceIds: params.getAll("sourceId"),
    categoryIds: params.getAll("categoryId"),
    attachment:
      attached === true ? "attached" : attached === false ? "unattached" : "all",
    validity: valid === true ? "valid" : valid === false ? "invalid" : "all",
    search: params.get("search") ?? "",
    productName: params.get("productName") ?? "",
    brand: params.get("brand") ?? "",
  };
}

function filtersToQuery(filters: Filters): string {
  const query = new URLSearchParams();
  filters.sourceIds.forEach((id) => query.append("sourceId", id));
  filters.categoryIds.forEach((id) => query.append("categoryId", id));
  const attached = ATTACHED_PARAM[filters.attachment];
  if (attached !== undefined) query.set("attached", String(attached));
  const valid = VALID_PARAM[filters.validity];
  if (valid !== undefined) query.set("valid", String(valid));
  for (const key of TEXT_FILTER_KEYS) {
    if (filters[key].trim()) query.set(key, filters[key].trim());
  }
  return query.toString();
}

function Dimmed({ children = "—" }: { children?: React.ReactNode }) {
  return (
    <Text size="sm" c="dimmed">
      {children}
    </Text>
  );
}

const columnHelper = createColumnHelper<ProductSourceRecordRow>();

/**
 * Every source's listings: one row per listing (a source's record of one
 * product page or feed row), on a product or waiting unattached.
 */
export function ProductSourceRecordTable() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [initialFilters] = useState(() => filtersFromUrl(searchParams));
  const [selects, setSelects] = useState<Omit<Filters, keyof TextFilters>>({
    sourceIds: initialFilters.sourceIds,
    categoryIds: initialFilters.categoryIds,
    attachment: initialFilters.attachment,
    validity: initialFilters.validity,
  });
  const [texts, setTexts] = useState<TextFilters>({
    search: initialFilters.search,
    productName: initialFilters.productName,
    brand: initialFilters.brand,
  });
  // Typed a character at a time, so they apply once the typing pauses.
  const [debouncedTexts] = useDebouncedValue(texts, 400);
  const filters = useMemo<Filters>(
    () => ({ ...selects, ...debouncedTexts }),
    [selects, debouncedTexts],
  );

  const [sorting, setSorting] = useState<SortingState>([
    { id: "seenAt", desc: true },
  ]);
  const [pageSize, setPageSize] = useState(50);

  // Any filter or sort change starts again from the first page. Derived rather
  // than reset in an effect, so a change never searches the old page first.
  const resetKey = JSON.stringify({ filters, sorting, pageSize });
  const [paging, setPaging] = useState({ key: resetKey, page: 1 });
  const page = paging.key === resetKey ? paging.page : 1;
  const setPage = (next: number) => setPaging({ key: resetKey, page: next });

  const [sourceOptions, setSourceOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [categoryOptions, setCategoryOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [selectedRow, setSelectedRow] = useState<ProductSourceRecordRow | null>(
    null,
  );

  const { search, loading, searchResult } = useProductSourceRecordSearch();

  useEffect(() => {
    postProductSourceSearch({ page: 1, pageSize: 200, sort: "name", order: "ASC" })
      .then((result) =>
        setSourceOptions(
          (result.items ?? []).map((source) => ({
            value: source.id,
            label: source.name,
          })),
        ),
      )
      .catch(() => undefined);
    postCategorySearch({ page: 1, pageSize: 500, sort: "name", order: "ASC" })
      .then((result) =>
        setCategoryOptions(
          (result.items ?? []).map((category) => ({
            value: category.id,
            label: category.name,
          })),
        ),
      )
      .catch(() => undefined);
  }, []);

  const filterQuery = filtersToQuery(filters);
  useEffect(() => {
    router.replace(filterQuery ? `${pathname}?${filterQuery}` : pathname, {
      scroll: false,
    });
  }, [filterQuery, pathname, router]);

  const searchKey = JSON.stringify({
    page,
    pageSize,
    sort: sorting[0]?.id as ProductSourceRecordSort | undefined,
    order: sorting[0] ? (sorting[0].desc ? "DESC" : "ASC") : undefined,
    sourceIds: filters.sourceIds.length ? filters.sourceIds : undefined,
    categoryIds: filters.categoryIds.length ? filters.categoryIds : undefined,
    attached: ATTACHED_PARAM[filters.attachment],
    valid: VALID_PARAM[filters.validity],
    search: filters.search.trim() || undefined,
    productName: filters.productName.trim() || undefined,
    brand: filters.brand.trim() || undefined,
  } satisfies ProductSourceRecordSearchParams);

  useEffect(() => {
    search(JSON.parse(searchKey));
  }, [searchKey, search]);

  const totalItems = searchResult?.totalItems ?? null;
  useListRegistration({
    totalItems,
    loading,
    onRefresh: () => search(JSON.parse(searchKey)),
  });

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "details",
        header: "",
        cell: ({ row }) => (
          <Button
            size="compact-sm"
            variant="light"
            onClick={() => setSelectedRow(row.original)}
          >
            Details
          </Button>
        ),
      }),

      columnHelper.accessor("title", {
        id: "title",
        header: "Listing",
        cell: ({ row }) => {
          const listing = row.original;
          return (
            <Stack gap={2} miw={240} maw={420}>
              <Group gap={4} wrap="nowrap" align="flex-start">
                <Text size="sm">
                  {listing.originalName ?? listing.title ?? listing.url ?? "—"}
                </Text>
                {listing.url && (
                  <Tooltip label="Open the listing" withArrow>
                    <ActionIcon
                      component="a"
                      href={listing.url}
                      target="_blank"
                      rel="noreferrer"
                      variant="subtle"
                      color="gray"
                      size="xs"
                      aria-label="Open the listing"
                    >
                      <FaExternalLinkAlt size={10} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </Group>
              {(!listing.specValid || listing.offerCount > 1 || listing.categoryName) && (
                <Group gap={4}>
                  {listing.categoryName && (
                    <Badge size="xs" variant="light" color="blue" tt="none">
                      {listing.categoryName}
                    </Badge>
                  )}
                  {listing.offerCount > 1 && (
                    <Badge size="xs" variant="default" tt="none">
                      {listing.offerCount} entries
                    </Badge>
                  )}
                  {!listing.specValid && (
                    <Badge size="xs" variant="light" color="red">
                      Invalid
                    </Badge>
                  )}
                </Group>
              )}
            </Stack>
          );
        },
      }),

      columnHelper.display({
        id: "offerSpecs",
        header: "Offer specs",
        cell: ({ row }) => {
          const specs = row.original.offerSpecs;
          if (isEmpty(specs)) return <Dimmed />;
          return (
            <Group gap={4} miw={160}>
              {specs.map((spec) => (
                <Badge key={spec.key} size="sm" variant="default" tt="none">
                  {spec.label}:{" "}
                  {spec.values
                    .map((value) => formatSpecValue(value, spec.unit))
                    .join(", ")}
                </Badge>
              ))}
            </Group>
          );
        },
      }),

      columnHelper.accessor("sourceName", {
        id: "sourceName",
        header: "Source",
        cell: ({ row }) => {
          const listing = row.original;
          return (
            <Stack gap={2}>
              <Group gap={4} wrap="nowrap">
                <Anchor
                  component={Link}
                  href={routes.productSources.details(listing.sourceId)}
                  size="sm"
                >
                  {listing.sourceName}
                </Anchor>
                <Badge
                  size="xs"
                  variant="light"
                  color={PRODUCT_SOURCE_TYPE_COLORS[listing.sourceType]}
                  tt="none"
                >
                  {listing.sourceType}
                </Badge>
              </Group>
              {listing.url && (
                <Anchor
                  href={listing.url}
                  target="_blank"
                  rel="noreferrer"
                  size="xs"
                  truncate="end"
                  maw={240}
                  title={listing.url}
                >
                  {listing.url.replace(/^https?:\/\//, "")}
                </Anchor>
              )}
            </Stack>
          );
        },
      }),

      columnHelper.accessor("price", {
        id: "price",
        header: "Price",
        cell: ({ row }) => {
          const listing = row.original;
          if (listing.price === null) return <Dimmed />;
          const availability = listing.availability
            ? availabilityBadge(listing.availability)
            : null;
          return (
            <Stack gap={2}>
              <Group gap={6} wrap="nowrap">
                <Text size="sm" fw={600} style={{ whiteSpace: "nowrap" }}>
                  {listing.offerCount > 1 ? "from " : ""}
                  {formatMoney(listing.price, listing.currency)}
                </Text>
                {listing.priceWithoutDiscount !== null && (
                  <Text
                    size="xs"
                    c="dimmed"
                    td="line-through"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    {formatMoney(listing.priceWithoutDiscount, listing.currency)}
                  </Text>
                )}
              </Group>
              {availability && (
                <Badge size="xs" variant="light" color={availability.color}>
                  {availability.label}
                </Badge>
              )}
            </Stack>
          );
        },
      }),

      columnHelper.accessor("productName", {
        id: "productName",
        header: "Product",
        cell: ({ row }) => {
          const listing = row.original;
          return listing.productId ? (
            <Group gap={8} wrap="nowrap" align="flex-start">
              <Anchor
                component={Link}
                href={routes.products.details(listing.productId)}
                size="sm"
                lineClamp={2}
                maw={280}
              >
                {listing.productName ?? listing.productId}
              </Anchor>
              {listing.productPrice !== null && (
                <Tooltip label="The product's price: its cheapest offer" withArrow>
                  <Text size="sm" c="dimmed" style={{ whiteSpace: "nowrap" }}>
                    {formatMoney(listing.productPrice, PRODUCT_PRICE_CURRENCY)}
                  </Text>
                </Tooltip>
              )}
            </Group>
          ) : (
            <Badge color="orange" variant="light">
              Unattached
            </Badge>
          );
        },
      }),

      columnHelper.accessor("seenAt", {
        id: "seenAt",
        header: "Last seen",
        cell: ({ getValue }) => (
          <Tooltip label={formatDate(getValue())} withArrow>
            <Text size="sm" style={{ whiteSpace: "nowrap" }}>
              {formatRelativeDate(getValue())}
            </Text>
          </Tooltip>
        ),
      }),

      columnHelper.accessor("lastUpdated", {
        id: "lastUpdated",
        header: "Updated",
        cell: ({ getValue }) => (
          <Text size="sm" style={{ whiteSpace: "nowrap" }}>
            {formatDate(getValue())}
          </Text>
        ),
      }),
    ],
    [],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: searchResult?.items ?? [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    manualSorting: true,
    manualPagination: true,
    // Always sorted by something: the backend's default would otherwise apply
    // with no arrow saying so.
    enableSortingRemoval: false,
  });

  const textInput = (key: keyof TextFilters, label: string, placeholder: string) => (
    <TextInput
      label={label}
      placeholder={placeholder}
      value={texts[key]}
      onChange={(event) => {
        const value = event.currentTarget.value;
        setTexts((previous) => ({ ...previous, [key]: value }));
      }}
      rightSection={
        texts[key] && (
          <CloseButton
            size="sm"
            onClick={() => setTexts((previous) => ({ ...previous, [key]: "" }))}
          />
        )
      }
      w={240}
    />
  );

  const pagination = (placement: "top" | "bottom") => (
    <ListPagination
      placement={placement}
      page={page}
      pageSize={pageSize}
      totalPages={searchResult?.totalPages || 1}
      totalItems={totalItems}
      onPageChange={setPage}
      onPageSizeChange={setPageSize}
    />
  );

  return (
    <>
      <ProductSourceRecordDetailsModal
        row={selectedRow}
        onClose={() => setSelectedRow(null)}
      />

      <Card shadow="sm" padding="sm" radius="sm" mb="xl" withBorder>
        <Stack gap="sm">
          <Group gap="md" align="flex-end">
            <MultiSelect
              label="Sources"
              placeholder="All sources"
              data={sourceOptions}
              value={selects.sourceIds}
              onChange={(sourceIds) =>
                setSelects((previous) => ({ ...previous, sourceIds }))
              }
              clearable
              searchable
              w={320}
            />
            <MultiSelect
              label="Categories"
              placeholder="All categories"
              data={categoryOptions}
              value={selects.categoryIds}
              onChange={(categoryIds) =>
                setSelects((previous) => ({ ...previous, categoryIds }))
              }
              clearable
              searchable
              w={240}
            />
            <Input.Wrapper label="Product">
              <Box>
                <SegmentedControl
                  value={selects.attachment}
                  onChange={(attachment) =>
                    setSelects((previous) => ({
                      ...previous,
                      attachment: attachment as Attachment,
                    }))
                  }
                  data={[
                    { value: "all", label: "All" },
                    { value: "attached", label: "On a product" },
                    { value: "unattached", label: "Unattached" },
                  ]}
                />
              </Box>
            </Input.Wrapper>
            <Input.Wrapper label="Specs">
              <Box>
                <SegmentedControl
                  value={selects.validity}
                  onChange={(validity) =>
                    setSelects((previous) => ({
                      ...previous,
                      validity: validity as Validity,
                    }))
                  }
                  data={[
                    { value: "all", label: "All" },
                    { value: "valid", label: "Valid" },
                    { value: "invalid", label: "Invalid" },
                  ]}
                />
              </Box>
            </Input.Wrapper>
          </Group>
          <Group gap="md" align="flex-end">
            {textInput("search", "Listing", "Title, URL or external id")}
            {textInput("productName", "Product name", "The product it is on")}
            {textInput("brand", "Brand", "As the listing states it")}
          </Group>
        </Stack>
      </Card>

      {pagination("top")}

      <Box pos="relative">
        <LoadingOverlay
          visible={loading && searchResult !== null}
          overlayProps={{ blur: 1 }}
        />
        <Table.ScrollContainer minWidth={1200}>
          <Table verticalSpacing="xs">
            <Table.Thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <Table.Tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const column = header.column;
                    const sorted = column.getIsSorted();
                    const canSort = column.getCanSort();

                    return (
                      <Table.Th
                        key={header.id}
                        onClick={canSort ? column.getToggleSortingHandler() : undefined}
                        style={canSort ? { cursor: "pointer", whiteSpace: "nowrap" } : undefined}
                      >
                        {flexRender(column.columnDef.header, header.getContext())}
                        {sorted === "asc" && " ▲"}
                        {sorted === "desc" && " ▼"}
                      </Table.Th>
                    );
                  })}
                </Table.Tr>
              ))}
            </Table.Thead>

            <Table.Tbody>
              {searchResult === null ? (
                <Table.Tr>
                  <Table.Td colSpan={columns.length}>
                    <Center p="xl">
                      <Loader />
                    </Center>
                  </Table.Td>
                </Table.Tr>
              ) : isEmpty(table.getRowModel().rows) ? (
                <Table.Tr>
                  <Table.Td colSpan={columns.length}>
                    <Center p="md">No listings match</Center>
                  </Table.Td>
                </Table.Tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <Table.Tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <Table.Td key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </Table.Td>
                    ))}
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Box>

      {pagination("bottom")}
    </>
  );
}
