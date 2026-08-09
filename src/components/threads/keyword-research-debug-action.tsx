"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Accordion,
  Alert,
  Badge,
  Button,
  Divider,
  Group,
  Loader,
  Modal,
  MultiSelect,
  Paper,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { MdOutlineKey } from "react-icons/md";
import { IoAlertCircleOutline } from "react-icons/io5";
import {
  KeywordResearchDebugCategoryResult,
  KeywordResearchDebugError,
  KeywordResearchDebugPlan,
  KeywordResearchDebugResult,
  postKeywordResearchDebug,
} from "@/api-actions/keyword-research/debug";
import { postCategorySearch } from "@/api-actions/category/category-search";
import { ProductCategory } from "@/models/product-category";

interface CategoryOption {
  value: string;
  label: string;
}

interface DebugFormValues {
  categorySlugs: string[];
  overrideTotal: string;
}

interface DebugError {
  title: string;
  message: string;
  detail?: string;
}

function parseOverrideTotal(input: string): number | undefined {
  const trimmed = input.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return Math.floor(parsed);
}

function toCategoryOption(category: ProductCategory): CategoryOption | null {
  if (!category.slug) return null;
  return { value: category.slug, label: `${category.name} (${category.slug})` };
}

export const KeywordResearchDebugAction = () => {
  const [opened, setOpened] = useState(false);
  const [result, setResult] = useState<KeywordResearchDebugResult | undefined>();
  const [error, setErrorState] = useState<DebugError | undefined>();
  const [loading, setLoading] = useState(false);

  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | undefined>();

  const { control, register, handleSubmit, reset } = useForm<DebugFormValues>({
    defaultValues: { categorySlugs: [], overrideTotal: "" },
  });

  useEffect(() => {
    if (!opened) return;

    let cancelled = false;
    setCategoriesLoading(true);
    setCategoriesError(undefined);

    postCategorySearch({
      enabled: true,
      searchEnabled: true,
      pageSize: 200,
      sort: "name",
      order: "ASC",
    })
      .then((response) => {
        if (cancelled) return;
        const options = (response.items ?? [])
          .map(toCategoryOption)
          .filter((option): option is CategoryOption => option !== null);
        setCategoryOptions(options);
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setCategoriesError(
          caught instanceof Error
            ? caught.message
            : "Failed to load categories.",
        );
      })
      .finally(() => {
        if (!cancelled) setCategoriesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [opened]);

  const onSubmit = async (values: DebugFormValues) => {
    setLoading(true);
    setResult(undefined);
    setErrorState(undefined);
    try {
      const request: Parameters<typeof postKeywordResearchDebug>[0] = {};
      if (values.categorySlugs.length > 0) {
        request.categorySlugs = values.categorySlugs;
      }
      const override = parseOverrideTotal(values.overrideTotal);
      if (override !== undefined) request.overrideTotal = override;

      const debugResult = await postKeywordResearchDebug(request);
      setResult(debugResult);
    } catch (caught) {
      setErrorState(toDebugError(caught));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpened(false);
    setResult(undefined);
    setErrorState(undefined);
    setLoading(false);
    reset();
  };

  return (
    <>
      <Button
        leftSection={<MdOutlineKey size={16} />}
        variant="default"
        onClick={() => setOpened(true)}
      >
        Debug keyword generation
      </Button>

      <Modal
        opened={opened}
        onClose={handleClose}
        title="Debug keyword generation"
        centered
        size="80%"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              Dry-run of the weekly scheduler&apos;s planning phase. Calls the
              same allocator and LLM planner the cron uses, but does NOT
              execute Reddit searches and does NOT mark keywords as searched.
              Costs real LLM calls per category.
            </Text>

            <Group gap="sm" grow align="flex-start">
              <Controller
                name="categorySlugs"
                control={control}
                render={({ field }) => (
                  <MultiSelect
                    label="Categories"
                    description={
                      categoriesError
                        ? `Failed to load: ${categoriesError}`
                        : "Leave empty to run all enabled + searchEnabled categories."
                    }
                    placeholder={
                      categoriesLoading
                        ? "Loading categories..."
                        : "All enabled categories"
                    }
                    data={categoryOptions}
                    value={field.value}
                    onChange={field.onChange}
                    disabled={loading || categoriesLoading}
                    error={categoriesError}
                    searchable
                    clearable
                    nothingFoundMessage="No matching categories"
                  />
                )}
              />
              <TextInput
                label="Override total keywords (optional)"
                description="Total budget across categories. Leave empty to use dynamic-config default."
                placeholder="e.g. 20"
                type="number"
                {...register("overrideTotal")}
                disabled={loading}
              />
            </Group>

            <Button
              type="submit"
              loading={loading}
              disabled={categoriesLoading}
            >
              Run generation
            </Button>

            {loading && (
              <Group justify="center" py="md">
                <Loader size="sm" />
                <Text size="sm" c="dimmed">
                  Allocating budget and calling planner per category — this can
                  take 10–60 seconds.
                </Text>
              </Group>
            )}

            {error && !loading && (
              <Alert
                color="red"
                title={error.title}
                icon={<IoAlertCircleOutline size={18} />}
              >
                <Stack gap={6}>
                  <Text size="sm">{error.message}</Text>
                  {error.detail && (
                    <Text
                      size="xs"
                      c="dimmed"
                      ff="monospace"
                      style={{ whiteSpace: "pre-wrap" }}
                    >
                      {error.detail}
                    </Text>
                  )}
                </Stack>
              </Alert>
            )}

            {result && !loading && <DebugResultView result={result} />}
          </Stack>
        </form>
      </Modal>
    </>
  );
};

function toDebugError(caught: unknown): DebugError {
  if (caught instanceof KeywordResearchDebugError) {
    let detail: string | undefined;
    if (caught.responseBody !== undefined) {
      try {
        detail = JSON.stringify(caught.responseBody, null, 2);
      } catch {
        detail = String(caught.responseBody);
      }
    }
    const title =
      caught.kind === "malformed"
        ? "Response malformed"
        : caught.kind === "network"
          ? "Request failed (network)"
          : `Request failed (HTTP ${caught.status})`;
    return { title, message: caught.message, detail };
  }
  if (caught instanceof Error) {
    return { title: "Request failed", message: caught.message };
  }
  return { title: "Request failed", message: "Unknown error." };
}

const DebugResultView = ({
  result,
}: {
  result: KeywordResearchDebugResult;
}) => {
  const sortedCategories = [...result.categories].sort(
    (a, b) => b.allocation.score - a.allocation.score,
  );

  return (
    <>
      <Divider />
      <Stack gap="md">
        <Paper
          withBorder
          p="md"
          radius="md"
          bg="var(--mantine-color-default-hover)"
        >
          <Stack gap={6}>
            <Text size="xs" tt="uppercase" c="dimmed" fw={600}>
              Run summary
            </Text>
            <Group gap="xs">
              <Badge variant="default">
                Budget: {result.totalKeywordsBudget} keywords
              </Badge>
              <Badge variant="default">
                Categories eligible: {result.categoriesEligible}
              </Badge>
              <Badge color={result.categoriesFailed > 0 ? "red" : "green"}>
                Processed: {result.categoriesProcessed} / Failed:{" "}
                {result.categoriesFailed}
              </Badge>
              <Badge variant="default">
                Total planner cost: ${result.totalPlannerCost.toFixed(4)}
              </Badge>
              <Badge variant="default">
                Duration: {(result.durationMs / 1000).toFixed(1)}s
              </Badge>
            </Group>
          </Stack>
        </Paper>

        {sortedCategories.length === 0 ? (
          <Text size="sm" c="dimmed">
            No eligible categories. Check that categories have
            <code> searchEnabled=true </code>
            and a <code>search.json</code> config.
          </Text>
        ) : (
          <Accordion
            multiple
            defaultValue={sortedCategories
              .filter((c) => c.error !== null || c.skipped)
              .map((c) => c.categorySlug)}
            variant="separated"
          >
            {sortedCategories.map((category) => (
              <Accordion.Item
                key={category.categorySlug}
                value={category.categorySlug}
              >
                <Accordion.Control>
                  <CategoryHeader category={category} />
                </Accordion.Control>
                <Accordion.Panel>
                  <CategoryBody category={category} />
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        )}
      </Stack>
    </>
  );
};

const CategoryHeader = ({
  category,
}: {
  category: KeywordResearchDebugCategoryResult;
}) => {
  return (
    <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
      <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
        <Title order={6}>{category.categoryName}</Title>
        <Text size="xs" c="dimmed">
          {category.categorySlug}
        </Text>
      </Stack>
      <Group gap="xs" wrap="nowrap">
        {category.error && (
          <Badge color="red" variant="filled">
            Error
          </Badge>
        )}
        {category.skipped && (
          <Badge color="gray" variant="filled">
            Skipped
          </Badge>
        )}
        {category.plan && (
          <>
            <Tooltip label="Keywords sliced after cooldown filter / allocated budget">
              <Badge color="cyan" variant="light">
                {category.plan.sliced.length} / {category.plan.allocatedCount}{" "}
                kept
              </Badge>
            </Tooltip>
            <Badge variant="default">
              ${category.plan.plannerCost.toFixed(4)}
            </Badge>
          </>
        )}
        <Badge variant="default">
          {(category.durationMs / 1000).toFixed(1)}s
        </Badge>
      </Group>
    </Group>
  );
};

const CategoryBody = ({
  category,
}: {
  category: KeywordResearchDebugCategoryResult;
}) => {
  if (category.error) {
    return (
      <Alert
        color="red"
        title="Planner failed"
        icon={<IoAlertCircleOutline size={18} />}
      >
        <Text size="sm" ff="monospace" style={{ whiteSpace: "pre-wrap" }}>
          {category.error}
        </Text>
      </Alert>
    );
  }

  if (category.skipped || !category.plan) {
    return (
      <Alert color="gray" title="Skipped">
        <Text size="sm">
          {category.skippedReason ?? "No plan was produced."}
        </Text>
      </Alert>
    );
  }

  return (
    <Stack gap="md">
      <AllocationPanel category={category} />
      <KeywordsPanel plan={category.plan} />
      <PlannerInputsPanel plan={category.plan} />
    </Stack>
  );
};

const AllocationPanel = ({
  category,
}: {
  category: KeywordResearchDebugCategoryResult;
}) => (
  <Paper withBorder p="sm" radius="md">
    <Stack gap={6}>
      <Text size="xs" tt="uppercase" c="dimmed" fw={600}>
        Allocation
      </Text>
      <Group gap="xs">
        <Tooltip label="Configured searchPriority on the category (0–10).">
          <Badge variant="default">
            Priority: {category.allocation.searchPriority}
          </Badge>
        </Tooltip>
        <Tooltip label="Threads currently in status SELECTED for this category.">
          <Badge variant="default">
            Backlog: {category.allocation.backlog}
          </Badge>
        </Tooltip>
        <Tooltip label="normalizedPriority + deficitScore (each 0–1).">
          <Badge color="cyan" variant="light">
            Score: {category.allocation.score.toFixed(2)}
          </Badge>
        </Tooltip>
        <Tooltip label="Final allocated keyword count after redistribution.">
          <Badge color="blue">
            Allocated: {category.allocation.keywordCount}
          </Badge>
        </Tooltip>
      </Group>
    </Stack>
  </Paper>
);

const KeywordsPanel = ({ plan }: { plan: KeywordResearchDebugPlan }) => {
  const droppedSet = new Set(plan.droppedByCooldown.map((k) => k.toLowerCase()));
  const slicedSet = new Set(plan.sliced.map((k) => k.toLowerCase()));

  return (
    <Paper withBorder p="sm" radius="md">
      <Stack gap="xs">
        <Group justify="space-between" align="center">
          <Stack gap={0}>
            <Text size="xs" tt="uppercase" c="dimmed" fw={600}>
              Planner output ({plan.plannedKeywords.length} keywords)
            </Text>
            <Text size="xs" c="dimmed">
              Model: {plan.plannerModel} · {plan.plannerLatencyMs}ms · asked
              for {plan.requestCount} (over-fetched from {plan.allocatedCount})
            </Text>
          </Stack>
          <Group gap="xs">
            <Badge color="green">Kept: {plan.sliced.length}</Badge>
            <Badge color="orange">
              Dropped (cooldown): {plan.droppedByCooldown.length}
            </Badge>
            <Badge color="gray">
              Trimmed (over budget):{" "}
              {plan.survivors.length - plan.sliced.length}
            </Badge>
          </Group>
        </Group>

        <Table withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ width: 60 }}>#</Table.Th>
              <Table.Th>Keyword</Table.Th>
              <Table.Th style={{ width: 120 }}>Status</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {plan.plannedKeywords.map((keyword, index) => {
              const lower = keyword.toLowerCase();
              const dropped = droppedSet.has(lower);
              const kept = slicedSet.has(lower);
              const status = dropped ? "dropped" : kept ? "kept" : "trimmed";
              const color =
                status === "kept"
                  ? "green"
                  : status === "dropped"
                    ? "orange"
                    : "gray";
              return (
                <Table.Tr key={`${index}-${keyword}`}>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {index + 1}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" ff="monospace">
                      {keyword}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={color} variant="light" tt="none">
                      {status}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Stack>
    </Paper>
  );
};

const PlannerInputsPanel = ({ plan }: { plan: KeywordResearchDebugPlan }) => (
  <Paper withBorder p="sm" radius="md">
    <Stack gap="md">
      <Text size="xs" tt="uppercase" c="dimmed" fw={600}>
        Planner inputs
      </Text>

      <Stack gap={4}>
        <Text size="sm" fw={500}>
          Base keywords ({plan.baseKeywords.length})
        </Text>
        {plan.baseKeywords.length === 0 ? (
          <Text size="xs" c="dimmed">
            None.
          </Text>
        ) : (
          <Group gap={6}>
            {plan.baseKeywords.map((keyword) => (
              <Badge key={keyword} variant="default" tt="none">
                {keyword}
              </Badge>
            ))}
          </Group>
        )}
      </Stack>

      <Stack gap={4}>
        <Text size="sm" fw={500}>
          Top products ({plan.topProducts.length})
        </Text>
        {plan.topProducts.length === 0 ? (
          <Text size="xs" c="dimmed">
            None sampled.
          </Text>
        ) : (
          <Group gap={6}>
            {plan.topProducts.map((product) => (
              <Badge key={product} variant="default" tt="none">
                {product}
              </Badge>
            ))}
          </Group>
        )}
      </Stack>

      <Stack gap={4}>
        <Text size="sm" fw={500}>
          Previously searched keywords ({plan.searchedKeywords.length})
        </Text>
        {plan.searchedKeywords.length === 0 ? (
          <Text size="xs" c="dimmed">
            No history in the lookback window.
          </Text>
        ) : (
          <Table withTableBorder withColumnBorders striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Keyword</Table.Th>
                <Table.Th style={{ width: 100 }}>Weeks ago</Table.Th>
                <Table.Th style={{ width: 110 }}>Discovered</Table.Th>
                <Table.Th style={{ width: 110 }}>Processed</Table.Th>
                <Table.Th style={{ width: 110 }}>Rejected</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {plan.searchedKeywords.map((row) => (
                <Table.Tr key={row.keyword}>
                  <Table.Td>
                    <Text size="sm" ff="monospace">
                      {row.keyword}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">
                      {row.weeksSinceLastSearch === null
                        ? "—"
                        : row.weeksSinceLastSearch.toFixed(1)}
                    </Text>
                  </Table.Td>
                  <Table.Td>{row.threadsDiscovered}</Table.Td>
                  <Table.Td>{row.threadsProcessed}</Table.Td>
                  <Table.Td>{row.threadsRejected}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Stack>

      <Stack gap={4}>
        <Text size="sm" fw={500}>
          Active cooldown ({plan.cooldown.length})
        </Text>
        {plan.cooldown.length === 0 ? (
          <Text size="xs" c="dimmed">
            No keywords currently on cooldown.
          </Text>
        ) : (
          <Group gap={6}>
            {plan.cooldown.map((entry) => (
              <Tooltip
                key={entry.keyword}
                label={`Searched ${entry.weeksSinceLastSearch.toFixed(1)} weeks ago`}
              >
                <Badge variant="light" color="orange" tt="none">
                  {entry.keyword}
                </Badge>
              </Tooltip>
            ))}
          </Group>
        )}
      </Stack>
    </Stack>
  </Paper>
);

