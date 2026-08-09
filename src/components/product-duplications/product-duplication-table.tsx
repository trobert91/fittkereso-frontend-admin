"use client";
"use no memo";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  Loader,
  Center,
  Pagination,
  Text,
  Badge,
  Group,
  Stack,
  Select,
  Card,
  ActionIcon,
  Anchor,
  Tooltip,
} from "@mantine/core";
import {
  ProductDuplicateRecord,
  ProductDuplicateDecision,
  deleteProductDuplicatePair,
} from "@/api-actions/product/product-duplicates";
import { useDuplicateSearch } from "@/hooks/useDuplicateSearch";
import { ProductCategory } from "@/models/product-category";
import { postCategorySearch } from "@/api-actions/category/category-search";
import { ProductSpecsBadges } from "@/components/product/product-specs-badges";
import {
  DuplicatePairConfirmModal,
  DuplicatePairConfirmAction,
} from "./duplicate-pair-confirm-modal";
import Link from "next/link";
import { routes } from "@/utils/routes";
import { LuExternalLink } from "react-icons/lu";
import { IoCheckmark, IoClose, IoTrash } from "react-icons/io5";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";

export interface ProductDuplicationTableRef {
  refresh: () => void;
}

const DECISION_OPTIONS: { value: ProductDuplicateDecision; label: string }[] = [
  { value: "pending_review", label: "Pending review" },
  { value: "auto_merged", label: "Auto merged" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const DECISION_COLORS: Record<ProductDuplicateDecision, string> = {
  pending_review: "orange",
  auto_merged: "green",
  approved: "blue",
  rejected: "red",
};

export const ProductDuplicationTable = forwardRef<ProductDuplicationTableRef>(
  function ProductDuplicationTable(_props, ref) {
  const [data, setData] = useState<ProductDuplicateRecord[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [decisionFilter, setDecisionFilter] = useState<string | null>(
    "pending_review",
  );
  const [confirmAction, setConfirmAction] =
    useState<DuplicatePairConfirmAction | null>(null);

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const { searchDuplicates, loading, searchResult } = useDuplicateSearch();

  const doSearch = () => {
    searchDuplicates({
      page,
      pageSize,
      categoryId: categoryFilter || undefined,
      decision: (decisionFilter as ProductDuplicateDecision) || undefined,
    });
  };

  useImperativeHandle(ref, () => ({ refresh: doSearch }));

  const columnHelper = useMemo(
    () => createColumnHelper<ProductDuplicateRecord>(),
    [],
  );

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const result = await postCategorySearch({ page: 1, pageSize: 100 });
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
  }, [searchResult]);

  useEffect(() => {
    doSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, categoryFilter, decisionFilter]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("productA", {
        header: "Product A",
        cell: (props) => {
          const product = props.getValue();
          return (
            <Stack gap={2}>
              <Group gap="xs">
                <Anchor
                  component={Link}
                  href={routes.products.details(product.id)}
                  size="sm"
                  fw={500}
                >
                  {product.displayName}
                </Anchor>
                <ActionIcon
                  component={Link}
                  href={routes.products.details(product.id)}
                  variant="subtle"
                  size="xs"
                >
                  <LuExternalLink size={12} />
                </ActionIcon>
              </Group>
              <Text size="xs" c="dimmed">
                {product.brand?.name}
              </Text>
              <ProductSpecsBadges specs={product.orderedSpecs} />
            </Stack>
          );
        },
      }),
      columnHelper.accessor("productB", {
        header: "Product B",
        cell: (props) => {
          const product = props.getValue();
          return (
            <Stack gap={2}>
              <Group gap="xs">
                <Anchor
                  component={Link}
                  href={routes.products.details(product.id)}
                  size="sm"
                  fw={500}
                >
                  {product.displayName}
                </Anchor>
                <ActionIcon
                  component={Link}
                  href={routes.products.details(product.id)}
                  variant="subtle"
                  size="xs"
                >
                  <LuExternalLink size={12} />
                </ActionIcon>
              </Group>
              <Text size="xs" c="dimmed">
                {product.brand?.name}
              </Text>
              <ProductSpecsBadges specs={product.orderedSpecs} />
            </Stack>
          );
        },
      }),
      columnHelper.accessor("similarityScore", {
        header: "Similarity",
        cell: (props) => {
          const score = props.getValue();
          const color =
            score >= 80 ? "red" : score >= 60 ? "orange" : "yellow";
          return (
            <Badge color={color} variant="light" size="lg">
              {score}%
            </Badge>
          );
        },
      }),
      columnHelper.display({
        id: "decision",
        header: "Decision",
        cell: (props) => {
          const row = props.row.original;
          return (
            <Stack gap={4}>
              <Badge
                color={DECISION_COLORS[row.decision]}
                variant="light"
                size="sm"
              >
                {row.decision.replace("_", " ")}
              </Badge>
              {row.pendingReasons && row.pendingReasons.length > 0 && (
                <Stack gap={2}>
                  {row.pendingReasons.map((reason, i) => (
                    <Text key={i} size="xs" c="dimmed">
                      {reason}
                    </Text>
                  ))}
                </Stack>
              )}
            </Stack>
          );
        },
      }),
      columnHelper.accessor("productA", {
        id: "category",
        header: "Category",
        cell: (props) => (
          <Text size="sm">
            {props.getValue().productCategory?.name}
          </Text>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: (props) => {
          const row = props.row.original;

          const handleDelete = () => {
            modals.openConfirmModal({
              title: "Delete duplicate record",
              children: (
                <Text size="sm">
                  Delete this duplicate pair record? The products themselves will not be affected.
                </Text>
              ),
              labels: { confirm: "Delete", cancel: "Cancel" },
              confirmProps: { color: "red" },
              onConfirm: async () => {
                try {
                  await deleteProductDuplicatePair(row.id);
                  doSearch();
                } catch (err: any) {
                  notifications.show({
                    color: "red",
                    title: "Delete failed",
                    message: err?.message || "Failed to delete duplicate pair",
                  });
                }
              },
            });
          };

          return (
            <Group gap="xs" wrap="nowrap">
              {row.decision === "pending_review" && (
                <>
                  <Tooltip label="Approve & merge">
                    <ActionIcon
                      color="green"
                      variant="light"
                      size="sm"
                      onClick={() =>
                        setConfirmAction({
                          id: row.id,
                          type: "approve",
                        })
                      }
                    >
                      <IoCheckmark size={14} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Reject">
                    <ActionIcon
                      color="red"
                      variant="light"
                      size="sm"
                      onClick={() =>
                        setConfirmAction({
                          id: row.id,
                          type: "reject",
                        })
                      }
                    >
                      <IoClose size={14} />
                    </ActionIcon>
                  </Tooltip>
                </>
              )}
              <Tooltip label="Delete record">
                <ActionIcon
                  color="gray"
                  variant="subtle"
                  size="sm"
                  onClick={handleDelete}
                >
                  <IoTrash size={14} />
                </ActionIcon>
              </Tooltip>
            </Group>
          );
        },
      }),
    ],
    [columnHelper],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  });

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  return (
    <Stack gap="md">
      <Card withBorder p="md">
        <Group gap="md" align="flex-end">
          <Select
            label="Category"
            placeholder="All categories"
            data={categoryOptions}
            value={categoryFilter}
            onChange={(value) => {
              setCategoryFilter(value);
              setPage(1);
            }}
            searchable
            clearable
            disabled={categoriesLoading}
            w={300}
          />
          <Select
            label="Decision"
            placeholder="All decisions"
            data={DECISION_OPTIONS}
            value={decisionFilter}
            onChange={(value) => {
              setDecisionFilter(value);
              setPage(1);
            }}
            clearable
            w={200}
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
          <Table striped highlightOnHover withTableBorder>
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

          <Center>
            <Pagination
              total={totalPages}
              value={page}
              onChange={setPage}
            />
          </Center>
        </>
      )}
      <DuplicatePairConfirmModal
        action={confirmAction}
        onClose={() => setConfirmAction(null)}
        onComplete={doSearch}
      />
    </Stack>
  );
});
