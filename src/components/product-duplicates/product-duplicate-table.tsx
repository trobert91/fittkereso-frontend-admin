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
  Loader,
  Select,
  Stack,
  Table,
  Text,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { postCategorySearch } from "@/api-actions/category/category-search";
import {
  postDismissProductDuplicate,
  postReopenProductDuplicate,
} from "@/api-actions/product-duplicate/product-duplicate-actions";
import { ProductSpecsBadges } from "@/components/product/product-specs-badges";
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

const MIN_SCORE_OPTIONS = [
  { value: "70", label: "70+" },
  { value: "80", label: "80+" },
  { value: "90", label: "90+" },
];

const DETECTED_BY_LABELS: Record<ProductDuplicateDetectedBy, string> = {
  scrape: "Scrape",
  scan: "Scan",
  merge: "Merge",
};

function ProductCell({
  product,
  onOpenDetails,
}: {
  product: ProductModel;
  onOpenDetails: (productId: string) => void;
}) {
  return (
    <Stack gap={2}>
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
    </Stack>
  );
}

import { useListRegistration } from "@/components/list/list-context";
import { ListPagination } from "@/components/list/list-pagination";

export function ProductDuplicateTable() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [status, setStatus] = useState<ProductDuplicatePairStatus>("open");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [minScore, setMinScore] = useState<string | null>(null);
  const [comparePair, setComparePair] = useState<ProductDuplicatePair | null>(
    null,
  );
  const [detailsProductId, setDetailsProductId] = useState<string | null>(
    null,
  );
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
      minScore: minScore ? Number(minScore) : undefined,
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
  }, [page, pageSize, status, categoryId, minScore]);

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
    [],
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
      columnHelper.accessor("similarityScore", {
        header: "Score",
        cell: (props) => {
          const score = props.getValue();
          return (
            <Badge
              color={score >= 80 ? "green" : "yellow"}
              variant="light"
              size="lg"
            >
              {score}
            </Badge>
          );
        },
      }),
      columnHelper.accessor("failedGates", {
        header: "Contradictions",
        cell: (props) => <FailedGateBadges gates={props.getValue()} />,
      }),
      columnHelper.display({
        id: "found",
        header: "Found",
        cell: (props) => {
          const pair = props.row.original;
          return (
            <Stack gap={2}>
              <Badge variant="outline" color="gray" size="sm">
                {DETECTED_BY_LABELS[pair.detectedBy]}
              </Badge>
              <Text size="xs" c="dimmed">
                on {pair.matchedOn}
              </Text>
              <Text size="xs" c="dimmed">
                {new Date(pair.createdAt).toLocaleDateString()}
              </Text>
            </Stack>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: (props) => {
          const pair = props.row.original;
          return (
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
          );
        },
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [columnHelper, page, status, categoryId, minScore],
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
          <Select
            label="Minimum score"
            placeholder="Any"
            data={MIN_SCORE_OPTIONS}
            value={minScore}
            onChange={(value) => {
              setMinScore(value);
              setPage(1);
            }}
            clearable
            w={160}
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
                            header.getContext(),
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
                        cell.getContext(),
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
