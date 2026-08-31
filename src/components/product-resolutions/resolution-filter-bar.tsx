"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  Group,
  MultiSelect,
  NumberInput,
  SegmentedControl,
  Select,
  TextInput,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import {
  ALL_RESOLUTION_STATUSES,
  ProductResolutionFlow,
  ProductResolutionOrigin,
  ProductResolutionSearchParams,
  ProductResolutionSortField,
  ProductResolutionStatus,
} from "@/api-actions/product/product-resolutions";
import { postCategorySearch } from "@/api-actions/category/category-search";
import { postProductSourceSearch } from "@/api-actions/product-source/product-source-search";
import { ProductCategory } from "@/models/product-category";
import { ProductSource } from "@/models/dtos/product-source-search-models";
import {
  FLOW_OPTIONS,
  ORIGIN_OPTIONS,
  STATUS_OPTIONS,
} from "./resolution-labels";

const SORT_OPTIONS: { value: ProductResolutionSortField; label: string }[] = [
  { value: "priority", label: "Priority" },
  { value: "similarityScore", label: "Similarity" },
  { value: "decisionConfidence", label: "Confidence" },
  { value: "createdAt", label: "Created" },
  { value: "lastSeenAt", label: "Last seen" },
];

const ACCEPTED_OPTIONS = [
  { value: "any", label: "Any" },
  { value: "true", label: "Accepted" },
  { value: "false", label: "Not accepted" },
];

/** Meta-option that expands to every status on selection, rather than being a
 *  value of its own — so `params.statuses` only ever holds real statuses and
 *  never leaks a sentinel into the request. */
const ALL_STATUSES_VALUE = "__all__";

const STATUS_FILTER_OPTIONS = [
  { value: ALL_STATUSES_VALUE, label: "All statuses" },
  ...STATUS_OPTIONS,
];

export function ResolutionFilterBar({
  params,
  onChange,
}: {
  params: ProductResolutionSearchParams;
  onChange: (patch: ProductResolutionSearchParams) => void;
}) {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [sources, setSources] = useState<ProductSource[]>([]);
  const [query, setQuery] = useState(params.query ?? "");
  const [debouncedQuery] = useDebouncedValue(query, 350);

  useEffect(() => {
    postCategorySearch({ page: 1, pageSize: 100 })
      .then((result) => setCategories(result.items ?? []))
      .catch((err) => console.error("Failed to fetch categories:", err));

    postProductSourceSearch({ page: 1, pageSize: 100 })
      .then((result) => setSources(result.items ?? []))
      .catch((err) => console.error("Failed to fetch product sources:", err));
  }, []);

  useEffect(() => {
    if ((params.query ?? "") !== debouncedQuery) {
      onChange({ query: debouncedQuery || undefined });
    }
    // Reacting to the debounced value only — including `params`/`onChange`
    // would re-fire the moment the search result comes back.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  // "All statuses" is a shortcut, not a value: picking it fills in the four
  // concrete statuses so the chips show exactly what is being requested and
  // individual ones can then be removed. Clearing the field falls back to the
  // backend's default, which is the open statuses — not everything.
  const handleStatusChange = (value: string[]) => {
    if (value.includes(ALL_STATUSES_VALUE)) {
      onChange({ statuses: ALL_RESOLUTION_STATUSES });
      return;
    }

    onChange({
      statuses: value.length ? (value as ProductResolutionStatus[]) : undefined,
    });
  };

  const categoryOptions = useMemo(
    () => categories.map((category) => ({ value: category.id, label: category.name })),
    [categories],
  );

  const sourceOptions = useMemo(
    () => sources.map((source) => ({ value: source.id, label: source.name })),
    [sources],
  );

  return (
    <Card withBorder p="md">
      <Group gap="md" align="flex-end" wrap="wrap">
        <MultiSelect
          label="Status"
          placeholder="Open (pending + failed)"
          data={STATUS_FILTER_OPTIONS}
          value={params.statuses ?? []}
          onChange={handleStatusChange}
          clearable
          w={260}
        />

        <Select
          label="Type"
          placeholder="Both flows"
          data={FLOW_OPTIONS}
          value={params.flow ?? null}
          onChange={(value) =>
            onChange({ flow: (value as ProductResolutionFlow) || undefined })
          }
          clearable
          w={190}
        />

        <Select
          label="Category"
          placeholder="All categories"
          data={categoryOptions}
          value={params.categoryId ?? null}
          onChange={(value) => onChange({ categoryId: value || undefined })}
          searchable
          clearable
          w={220}
        />

        <Select
          label="Source"
          placeholder="All sources"
          data={sourceOptions}
          value={params.sourceId ?? null}
          onChange={(value) => onChange({ sourceId: value || undefined })}
          searchable
          clearable
          w={180}
        />

        <Select
          label="Origin"
          placeholder="All origins"
          data={ORIGIN_OPTIONS}
          value={params.origin ?? null}
          onChange={(value) =>
            onChange({ origin: (value as ProductResolutionOrigin) || undefined })
          }
          clearable
          w={200}
        />

        <Select
          label="Verdict"
          data={ACCEPTED_OPTIONS}
          value={
            params.accepted === undefined ? "any" : String(params.accepted)
          }
          onChange={(value) =>
            onChange({ accepted: value === "any" ? undefined : value === "true" })
          }
          w={150}
        />

        <NumberInput
          label="Min similarity"
          placeholder="0"
          min={0}
          max={100}
          value={params.minSimilarityScore ?? ""}
          onChange={(value) =>
            onChange({
              minSimilarityScore:
                value === "" || value === null ? undefined : Number(value),
            })
          }
          w={130}
        />

        <NumberInput
          label="Min confidence"
          placeholder="0"
          min={0}
          max={100}
          value={params.minConfidence ?? ""}
          onChange={(value) =>
            onChange({
              minConfidence:
                value === "" || value === null ? undefined : Number(value),
            })
          }
          w={130}
        />

        <NumberInput
          label="Min priority"
          description="Work a band"
          placeholder="0"
          min={0}
          max={100}
          value={params.minPriority ?? ""}
          onChange={(value) =>
            onChange({
              minPriority:
                value === "" || value === null ? undefined : Number(value),
            })
          }
          w={130}
        />

        <TextInput
          label="Search"
          placeholder="Product name or anchor key"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          w={240}
        />

        <Select
          label="Sort by"
          data={SORT_OPTIONS}
          value={params.sortBy ?? "priority"}
          onChange={(value) =>
            onChange({ sortBy: (value as ProductResolutionSortField) ?? "priority" })
          }
          w={170}
        />

        {/* Every sort option is a real column now, so the direction toggle
            applies to all of them — including the default. */}
        <SegmentedControl
          data={[
            { value: "DESC", label: "Desc" },
            { value: "ASC", label: "Asc" },
          ]}
          value={params.sortDir ?? "DESC"}
          onChange={(value) => onChange({ sortDir: value as "ASC" | "DESC" })}
          size="xs"
        />
      </Group>
    </Card>
  );
}
