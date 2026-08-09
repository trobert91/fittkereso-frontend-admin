"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  Divider,
  Group,
  List,
  Modal,
  Paper,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { LuWorkflow } from "react-icons/lu";

type StatusKey =
  | "NEW"
  | "LOW_ESTIMATION"
  | "LLM_NO_CATEGORY"
  | "LLM_LOW_RELEVANCE"
  | "SELECTED"
  | "PROCESSING"
  | "PROCESSED"
  | "REPROCESSING";

const STATUS_COLOR: Record<StatusKey, string> = {
  NEW: "blue",
  LOW_ESTIMATION: "gray",
  LLM_NO_CATEGORY: "gray",
  LLM_LOW_RELEVANCE: "orange",
  SELECTED: "cyan",
  PROCESSING: "yellow",
  PROCESSED: "green",
  REPROCESSING: "violet",
};

const STATES: { status: StatusKey; meaning: string }[] = [
  {
    status: "NEW",
    meaning:
      "Ingested by the search executor, passed the cheap term-scorer gate. Has relevanceEstimation, no categories. Awaiting LLM selection.",
  },
  {
    status: "LOW_ESTIMATION",
    meaning:
      "Rejected by the cheap scorer at ingestion — top category score was below minRelevanceForIngestion, so the LLM was never invoked. Tombstone; not picked up by any scheduler.",
  },
  {
    status: "LLM_NO_CATEGORY",
    meaning:
      "LLM ran but no category cleared the threshold. relevance is set, but no category was attached. Tombstone; not picked up by any scheduler.",
  },
  {
    status: "LLM_LOW_RELEVANCE",
    meaning:
      "LLM picked categories but the thread failed an extraction quality gate. Either (a) one of the hard-gate criteria — experienceDensity, productSpecificity, or buyerResearchValue — came back 'low', or (b) the composite relevance was below minWeightedScore. In-domain but low quality. Not extracted.",
  },
  {
    status: "SELECTED",
    meaning:
      "LLM picked categories with sufficient relevance. Has categories + relevance. Awaiting extraction.",
  },
  {
    status: "PROCESSING",
    meaning:
      "Worker has it. Currently running the subtree extraction pipeline.",
  },
  {
    status: "PROCESSED",
    meaning: "Extraction complete. Terminal (until reprocessing).",
  },
  {
    status: "REPROCESSING",
    meaning:
      "Marked for a fresh extraction with existing categories preserved. Re-enters the extraction queue without re-running selection.",
  },
];

const REPROCESSING_TRIGGERS: { trigger: string; kind: string; effect: string }[] =
  [
    {
      trigger: "POST :id/mark-for-reprocess",
      kind: "admin",
      effect: "Flip only. No enqueue — scheduler drains.",
    },
    {
      trigger: "POST :id/run-pipeline (rerunRelevanceCalculation=false)",
      kind: "admin",
      effect: "Flip PROCESSED → REPROCESSING, then enqueue.",
    },
    {
      trigger: "deferred-resolution.service",
      kind: "auto",
      effect: "When comments are reset, flips affected PROCESSED → REPROCESSING.",
    },
    {
      trigger: "comment-reprocess.service",
      kind: "auto",
      effect: "When a comment is reset for retry, flips owning thread → REPROCESSING.",
    },
  ];

const AUTOMATED_ACTIONS: { actor: string; when: string; effect: string }[] = [
  {
    actor: "Search executor",
    when: "cron — runs Reddit searches",
    effect:
      "Persists each result. Score ≥ threshold → NEW; score < threshold → LOW_ESTIMATION. Sets relevanceEstimation.",
  },
  {
    actor: "ProcessThreadScheduler Phase A",
    when: "every 5 min",
    effect:
      "Drains NEW threads. Calls ThreadSelectionService.select() — one LLM call assigns categories + criteria. Applies the hard gate (experienceDensity, productSpecificity, buyerResearchValue must all be ≥ medium) and the composite minWeightedScore check. Writes SELECTED / LLM_LOW_RELEVANCE / LLM_NO_CATEGORY.",
  },
  {
    actor: "ProcessThreadScheduler Phase B",
    when: "every 5 min",
    effect:
      "Drains SELECTED + REPROCESSING threads. Enqueues extraction tasks. Sets PROCESSING.",
  },
  {
    actor: "ThreadProcessingListener",
    when: "queue consumer",
    effect:
      "Runs the 8-phase subtree pipeline. On finish: PROCESSING → PROCESSED.",
  },
  {
    actor: "Reprocessing scheduler",
    when: "cron — age-based",
    effect:
      "Re-enqueues old PROCESSED threads directly (does not flip to REPROCESSING).",
  },
  {
    actor: "deferred-resolution.service",
    when: "when comments are reset",
    effect: "Flips affected PROCESSED threads → REPROCESSING.",
  },
  {
    actor: "comment-reprocess.service",
    when: "when comments need re-processing",
    effect: "Flips affected threads → REPROCESSING.",
  },
];

const ADMIN_ENDPOINTS: { endpoint: string; effect: string }[] = [
  {
    endpoint: "POST estimate",
    effect:
      "Stage 1 dry-run. Fetches submission, runs term scorer, returns score + top categories. No DB write.",
  },
  {
    endpoint: "POST create",
    effect:
      "Stage 1 + Stage 2 in one call. Persists row with relevanceEstimation, then runs select(). Final status: LOW_ESTIMATION (if Stage 1 rejected) or one of SELECTED / LLM_LOW_RELEVANCE / LLM_NO_CATEGORY (from the LLM).",
  },
  {
    endpoint: "POST :id/select",
    effect:
      "Stage 2 only. Re-runs LLM selection on an existing thread. Override path for any tombstone (LOW_ESTIMATION / LLM_NO_CATEGORY / LLM_LOW_RELEVANCE). Does not enqueue.",
  },
  {
    endpoint: "POST :id/run-pipeline (rerunRelevanceCalculation=true)",
    effect: "Runs select(); if outcome is selected, also enqueues extraction.",
  },
  {
    endpoint: "POST :id/run-pipeline (rerunRelevanceCalculation=false)",
    effect:
      "Skips select(). Enqueues SELECTED / REPROCESSING directly. For PROCESSED, flips status → REPROCESSING first, then enqueues. Rejects category-less statuses (NEW / LOW_ESTIMATION / LLM_NO_CATEGORY / LLM_LOW_RELEVANCE).",
  },
  {
    endpoint: "POST :id/mark-for-reprocess",
    effect:
      "Flips PROCESSED → REPROCESSING. No enqueue — the scheduler or a subsequent run-pipeline call drains it.",
  },
  {
    endpoint: "POST :id/reset",
    effect: "Wipes processing data, keeps the row.",
  },
  {
    endpoint: "DELETE :id",
    effect: "Removes the thread entirely.",
  },
];

const StateBadge = ({ status }: { status: StatusKey }) => (
  <Badge color={STATUS_COLOR[status]} variant="light" tt="none" size="md">
    {status}
  </Badge>
);

const FlowNode = ({
  status,
  caption,
  override,
}: {
  status: StatusKey;
  caption?: string;
  override?: string;
}) => (
  <Stack gap={4} align="center">
    <Paper
      withBorder
      p="xs"
      radius="md"
      style={{ minWidth: 150, textAlign: "center" }}
    >
      <StateBadge status={status} />
    </Paper>
    {caption && (
      <Text size="xs" c="dimmed" ta="center" maw={170}>
        {caption}
      </Text>
    )}
    {override && (
      <Text size="xs" c="blue" ta="center" maw={170}>
        admin override →{" "}
        <Text component="span" size="xs" c="blue" ff="monospace">
          {override}
        </Text>
      </Text>
    )}
  </Stack>
);

const Arrow = ({
  direction = "down",
  label,
}: {
  direction?: "down" | "up" | "right" | "left";
  label?: string;
}) => {
  const symbol =
    direction === "down"
      ? "▼"
      : direction === "up"
        ? "▲"
        : direction === "right"
          ? "▶"
          : "◀";
  return (
    <Stack gap={2} align="center">
      <Text size="lg" c="dimmed" lh={1}>
        {symbol}
      </Text>
      {label && (
        <Text size="xs" c="dimmed" ta="center" maw={240}>
          {label}
        </Text>
      )}
    </Stack>
  );
};

const FlowDiagram = () => {
  return (
    <Paper withBorder p="md" radius="md">
      <Stack gap="sm" align="center">
        <Text size="xs" c="dimmed" ta="center">
          Search executor — cheap term scorer
        </Text>

        <Group gap="xl" align="flex-start" wrap="nowrap" justify="center">
          <FlowNode
            status="LOW_ESTIMATION"
            caption="score < minRelevanceForIngestion (LLM never runs)"
            override="POST :id/select"
          />
          <FlowNode
            status="NEW"
            caption="score ≥ minRelevanceForIngestion"
          />
        </Group>

        <Arrow label="Phase A — ThreadSelectionService.select()" />

        <Group gap="xl" align="flex-start" wrap="nowrap" justify="center">
          <FlowNode
            status="LLM_NO_CATEGORY"
            caption="no category cleared threshold"
            override="POST :id/select"
          />
          <FlowNode
            status="LLM_LOW_RELEVANCE"
            caption="hard-gate criterion 'low', or composite relevance < minWeightedScore"
            override="POST :id/select"
          />
          <FlowNode
            status="SELECTED"
            caption="categories + relevance OK"
          />
        </Group>

        <Arrow label="Phase B — enqueue extraction" />
        <FlowNode status="PROCESSING" />
        <Arrow label="8-phase subtree pipeline" />
        <FlowNode status="PROCESSED" />

        <Divider
          w="100%"
          my="xs"
          label="Reprocessing loop"
          labelPosition="center"
        />

        <Group gap="md" align="center" wrap="nowrap" justify="center">
          <FlowNode status="PROCESSED" />
          <Arrow
            direction="right"
            label="mark-for-reprocess / deferred-resolution / comment-reprocess / run-pipeline?false"
          />
          <FlowNode status="REPROCESSING" />
          <Arrow direction="right" label="Phase B drains (bypasses Phase A)" />
          <FlowNode status="PROCESSING" />
        </Group>
      </Stack>
    </Paper>
  );
};

const ReprocessingTriggers = () => (
  <Table withTableBorder withColumnBorders striped>
    <Table.Thead>
      <Table.Tr>
        <Table.Th style={{ width: 320 }}>Trigger</Table.Th>
        <Table.Th style={{ width: 80 }}>Kind</Table.Th>
        <Table.Th>Effect</Table.Th>
      </Table.Tr>
    </Table.Thead>
    <Table.Tbody>
      {REPROCESSING_TRIGGERS.map((row) => (
        <Table.Tr key={row.trigger}>
          <Table.Td>
            <Text size="sm" ff="monospace">
              {row.trigger}
            </Text>
          </Table.Td>
          <Table.Td>
            <Badge
              size="sm"
              variant="light"
              color={row.kind === "admin" ? "blue" : "teal"}
            >
              {row.kind}
            </Badge>
          </Table.Td>
          <Table.Td>
            <Text size="sm">{row.effect}</Text>
          </Table.Td>
        </Table.Tr>
      ))}
    </Table.Tbody>
  </Table>
);

export const ThreadFlowInfoAction = () => {
  const [opened, setOpened] = useState(false);

  return (
    <>
      <Button
        leftSection={<LuWorkflow size={16} />}
        variant="default"
        onClick={() => setOpened(true)}
      >
        Flow
      </Button>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Thread processing flow"
        centered
        size="xl"
      >
        <Stack gap="lg">
          <Text size="sm" c="dimmed">
            How a Reddit thread moves from search results to extracted
            ProductReferences. Three stages: cheap-scoring ingestion, LLM
            category selection (with a hard gate on three criteria plus a
            composite-score gate), then subtree extraction. Reprocessing
            preserves the LLM-assigned categories.
          </Text>

          <Section title="States">
            <Table withTableBorder withColumnBorders striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: 180 }}>Status</Table.Th>
                  <Table.Th>Meaning</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {STATES.map((row) => (
                  <Table.Tr key={row.status}>
                    <Table.Td>
                      <StateBadge status={row.status} />
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{row.meaning}</Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Section>

          <Section title="State transitions">
            <FlowDiagram />
          </Section>

          <Section title="Reprocessing triggers">
            <ReprocessingTriggers />
          </Section>

          <Section title="Automated actions">
            <Table withTableBorder withColumnBorders striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: 220 }}>Actor</Table.Th>
                  <Table.Th style={{ width: 160 }}>When</Table.Th>
                  <Table.Th>Effect</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {AUTOMATED_ACTIONS.map((row) => (
                  <Table.Tr key={row.actor}>
                    <Table.Td>
                      <Text size="sm" fw={500}>
                        {row.actor}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{row.when}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{row.effect}</Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Section>

          <Section title="Admin endpoints">
            <Table withTableBorder withColumnBorders striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: 320 }}>Endpoint</Table.Th>
                  <Table.Th>Effect</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {ADMIN_ENDPOINTS.map((row) => (
                  <Table.Tr key={row.endpoint}>
                    <Table.Td>
                      <Text size="sm" ff="monospace">
                        {row.endpoint}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{row.effect}</Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Section>

          <Section title="Key invariants">
            <List size="sm" spacing="xs">
              <List.Item>
                A thread reaches Stage 3 only if it has at least one
                extraction-enabled category attached. The cheap scorer never
                assigns categories — only the LLM does.
              </List.Item>
              <List.Item>
                <StateBadge status="LOW_ESTIMATION" />,{" "}
                <StateBadge status="LLM_NO_CATEGORY" />, and{" "}
                <StateBadge status="LLM_LOW_RELEVANCE" /> are tombstones — no
                scheduler picks them up. They exist for dedup (so the search
                executor doesn&apos;t re-fetch the same thread) and audit.
                Admin can force re-evaluation via{" "}
                <Text component="span" ff="monospace" size="sm">
                  POST :id/select
                </Text>{" "}
                or{" "}
                <Text component="span" ff="monospace" size="sm">
                  POST :id/run-pipeline?rerunRelevanceCalculation=true
                </Text>
                .
              </List.Item>
              <List.Item>
                <StateBadge status="REPROCESSING" /> preserves the existing
                LLM-assigned categories. Running selection again would risk
                overwriting them, so REPROCESSING threads bypass Phase A
                entirely and only Phase B drains them.
              </List.Item>
              <List.Item>
                Stage 2 has a <b>hard gate</b> on three LLM criteria:{" "}
                <Text component="span" ff="monospace" size="sm">
                  experienceDensity
                </Text>
                ,{" "}
                <Text component="span" ff="monospace" size="sm">
                  productSpecificity
                </Text>
                , and{" "}
                <Text component="span" ff="monospace" size="sm">
                  buyerResearchValue
                </Text>{" "}
                must all be at least <b>medium</b>. Any one of them coming
                back <b>low</b> forces <StateBadge status="LLM_LOW_RELEVANCE" />{" "}
                regardless of the composite score — these three together
                determine whether a thread can produce usable
                ProductReferences (someone has used the product, a specific
                product is identifiable, and the discussion is about
                buying/owning rather than adjacent topics).
              </List.Item>
              <List.Item>
                <Text component="span" ff="monospace" size="sm">
                  relevanceEstimation
                </Text>{" "}
                (cheap scorer, 0–100) is set once at ingestion and never
                refreshed.{" "}
                <Text component="span" ff="monospace" size="sm">
                  relevance
                </Text>{" "}
                (LLM composite, 1–100) is written by Stage 2.
              </List.Item>
            </List>
          </Section>
        </Stack>
      </Modal>
    </>
  );
};

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <Stack gap="xs">
    <Title order={5}>{title}</Title>
    {children}
  </Stack>
);
