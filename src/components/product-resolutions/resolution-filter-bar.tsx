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
  { value: "relevance", label: "Review order" },
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
          data={STATUS_OPTIONS}
          value={params.statuses ?? []}
          onChange={(value) =>
            onChange({
              statuses: value.length
                ? (value as ProductResolutionStatus[])
                : undefined,
            })
          }
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
          value={params.sortBy ?? "relevance"}
          onChange={(value) =>
            onChange({ sortBy: (value as ProductResolutionSortField) ?? "relevance" })
          }
          w={170}
        />

        <SegmentedControl
          data={[
            { value: "DESC", label: "Desc" },
            { value: "ASC", label: "Asc" },
          ]}
          value={params.sortDir ?? "DESC"}
          onChange={(value) => onChange({ sortDir: value as "ASC" | "DESC" })}
          size="xs"
          // Review order is a fixed multi-key ordering (pending first, then
          // closest calls) — a direction toggle would not apply to it.
          disabled={!params.sortBy || params.sortBy === "relevance"}
        />
      </Group>
    </Card>
  );
}
