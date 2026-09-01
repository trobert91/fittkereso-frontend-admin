"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  Divider,
  Group,
  MultiSelect,
  NumberInput,
  SegmentedControl,
  Select,
  Text,
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
  ResolutionAiConfidence,
  ResolutionDecidedBy,
  ResolutionReviewTrigger,
} from "@/api-actions/product/product-resolutions";
import { postCategorySearch } from "@/api-actions/category/category-search";
import { postProductSourceSearch } from "@/api-actions/product-source/product-source-search";
import { ProductCategory } from "@/models/product-category";
import { ProductSource } from "@/models/dtos/product-source-search-models";
import {
  AI_CONFIDENCE_OPTIONS,
  DECIDED_BY_OPTIONS,
  FLOW_OPTIONS,
  ORIGIN_OPTIONS,
  STATUS_OPTIONS,
  TRIGGER_MODE_OPTIONS,
  TRIGGER_OPTIONS,
  TriggerFilterMode,
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

const AI_REVIEWED_OPTIONS = [
  { value: "any", label: "Any" },
  { value: "true", label: "Reviewed" },
  { value: "false", label: "Not yet" },
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

  // `untriggered` is a tri-state on the wire (undefined / true / false) but reads
  // as a three-way choice in the UI, so the control owns the mapping rather than
  // making the reviewer think in terms of a boolean that is sometimes absent.
  const triggerMode: TriggerFilterMode =
    params.untriggered === undefined
      ? "any"
      : params.untriggered
        ? "untriggered"
        : "triggered";

  const handleTriggerModeChange = (mode: TriggerFilterMode) => {
    if (mode === "any") {
      onChange({ untriggered: undefined });
      return;
    }
    // Asking for rows where nothing fired while also naming a trigger is a
    // contradiction — drop the names rather than issue a query that cannot match.
    onChange({
      untriggered: mode === "untriggered",
      triggers: mode === "untriggered" ? undefined : params.triggers,
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

      <Divider
        my="md"
        label="Review classification"
        labelPosition="left"
        variant="dashed"
      />

      <Group gap="md" align="flex-end" wrap="wrap">
        <Box>
          <Text size="sm" fw={500} mb={4}>
            Triggers
          </Text>
          <SegmentedControl
            data={TRIGGER_MODE_OPTIONS}
            value={triggerMode}
            onChange={(value) =>
              handleTriggerModeChange(value as TriggerFilterMode)
            }
            size="xs"
          />
        </Box>

        <MultiSelect
          label="Which trigger"
          // Any-of, because the triggers are independent suspicions rather than
          // facets — their intersection is usually empty.
          placeholder={
            triggerMode === "untriggered" ? "n/a — nothing fired" : "Any trigger"
          }
          data={TRIGGER_OPTIONS}
          value={params.triggers ?? []}
          onChange={(value) =>
            onChange({
              triggers: value.length
                ? (value as ResolutionReviewTrigger[])
                : undefined,
            })
          }
          // Naming a trigger while asking for rows where none fired is a
          // contradiction that would always return nothing. Disable rather than
          // let the reviewer build an empty query and wonder why.
          disabled={triggerMode === "untriggered"}
          clearable
          w={280}
        />

        <MultiSelect
          label="AI confidence"
          placeholder="Any"
          data={AI_CONFIDENCE_OPTIONS}
          value={params.aiConfidence ?? []}
          onChange={(value) =>
            onChange({
              aiConfidence: value.length
                ? (value as ResolutionAiConfidence[])
                : undefined,
            })
          }
          clearable
          w={240}
        />

        <Select
          label="AI reviewed"
          data={AI_REVIEWED_OPTIONS}
          value={
            params.aiReviewed === undefined ? "any" : String(params.aiReviewed)
          }
          onChange={(value) =>
            onChange({
              aiReviewed: value === "any" ? undefined : value === "true",
            })
          }
          w={170}
        />

        <MultiSelect
          label="Decided by"
          description="Pair with status: Done"
          placeholder="Anyone"
          data={DECIDED_BY_OPTIONS}
          value={params.decidedBy ?? []}
          onChange={(value) =>
            onChange({
              decidedBy: value.length
                ? (value as ResolutionDecidedBy[])
                : undefined,
            })
          }
          clearable
          w={240}
        />
      </Group>
    </Card>
  );
}
