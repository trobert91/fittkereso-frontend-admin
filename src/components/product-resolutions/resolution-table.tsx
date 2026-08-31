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
  ProductResolutionRecord,
  ProductResolutionDecision,
  ProductResolutionFlow,
  ProductResolutionOrigin,
  deleteResolution,
} from "@/api-actions/product/product-resolutions";
import { useResolutionSearch } from "@/hooks/useResolutionSearch";
import { ProductCategory } from "@/models/product-category";
import { postCategorySearch } from "@/api-actions/category/category-search";
import { ProductSpecsBadges } from "@/components/product/product-specs-badges";
import {
  DuplicatePairConfirmModal,
  DuplicatePairConfirmAction,
} from "./duplicate-pair-confirm-modal";
import { ResolutionDetailModal } from "./resolution-detail-modal";
import Link from "next/link";
import { routes } from "@/utils/routes";
import { LuExternalLink } from "react-icons/lu";
import { IoCheckmark, IoClose, IoEye, IoTrash } from "react-icons/io5";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";

export interface ProductResolutionTableRef {
  refresh: () => void;
}

const FLOW_OPTIONS: { value: ProductResolutionFlow; label: string }[] = [
  { value: "product_resolution", label: "Product resolution" },
  { value: "duplicate_detection", label: "Duplicate detection" },
];

const FLOW_LABELS: Record<ProductResolutionFlow, string> = {
  product_resolution: "Resolution",
  duplicate_detection: "Duplicate",
};

const DECISION_OPTIONS: { value: ProductResolutionDecision; label: string }[] = [
  { value: "pending_review", label: "Pending review" },
  { value: "auto_accepted", label: "Auto accepted" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const DECISION_COLORS: Record<ProductResolutionDecision, string> = {
  pending_review: "orange",
  auto_accepted: "green",
  approved: "blue",
  rejected: "red",
};

const ORIGIN_OPTIONS: { value: ProductResolutionOrigin; label: string }[] = [
  { value: "scrape_time", label: "Scrape-time (ambiguous match)" },
  { value: "nightly_detection", label: "Nightly detection" },
];

const ORIGIN_LABELS: Record<ProductResolutionOrigin, string> = {
  scrape_time: "Scrape-time",
  nightly_detection: "Nightly detection",
};

export const ProductResolutionTable = forwardRef<ProductResolutionTableRef>(
  function ProductResolutionTable(_props, ref) {
  const [data, setData] = useState<ProductResolutionRecord[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [flowFilter, setFlowFilter] = useState<string | null>(null);
  const [decisionFilter, setDecisionFilter] = useState<string | null>(
    "pending_review",
  );
  const [originFilter, setOriginFilter] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] =
    useState<DuplicatePairConfirmAction | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const { searchResolutions, loading, searchResult } = useResolutionSearch();

  const doSearch = () => {
    searchResolutions({
      page,
      pageSize,
      categoryId: categoryFilter || undefined,
      flow: (flowFilter as ProductResolutionFlow) || undefined,
      decision: (decisionFilter as ProductResolutionDecision) || undefined,
      origin: (originFilter as ProductResolutionOrigin) || undefined,
    });
  };

  useImperativeHandle(ref, () => ({ refresh: doSearch }));

  const columnHelper = useMemo(
    () => createColumnHelper<ProductResolutionRecord>(),
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
  }, [page, pageSize, categoryFilter, flowFilter, decisionFilter, originFilter]);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "flow",
        header: "Type",
        cell: (props) => {
          const row = props.row.original;
          return (
            <Badge
              color={row.flow === "duplicate_detection" ? "grape" : "cyan"}
              variant="light"
              size="sm"
            >
              {FLOW_LABELS[row.flow]}
            </Badge>
          );
        },
      }),
      columnHelper.display({
        id: "left",
        header: "Product A / Input",
        cell: (props) => {
          const row = props.row.original;
          if (row.flow === "duplicate_detection") {
            const product = row.productA;
            if (!product) return null;
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
          }

          const input =
            row.inputSnapshot?.kind === "product_resolution"
              ? row.inputSnapshot.input
              : undefined;
          return (
            <Stack gap={2}>
              <Text size="sm" fw={500}>
                {input?.brand} {input?.model ?? input?.displayName ?? "—"}
              </Text>
              {input?.category?.name && (
                <Text size="xs" c="dimmed">
                  {input.category.name}
                </Text>
              )}
            </Stack>
          );
        },
      }),
      columnHelper.display({
        id: "right",
        header: "Product B / Resolved",
        cell: (props) => {
          const row = props.row.original;
          if (row.flow === "duplicate_detection") {
            const product = row.productB;
            if (!product) return null;
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
          }

          if (!row.resolvedProduct) {
            return (
              <Badge color="gray" variant="outline" size="sm">
                Unresolved
              </Badge>
            );
          }
          const product = row.resolvedProduct;
          return (
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
              <Group gap={4}>
                <Badge
                  color={DECISION_COLORS[row.decision]}
                  variant="light"
                  size="sm"
                >
                  {row.decision.replace(/_/g, " ")}
                </Badge>
                {row.origin && (
                  <Badge
                    color={row.origin === "scrape_time" ? "grape" : "gray"}
                    variant="outline"
                    size="sm"
                  >
                    {ORIGIN_LABELS[row.origin]}
                  </Badge>
                )}
                {row.decisionSnapshot && (
                  <Badge variant="outline" size="sm">
                    {row.decisionSnapshot.kind.replace(/_/g, " ")}
                  </Badge>
                )}
              </Group>
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
      columnHelper.display({
        id: "category",
        header: "Category",
        cell: (props) => {
          const row = props.row.original;
          const categoryName =
            row.productA?.productCategory?.name ??
            row.resolvedProduct?.productCategory?.name ??
            (row.inputSnapshot?.kind === "product_resolution"
              ? row.inputSnapshot.category?.name
              : undefined);
          return <Text size="sm">{categoryName}</Text>;
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: (props) => {
          const row = props.row.original;

          const handleDelete = () => {
            modals.openConfirmModal({
              title: "Delete resolution record",
              children: (
                <Text size="sm">
                  Delete this record? The products themselves will not be affected.
                </Text>
              ),
              labels: { confirm: "Delete", cancel: "Cancel" },
              confirmProps: { color: "red" },
              onConfirm: async () => {
                try {
                  await deleteResolution(row.id);
                  doSearch();
                } catch (err: any) {
                  notifications.show({
                    color: "red",
                    title: "Delete failed",
                    message: err?.message || "Failed to delete record",
                  });
                }
              },
            });
          };

          const canApprove = row.decision === "pending_review";
          const canReject =
            row.decision === "pending_review" ||
            row.decision === "auto_accepted";

          return (
            <Group gap="xs" wrap="nowrap">
              {row.flow === "duplicate_detection" ? (
                <>
                  {canApprove && (
                    <Tooltip label="Approve & merge">
                      <ActionIcon
                        color="green"
                        variant="light"
                        size="sm"
                        onClick={() =>
                          setConfirmAction({ id: row.id, type: "approve" })
                        }
                      >
                        <IoCheckmark size={14} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                  {canReject && (
                    <Tooltip label="Reject">
                      <ActionIcon
                        color="red"
                        variant="light"
                        size="sm"
                        onClick={() =>
                          setConfirmAction({ id: row.id, type: "reject" })
                        }
                      >
                        <IoClose size={14} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                </>
              ) : (
                <Tooltip label="View details">
                  <ActionIcon
                    color="blue"
                    variant="light"
                    size="sm"
                    onClick={() => setDetailId(row.id)}
                  >
                    <IoEye size={14} />
                  </ActionIcon>
                </Tooltip>
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
            label="Type"
            placeholder="Both flows"
            data={FLOW_OPTIONS}
            value={flowFilter}
            onChange={(value) => {
              setFlowFilter(value);
              setPage(1);
            }}
            clearable
            w={200}
          />
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
          <Select
            label="Origin"
            placeholder="All origins"
            data={ORIGIN_OPTIONS}
            value={originFilter}
            onChange={(value) => {
              setOriginFilter(value);
              setPage(1);
            }}
            clearable
            w={220}
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
          No resolution records found.
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
      <ResolutionDetailModal
        resolutionId={detailId}
        onClose={() => setDetailId(null)}
        onComplete={doSearch}
      />
    </Stack>
  );
});
