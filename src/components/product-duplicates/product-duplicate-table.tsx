"use client";
"use no memo";

import { useEffect, useMemo, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Anchor,
  Badge,
  Button,
  Card,
  Center,
  Group,
  Image,
  Loader,
  NumberInput,
  Select,
  Stack,
  Table,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { postCategorySearch } from "@/api-actions/category/category-search";
import {
  postDismissProductDuplicate,
  postReopenProductDuplicate,
} from "@/api-actions/product-duplicate/product-duplicate-actions";
import { ProductSpecsBadges } from "@/components/product/product-specs-badges";
import { ProductOfferButtons } from "@/components/product/product-offer-buttons";
import { productImageUrl } from "@/utils/product-image";
import { useProductDuplicateSearch } from "@/hooks/useProductDuplicateSearch";
import {
  ProductDuplicateDetectedBy,
  ProductDuplicatePair,
  ProductDuplicatePairStatus,
} from "@/models/dtos/product-duplicate-search-models";
import { ProductCategory } from "@/models/product-category";
import { ProductModel } from "@/models/product-model";
import { ProductDetailsModal } from "@/components/product/details-modal";
import { DuplicatePairCompareModal } from "./duplicate-pair-compare-modal";
import { FailedGateBadges } from "./failed-gate-badges";

const PAGE_SIZE = 50;

const STATUS_OPTIONS: { value: ProductDuplicatePairStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "dismissed", label: "Dismissed" },
];

const DETECTED_BY_LABELS: Record<ProductDuplicateDetectedBy, string> = {
  scrape: "Scrape",
  scan: "Scan",
  merge: "Merge",
};

/**
 * Big enough to read a frame shape off, which is the whole reason the picture
 * is in the row: at thumbnail size a Trapéz and an Alacsony frame look alike.
 */
const THUMBNAIL_SIZE = 200;

function ProductCell({
  product,
  onOpenDetails,
}: {
  product: ProductModel;
  onOpenDetails: (productId: string) => void;
}) {
  const imageUrl = productImageUrl(product);

  return (
    <Group align="flex-start" wrap="nowrap" gap="sm">
      <UnstyledButton
        onClick={() => onOpenDetails(product.id)}
        aria-label={`Open ${product.displayName}`}
        style={{ flexShrink: 0 }}
      >
        <Card
          p={4}
          radius="sm"
          withBorder
          w={THUMBNAIL_SIZE}
          h={THUMBNAIL_SIZE}
          style={{ cursor: "pointer" }}
        >
          <Center h="100%">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={product.displayName}
                h={THUMBNAIL_SIZE - 12}
                fit="contain"
              />
            ) : (
              <Text size="xs" c="dimmed">
                —
              </Text>
            )}
          </Center>
        </Card>
      </UnstyledButton>

      <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
        <Anchor
          component="button"
          type="button"
          onClick={() => onOpenDetails(product.id)}
          size="sm"
          fw={500}
          ta="left"
        >
          {product.displayName}
        </Anchor>
        <Text size="xs" c="dimmed">
          {product.brand?.name} · {product.productCategory?.name}
        </Text>
        <ProductSpecsBadges specs={product.orderedSpecs} />
        <ProductOfferButtons sources={product.sources} />
      </Stack>
    </Group>
  );
}

import { useListRegistration } from "@/components/list/list-context";
import { ListPagination } from "@/components/list/list-pagination";

export function ProductDuplicateTable() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [status, setStatus] = useState<ProductDuplicatePairStatus>("open");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  // Typed straight into the query, so the value the user is still typing is
  // held apart from the one that is searched on.
  const [minScoreInput, setMinScoreInput] = useState<number | "">("");
  const [maxScoreInput, setMaxScoreInput] = useState<number | "">("");
  const [minScore] = useDebouncedValue(minScoreInput, 400);
  const [maxScore] = useDebouncedValue(maxScoreInput, 400);
  const [comparePair, setComparePair] = useState<ProductDuplicatePair | null>(
    null
  );
  const [detailsProductId, setDetailsProductId] = useState<string | null>(null);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const { search, loading, searchResult } = useProductDuplicateSearch();
  const data = searchResult?.items ?? [];

  const doSearch = () => {
    search({
      page,
      pageSize,
      status,
      categoryIds: categoryId ? [categoryId] : undefined,
      minScore: minScore === "" ? undefined : minScore,
      maxScore: maxScore === "" ? undefined : maxScore,
    });
  };

  // This table already had its search extracted, so refresh is just that function again.
  useListRegistration({
    totalItems: searchResult?.totalItems ?? null,
    loading,
    onRefresh: doSearch,
  });

  useEffect(() => {
    postCategorySearch({ page: 1, pageSize: 100 })
      .then((result) => setCategories(result.items || []))
      .catch((err) => console.error("Failed to fetch categories:", err))
      .finally(() => setCategoriesLoading(false));
  }, []);

  useEffect(() => {
    doSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, status, categoryId, minScore, maxScore]);

  const handleDismiss = (pair: ProductDuplicatePair) => {
    modals.openConfirmModal({
      title: "Not duplicates",
      children: (
        <Text size="sm">
          Mark {pair.productA.displayName} and {pair.productB.displayName} as
          different products? The pair will not be suggested again.
        </Text>
      ),
      labels: { confirm: "Dismiss", cancel: "Cancel" },
      onConfirm: async () => {
        try {
          await postDismissProductDuplicate(pair.id);
          doSearch();
        } catch (err) {
          notifications.show({
            color: "red",
            title: "Dismiss failed",
            message: err instanceof Error ? err.message : "An error occurred",
          });
        }
      },
    });
  };

  // No confirm: reopening only puts the pair back in the queue, and the
  // dismissal it undoes was itself one click.
  const handleReopen = async (pair: ProductDuplicatePair) => {
    try {
      await postReopenProductDuplicate(pair.id);
      doSearch();
    } catch (err) {
      notifications.show({
        color: "red",
        title: "Reopen failed",
        message: err instanceof Error ? err.message : "An error occurred",
      });
    }
  };

  const columnHelper = useMemo(
    () => createColumnHelper<ProductDuplicatePair>(),
    []
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("productA", {
        header: "Product A",
        cell: (props) => (
          <ProductCell
            product={props.getValue()}
            onOpenDetails={setDetailsProductId}
          />
        ),
      }),
      columnHelper.accessor("productB", {
        header: "Product B",
        cell: (props) => (
          <ProductCell
            product={props.getValue()}
            onOpenDetails={setDetailsProductId}
          />
        ),
      }),
      // Score and contradictions share a column: the gates are what produced
      // the number, so reading them apart from it means reading them twice.
      // The minimum width is what keeps the badge from being squeezed to an
      // ellipsis now that both product cells carry a 200px image.
      columnHelper.display({
        id: "score",
        header: "Score",
        cell: (props) => {
          const pair = props.row.original;
          return (
            <Stack gap={6} align="flex-start" miw={200}>
              <Badge
                color={pair.similarityScore >= 80 ? "green" : "yellow"}
                variant="light"
                size="lg"
              >
                {pair.similarityScore}
              </Badge>
              <FailedGateBadges gates={pair.failedGates} />
            </Stack>
          );
        },
      }),
      // The decision and its provenance in one column: what you can do about
      // the pair first, then where it came from, which only matters once you
      // are unsure.
      columnHelper.display({
        id: "actions",
        header: "",
        cell: (props) => {
          const pair = props.row.original;
          return (
            <Stack gap="sm" align="flex-start">
              <Group gap="xs" wrap="nowrap">
                <Button
                  size="xs"
                  variant="light"
                  onClick={() => setComparePair(pair)}
                >
                  Compare
                </Button>
                <Button
                  size="xs"
                  variant="subtle"
                  color="gray"
                  onClick={() =>
                    pair.dismissedAt ? handleReopen(pair) : handleDismiss(pair)
                  }
                >
                  {pair.dismissedAt ? "Reopen" : "Dismiss"}
                </Button>
              </Group>

              <Stack gap={2}>
                <Badge variant="outline" color="gray" size="sm">
                  {DETECTED_BY_LABELS[pair.detectedBy]} · on {pair.matchedOn}
                </Badge>
                <Text size="xs" c="dimmed">
                  {new Date(pair.createdAt).toLocaleDateString()}
                </Text>
              </Stack>
            </Stack>
          );
        },
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [columnHelper, page, status, categoryId, minScore, maxScore]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  const categoryOptions = categories.map((category) => ({
    value: category.id,
    label: category.name,
  }));

  return (
    <Stack gap="md">
      <Card withBorder p="md">
        <Group gap="md" align="flex-end">
          <Select
            label="Status"
            data={STATUS_OPTIONS}
            value={status}
            onChange={(value) => {
              setStatus((value as ProductDuplicatePairStatus) ?? "open");
              setPage(1);
            }}
            allowDeselect={false}
            w={160}
          />
          <Select
            label="Category"
            placeholder="All categories"
            data={categoryOptions}
            value={categoryId}
            onChange={(value) => {
              setCategoryId(value);
              setPage(1);
            }}
            searchable
            clearable
            disabled={categoriesLoading}
            w={260}
          />
          <NumberInput
            label="Min score"
            placeholder="1"
            value={minScoreInput}
            onChange={(value) => {
              setMinScoreInput(value === "" ? "" : Number(value));
              setPage(1);
            }}
            min={1}
            max={100}
            clampBehavior="strict"
            allowDecimal={false}
            w={110}
          />
          <NumberInput
            label="Max score"
            placeholder="100"
            value={maxScoreInput}
            onChange={(value) => {
              setMaxScoreInput(value === "" ? "" : Number(value));
              setPage(1);
            }}
            min={1}
            max={100}
            clampBehavior="strict"
            allowDecimal={false}
            w={110}
          />
        </Group>
      </Card>

      {loading && (
        <Center py="xl">
          <Loader />
        </Center>
      )}

      {!loading && data.length === 0 && (
        <Text c="dimmed" ta="center" py="xl">
          No duplicate pairs found.
        </Text>
      )}

      {data.length > 0 && (
        <>
          <ListPagination
            page={page}
            pageSize={pageSize}
            totalPages={searchResult?.totalPages || 1}
            totalItems={searchResult?.totalItems ?? null}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPage(1);
              setPageSize(size);
            }}
          />

          <Table>
            <Table.Thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <Table.Tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <Table.Th key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </Table.Th>
                  ))}
                </Table.Tr>
              ))}
            </Table.Thead>
            <Table.Tbody>
              {table.getRowModel().rows.map((row) => (
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
              ))}
            </Table.Tbody>
          </Table>

          <ListPagination
            placement="bottom"
            page={page}
            pageSize={pageSize}
            totalPages={searchResult?.totalPages || 1}
            totalItems={searchResult?.totalItems ?? null}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPage(1);
              setPageSize(size);
            }}
          />
        </>
      )}

      <DuplicatePairCompareModal
        pair={comparePair}
        onClose={() => setComparePair(null)}
        onComplete={doSearch}
      />

      <ProductDetailsModal
        productId={detailsProductId}
        opened={!!detailsProductId}
        onClose={() => setDetailsProductId(null)}
      />
    </Stack>
  );
}
