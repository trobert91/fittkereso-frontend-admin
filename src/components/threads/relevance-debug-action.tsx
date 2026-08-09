"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Alert,
  Badge,
  Box,
  Button,
  Checkbox,
  Divider,
  Group,
  Loader,
  Modal,
  Paper,
  Progress,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { MdOutlineAnalytics } from "react-icons/md";
import { IoAlertCircleOutline } from "react-icons/io5";
import { LuExternalLink } from "react-icons/lu";
import {
  HardGateCriterion,
  RelevanceCriteriaRatings,
  RelevanceDebugRequestError,
  RelevanceEstimationResult,
  RelevanceRating,
  RelevanceSelectionResult,
  SignalScores,
  ThreadRelevanceDebugResult,
  postThreadRelevanceDebug,
} from "@/api-actions/thread/relevance-debug";

interface RelevanceDebugFormValues {
  url: string;
  llmCalculation: boolean;
}

const REDDIT_ID_REGEX = /\/comments\/([a-z0-9]+)/i;

function extractExternalId(input: string): string | undefined {
  const trimmed = input.trim();
  if (!trimmed) return undefined;

  const match = trimmed.match(REDDIT_ID_REGEX);
  if (match) return match[1];

  if (!trimmed.includes("/") && !trimmed.includes(" ")) {
    return trimmed;
  }

  return undefined;
}

const STATUS_COLOR: Record<string, string> = {
  new: "blue",
  low_estimation: "gray",
  llm_no_category: "gray",
  llm_low_relevance: "orange",
  selected: "cyan",
  processing: "yellow",
  extracted: "green",
  reprocessing: "violet",
};

const RATING_COLOR: Record<RelevanceRating, string> = {
  low: "red",
  medium: "yellow",
  high: "green",
};

interface DebugError {
  title: string;
  message: string;
  detail?: string;
}

export const ThreadRelevanceDebugAction = () => {
  const [opened, setOpened] = useState(false);
  const [result, setResult] = useState<ThreadRelevanceDebugResult | undefined>();
  const [error, setErrorState] = useState<DebugError | undefined>();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
  } = useForm<RelevanceDebugFormValues>({
    defaultValues: { url: "", llmCalculation: false },
  });

  const onSubmit = async (values: RelevanceDebugFormValues) => {
    const externalId = extractExternalId(values.url);
    if (!externalId) {
      setError("url", {
        message: "Enter a Reddit URL or a thread ID",
      });
      return;
    }

    setLoading(true);
    setResult(undefined);
    setErrorState(undefined);
    try {
      const debugResult = await postThreadRelevanceDebug({
        externalId,
        llmCalculation: values.llmCalculation,
      });
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
        leftSection={<MdOutlineAnalytics size={16} />}
        variant="default"
        onClick={() => setOpened(true)}
      >
        Debug relevance
      </Button>

      <Modal
        opened={opened}
        onClose={handleClose}
        title="Debug thread relevance"
        centered
        size="xl"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Reddit URL or thread ID"
              placeholder="https://www.reddit.com/r/.../comments/abc123/..."
              {...register("url", { required: "URL is required" })}
              error={errors.url?.message}
              disabled={loading}
            />

            <Checkbox
              label="Also run Stage 2 (LLM selection)"
              description="Off by default — Stage 2 costs a real LLM call. Stage 1 (cheap term scorer) always runs."
              {...register("llmCalculation")}
              disabled={loading}
            />

            <Button type="submit" loading={loading}>
              Run
            </Button>

            {loading && (
              <Group justify="center" py="md">
                <Loader size="sm" />
                <Text size="sm" c="dimmed">
                  Fetching thread and scoring relevance...
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
  if (caught instanceof RelevanceDebugRequestError) {
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

const StatusBadge = ({
  status,
  size = "lg",
  variant = "filled",
}: {
  status: string;
  size?: string;
  variant?: string;
}) => (
  <Badge
    color={STATUS_COLOR[status] ?? "gray"}
    variant={variant}
    size={size}
    tt="none"
  >
    {status}
  </Badge>
);

const DebugResultView = ({
  result,
}: {
  result: ThreadRelevanceDebugResult;
}) => {
  return (
    <>
      <Divider />
      <Stack gap="md">
        <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
          <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
            <Title order={5}>{result.title}</Title>
            <Text size="sm" c="dimmed">
              {result.topic}
            </Text>
          </Stack>
          <Button
            component="a"
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            variant="default"
            size="xs"
            leftSection={<LuExternalLink size={14} />}
          >
            Open
          </Button>
        </Group>

        <Paper withBorder p="sm" radius="md" bg="var(--mantine-color-default-hover)">
          <Group justify="space-between" align="center">
            <Stack gap={0}>
              <Text size="xs" c="dimmed">
                Production verdict (what would actually persist)
              </Text>
              <Text size="xs" c="dimmed">
                Stage 1 short-circuits Stage 2 in production — Stage 2 only
                runs if Stage 1's composite ≥ minRelevanceForIngestion (Stage
                1 also applies an internal soft junk penalty when both
                productSpecificity and experienceDensity are low). Stage 2
                itself has two gates: the hard gate on three criteria
                (experienceDensity, productSpecificity, buyerResearchValue ≥
                medium) and the composite-score check. Both must pass for
                SELECTED.
              </Text>
            </Stack>
            <StatusBadge status={result.finalWouldPersistAs} />
          </Group>
        </Paper>

        <Group gap="xs">
          <Badge variant="default">External ID: {result.externalId}</Badge>
          <Badge variant="default">Comments: {result.commentCount}</Badge>
        </Group>

        <Stage1View estimation={result.estimation} />

        <Stage2View
          selectionRan={result.selectionRan}
          selection={result.selection}
          selectionError={result.selectionError}
        />
      </Stack>
    </>
  );
};

const ScoreBar = ({
  score,
  threshold,
  thresholdLabel,
  passes,
}: {
  score: number;
  threshold: number;
  thresholdLabel: string;
  passes: boolean;
}) => {
  const color = passes ? "green" : "red";
  const scoreClamped = Math.max(0, Math.min(100, score));
  const minClamped = Math.max(0, Math.min(100, threshold));
  return (
    <Box pos="relative" pb="lg">
      <Progress value={scoreClamped} color={color} size="xl" radius="sm" />
      <Box
        pos="absolute"
        top={-3}
        style={{
          left: `${minClamped}%`,
          height: 22,
          width: 2,
          background: "var(--mantine-color-dark-9)",
          transform: "translateX(-1px)",
          pointerEvents: "none",
        }}
      />
      <Text
        size="xs"
        c="dimmed"
        fw={500}
        pos="absolute"
        style={{
          top: 22,
          left: `${minClamped}%`,
          transform: "translateX(-50%)",
          whiteSpace: "nowrap",
        }}
      >
        {thresholdLabel}
      </Text>
    </Box>
  );
};

const Stage1View = ({
  estimation,
}: {
  estimation: RelevanceEstimationResult;
}) => {
  const passes = estimation.score >= estimation.minRelevanceForIngestion;
  const color = passes ? "green" : "red";
  const distance = Math.abs(
    estimation.score - estimation.minRelevanceForIngestion,
  );
  return (
    <Paper withBorder p="md" radius="md">
      <Stack gap="xs">
        <Group justify="space-between" align="center">
          <Stack gap={0}>
            <Text size="xs" tt="uppercase" c="dimmed" fw={600}>
              Stage 1 — cheap term scorer
            </Text>
            <Text size="xs" c="dimmed">
              Composite of six signals on title + text + comments. Soft junk
              gate halves the score when experienceDensity is low AND either
              productSpecificity is also low (no named products, no ownership
              talk) or categoryFocus is below 0.4 (diffuse multi-category
              chatter — product names scattered across off-topic categories).
              featureDiscussion subtracts title vocab so commenters parroting
              the prompt don't saturate. Must clear minRelevanceForIngestion
              to invoke the LLM.
            </Text>
          </Stack>
          <StatusBadge status={estimation.wouldPersistAs} />
        </Group>

        <Group gap={6} align="baseline">
          <Text fz={32} fw={700} c={color} lh={1}>
            {estimation.score.toFixed(1)}
          </Text>
          <Text size="sm" c="dimmed">
            / 100
          </Text>
        </Group>

        <ScoreBar
          score={estimation.score}
          threshold={estimation.minRelevanceForIngestion}
          thresholdLabel={`Min: ${estimation.minRelevanceForIngestion}`}
          passes={passes}
        />

        <Text size="sm" c={color}>
          {passes
            ? `Passes Stage 1 — ${distance.toFixed(1)} above minRelevanceForIngestion.`
            : `Below threshold — ${distance.toFixed(1)} below minRelevanceForIngestion. In production the LLM would NOT run.`}
        </Text>

        {estimation.commentFetchFailed && (
          <Badge color="orange" variant="light" size="sm">
            Comment fetch failed (corpus = {estimation.corpusSize})
          </Badge>
        )}

        <Group gap="xs" mt="xs">
          <Badge variant="default">
            Category focus: {(estimation.categoryFocus * 100).toFixed(0)}%
          </Badge>
          <Badge variant="default">Corpus: {estimation.corpusSize}</Badge>
        </Group>

        <Text fw={500} size="sm" mt="xs">
          Signals
        </Text>
        <SignalsView signals={estimation.signals} />

        {estimation.topCategories.length > 0 ? (
          <>
            <Text fw={500} size="sm" mt="xs">
              Top categories
            </Text>
            <Table withTableBorder withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Category</Table.Th>
                  <Table.Th>Relevance</Table.Th>
                  <Table.Th>Subreddit boost</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {estimation.topCategories.map((category) => (
                  <Table.Tr key={category.slug}>
                    <Table.Td>
                      <Text size="sm">{category.name}</Text>
                      <Text size="xs" c="dimmed">
                        {category.slug}
                      </Text>
                    </Table.Td>
                    <Table.Td>{category.relevance.toFixed(1)}</Table.Td>
                    <Table.Td>
                      {category.subredditBoost > 0
                        ? `+${category.subredditBoost.toFixed(1)}`
                        : "—"}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </>
        ) : (
          <Text size="sm" c="dimmed">
            No matching categories.
          </Text>
        )}
      </Stack>
    </Paper>
  );
};

const Stage2View = ({
  selectionRan,
  selection,
  selectionError,
}: {
  selectionRan: boolean;
  selection: RelevanceSelectionResult | null;
  selectionError: string | null;
}) => {
  if (!selectionRan) {
    return (
      <Paper withBorder p="md" radius="md">
        <Stack gap="xs">
          <Text size="xs" tt="uppercase" c="dimmed" fw={600}>
            Stage 2 — LLM selection
          </Text>
          <Text size="sm" c="dimmed">
            Skipped. Tick &quot;Also run Stage 2&quot; above and re-run to
            invoke the LLM.
          </Text>
        </Stack>
      </Paper>
    );
  }

  if (selection === null) {
    return (
      <Paper withBorder p="md" radius="md">
        <Stack gap="xs">
          <Text size="xs" tt="uppercase" c="dimmed" fw={600}>
            Stage 2 — LLM selection
          </Text>
          <Alert
            color="orange"
            title="Stage 2 did not produce a result"
            icon={<IoAlertCircleOutline size={18} />}
          >
            <Text size="sm">
              {selectionError ??
                "The LLM selection pipeline did not return a result."}
            </Text>
          </Alert>
        </Stack>
      </Paper>
    );
  }

  const scorePasses = selection.weightedScore >= selection.minWeightedScore;
  const hardGatePasses = selection.hardGateFailedCriteria.length === 0;
  const passes = scorePasses && hardGatePasses;
  const scoreColor = scorePasses ? "green" : "red";
  const distance = Math.abs(
    selection.weightedScore - selection.minWeightedScore,
  );

  return (
    <Paper withBorder p="md" radius="md">
      <Stack gap="xs">
        <Group justify="space-between" align="center">
          <Stack gap={0}>
            <Text size="xs" tt="uppercase" c="dimmed" fw={600}>
              Stage 2 — LLM selection
            </Text>
            <Text size="xs" c="dimmed">
              Two gates: hard gate on experienceDensity, productSpecificity,
              buyerResearchValue (all must be ≥ medium), then composite score
              vs. minWeightedScore. Both must pass for SELECTED.
            </Text>
          </Stack>
          <StatusBadge status={selection.wouldPersistAs} />
        </Group>

        <HardGatePanel
          failedCriteria={selection.hardGateFailedCriteria}
          criteria={selection.criteria}
        />

        <Text fw={500} size="sm" mt="xs">
          Composite score
        </Text>
        <Group gap={6} align="baseline">
          <Text fz={32} fw={700} c={scoreColor} lh={1}>
            {selection.weightedScore.toFixed(1)}
          </Text>
          <Text size="sm" c="dimmed">
            / 100
          </Text>
        </Group>

        <ScoreBar
          score={selection.weightedScore}
          threshold={selection.minWeightedScore}
          thresholdLabel={`Min: ${selection.minWeightedScore}`}
          passes={scorePasses}
        />

        <Text size="sm" c={scoreColor}>
          {scorePasses
            ? `Passes composite-score gate — ${distance.toFixed(1)} above minWeightedScore.`
            : `Below composite-score gate — ${distance.toFixed(1)} below minWeightedScore.`}
        </Text>

        {!passes && (
          <Text size="xs" c="dimmed" fs="italic">
            {hardGatePasses
              ? "Composite score is the only blocker — hard gate passed."
              : scorePasses
                ? "Composite score is fine, but the hard gate failed."
                : "Both gates failed."}
          </Text>
        )}

        <Text fw={500} size="sm" mt="xs">
          LLM criteria
        </Text>
        <CriteriaGrid
          criteria={selection.criteria}
          failedHardGateCriteria={selection.hardGateFailedCriteria}
        />
        <Text size="xs" c="dimmed">
          <Text component="span" fw={600}>
            *
          </Text>{" "}
          = hard-gate criterion (must be ≥ medium).
        </Text>

        <Text fw={500} size="sm" mt="xs">
          Score breakdown
        </Text>
        <BreakdownTable
          breakdown={selection.breakdown}
          sampledCommentCount={selection.sampledCommentCount}
        />

        {selection.categories.length > 0 ? (
          <>
            <Text fw={500} size="sm" mt="xs">
              Selected categories
            </Text>
            <Table withTableBorder withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Category</Table.Th>
                  <Table.Th>LLM relevance</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {selection.categories.map((category) => (
                  <Table.Tr key={category.slug}>
                    <Table.Td>
                      <Text size="sm">{category.name}</Text>
                      <Text size="xs" c="dimmed">
                        {category.slug}
                      </Text>
                    </Table.Td>
                    <Table.Td>{category.relevance}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </>
        ) : (
          <Text size="sm" c="dimmed">
            LLM did not pick any category above the threshold.
          </Text>
        )}
      </Stack>
    </Paper>
  );
};

const SIGNAL_LABELS: Record<keyof SignalScores, string> = {
  category: "Category",
  experienceDensity: "Experience density",
  productSpecificity: "Product specificity",
  featureDiscussion: "Feature discussion",
  buyerResearchValue: "Buyer research value",
  comparativeContent: "Comparative content",
};

function signalColor(value: number): string {
  if (value >= 70) return "green";
  if (value >= 40) return "yellow";
  return "red";
}

const SignalsView = ({ signals }: { signals: SignalScores }) => (
  <Stack gap={6}>
    {(Object.keys(SIGNAL_LABELS) as Array<keyof SignalScores>).map((key) => {
      const value = signals[key];
      return (
        <Group key={key} gap="sm" wrap="nowrap" align="center">
          <Text size="xs" style={{ minWidth: 170 }}>
            {SIGNAL_LABELS[key]}
          </Text>
          <Progress
            value={value}
            color={signalColor(value)}
            size="md"
            style={{ flex: 1 }}
          />
          <Text size="xs" fw={500} style={{ minWidth: 32 }} ta="right">
            {value.toFixed(0)}
          </Text>
        </Group>
      );
    })}
  </Stack>
);

const CRITERIA_LABELS: Record<keyof RelevanceCriteriaRatings, string> = {
  experienceDensity: "Experience density",
  productSpecificity: "Product specificity",
  featureDiscussion: "Feature discussion",
  buyerResearchValue: "Buyer research value",
  comparativeContent: "Comparative content",
};

const HARD_GATE_CRITERIA: HardGateCriterion[] = [
  "experienceDensity",
  "productSpecificity",
  "buyerResearchValue",
];

const HardGatePanel = ({
  failedCriteria,
  criteria,
}: {
  failedCriteria: HardGateCriterion[];
  criteria: RelevanceCriteriaRatings;
}) => {
  const passes = failedCriteria.length === 0;
  const color = passes ? "green" : "red";
  return (
    <Paper
      withBorder
      p="sm"
      radius="md"
      style={{
        borderColor: passes
          ? "var(--mantine-color-green-4)"
          : "var(--mantine-color-red-4)",
      }}
    >
      <Stack gap={6}>
        <Group justify="space-between" align="center">
          <Text size="xs" tt="uppercase" c="dimmed" fw={600}>
            Hard gate — three criteria must be ≥ medium
          </Text>
          <Badge color={color} variant="filled" tt="none" size="md">
            {passes ? "PASS" : "FAIL"}
          </Badge>
        </Group>
        <Group gap="xs">
          {HARD_GATE_CRITERIA.map((key) => {
            const rating = criteria[key];
            const failed = failedCriteria.includes(key);
            return (
              <Badge
                key={key}
                color={RATING_COLOR[rating]}
                variant={failed ? "filled" : "light"}
                tt="none"
                size="md"
              >
                {CRITERIA_LABELS[key]}: {rating}
                {failed ? " ✗" : ""}
              </Badge>
            );
          })}
        </Group>
        {!passes && (
          <Text size="xs" c="red">
            Forces LLM_LOW_RELEVANCE regardless of composite score.
          </Text>
        )}
      </Stack>
    </Paper>
  );
};

const CriteriaGrid = ({
  criteria,
  failedHardGateCriteria,
}: {
  criteria: RelevanceCriteriaRatings;
  failedHardGateCriteria: HardGateCriterion[];
}) => (
  <Group gap="xs">
    {(Object.keys(CRITERIA_LABELS) as Array<keyof RelevanceCriteriaRatings>).map(
      (key) => {
        const isHardGate = (HARD_GATE_CRITERIA as string[]).includes(key);
        const failed = failedHardGateCriteria.some((c) => c === key);
        return (
          <Badge
            key={key}
            color={RATING_COLOR[criteria[key]]}
            variant={failed ? "filled" : "light"}
            tt="none"
            size="md"
          >
            {CRITERIA_LABELS[key]}
            {isHardGate ? " *" : ""}: {criteria[key]}
          </Badge>
        );
      },
    )}
  </Group>
);

const BreakdownTable = ({
  breakdown,
  sampledCommentCount,
}: {
  breakdown: import("@/api-actions/thread/relevance-debug").RelevanceScoreBreakdown;
  sampledCommentCount: number;
}) => (
  <Table withTableBorder>
    <Table.Tbody>
      <Table.Tr>
        <Table.Td>
          <Text size="xs" c="dimmed">
            LLM score (criteria-weighted, 1–100)
          </Text>
        </Table.Td>
        <Table.Td>
          <Text size="sm">{breakdown.llmScore.toFixed(1)}</Text>
        </Table.Td>
      </Table.Tr>
      <Table.Tr>
        <Table.Td>
          <Text size="xs" c="dimmed">
            Recency factor
          </Text>
        </Table.Td>
        <Table.Td>
          <Text size="sm">{breakdown.recencyFactor.toFixed(1)}</Text>
        </Table.Td>
      </Table.Tr>
      <Table.Tr>
        <Table.Td>
          <Text size="xs" c="dimmed">
            Comment-count factor (100 = no penalty)
          </Text>
        </Table.Td>
        <Table.Td>
          <Text size="sm">{breakdown.commentCountFactor}</Text>
        </Table.Td>
      </Table.Tr>
      <Table.Tr>
        <Table.Td>
          <Text size="xs" c="dimmed">
            Sampled comments for LLM
          </Text>
        </Table.Td>
        <Table.Td>
          <Text size="sm">{sampledCommentCount}</Text>
        </Table.Td>
      </Table.Tr>
    </Table.Tbody>
  </Table>
);
