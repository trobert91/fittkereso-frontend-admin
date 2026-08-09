"use client";

import { RelevanceCriteriaRatings, RelevanceRating, RelevanceResult, RelevanceScoreBreakdown, Thread } from "@/models/thread";
import { ThreadSource, ThreadStatus } from "@/models/enums/thread-enums";
import {
  ActionIcon,
  Anchor,
  Badge,
  Divider,
  Group,
  Progress,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { format } from "date-fns";
import Link from "next/link";
import { routes } from "@/utils/routes";
import { LuExternalLink } from "react-icons/lu";
import { CommentMediaList } from "@/components/comment/comment-media-list";

const getStatusColor = (status: ThreadStatus): string => {
  switch (status) {
    case ThreadStatus.NEW:
      return "blue";
    case ThreadStatus.SELECTED:
      return "cyan";
    case ThreadStatus.PROCESSING:
      return "yellow";
    case ThreadStatus.PROCESSED:
      return "green";
    case ThreadStatus.REPROCESSING:
      return "violet";
    case ThreadStatus.LOW_ESTIMATION:
      return "gray";
    case ThreadStatus.LLM_NO_CATEGORY:
      return "gray";
    case ThreadStatus.LLM_LOW_RELEVANCE:
      return "orange";
    case ThreadStatus.DELETED:
      return "red";
    default:
      return "gray";
  }
};

const getSourceColor = (source: ThreadSource): string => {
  switch (source) {
    case ThreadSource.Reddit:
      return "red";
    case ThreadSource.Youtube:
      return "grape";
    default:
      return "gray";
  }
};

const getValueColor = (value?: number | null): string => {
  if (value === undefined || value === null) return "gray";
  if (value < 30) return "red";
  if (value < 50) return "orange";
  if (value < 70) return "lime";
  return "green";
};

const getRatingColor = (rating: RelevanceRating): string => {
  switch (rating) {
    case "high":
      return "green";
    case "medium":
      return "yellow";
    case "low":
      return "red";
  }
};

const CRITERIA_LABELS: Record<keyof RelevanceCriteriaRatings, { label: string; weight: number }> = {
  experienceDensity:  { label: "Experience Density",   weight: 35 },
  buyerResearchValue: { label: "Buyer Research Value", weight: 25 },
  featureDiscussion:  { label: "Feature Discussion",   weight: 20 },
  productSpecificity: { label: "Product Specificity",  weight: 20 },
};

const RATING_PROGRESS: Record<RelevanceRating, number> = {
  low: 33,
  medium: 66,
  high: 100,
};

const COMPOSITE_LABELS: { key: keyof RelevanceScoreBreakdown; label: string; weight: number }[] = [
  { key: "llmScore",           label: "LLM Score",     weight: 55 },
  { key: "estimationScore",    label: "Estimation",    weight: 25 },
  { key: "commentCountFactor", label: "Comment Count", weight: 10 },
  { key: "recencyFactor",      label: "Recency",       weight: 10 },
];

function CompositeBreakdown({ breakdown, compositeScore }: {
  breakdown: RelevanceScoreBreakdown;
  compositeScore: number;
}) {
  return (
    <Stack gap={4}>
      {COMPOSITE_LABELS.map(({ key, label, weight }) => {
        const value = breakdown[key];
        return (
          <Stack key={key} gap={2}>
            <Group justify="space-between">
              <Text size="sm">{label}</Text>
              <Group gap="xs">
                <Badge color={getValueColor(value)} size="sm">{value}</Badge>
                <Text size="xs" c="dimmed">{weight}%</Text>
              </Group>
            </Group>
            <Progress value={value} color={getValueColor(value)} size="sm" />
          </Stack>
        );
      })}
      <Group justify="space-between" mt={4}>
        <Text size="sm" fw={600}>Composite</Text>
        <Badge color={getValueColor(compositeScore)} size="md">{compositeScore}</Badge>
      </Group>
    </Stack>
  );
}

function RelevanceBreakdown({ result }: { result: RelevanceResult }) {
  return (
    <Stack gap="xs">
      {(Object.keys(CRITERIA_LABELS) as (keyof RelevanceCriteriaRatings)[]).map((key) => {
        const { label, weight } = CRITERIA_LABELS[key];
        const rating = result.criteria?.[key];
        if (!rating) return null;
        return (
          <Stack key={key} gap={2}>
            <Group justify="space-between">
              <Text size="sm">{label}</Text>
              <Group gap="xs">
                <Badge color={getRatingColor(rating)} size="sm" tt="none">{rating}</Badge>
                <Text size="xs" c="dimmed">{weight}%</Text>
              </Group>
            </Group>
            <Progress
              value={RATING_PROGRESS[rating]}
              color={getRatingColor(rating)}
              size="sm"
            />
          </Stack>
        );
      })}
      {result.breakdown && (
        <>
          <Divider my="xs" label="Composite Score" labelPosition="left" />
          <CompositeBreakdown breakdown={result.breakdown} compositeScore={result.weightedScore} />
        </>
      )}
    </Stack>
  );
}

const formatDateTime = (value?: Date | string | null): string => {
  if (!value) return "-";
  try {
    return format(new Date(value), "yyyy-MM-dd HH:mm:ss");
  } catch {
    return String(value);
  }
};

export const ThreadDetailsTable = ({ thread }: { thread: Thread }) => {
  const rows = [
    { label: "External ID", value: thread.externalId || "-" },
    {
      label: "Source",
      value: thread.source ? (
        <Badge color={getSourceColor(thread.source)}>{thread.source}</Badge>
      ) : (
        "-"
      ),
    },
    { label: "Title", value: thread.title || "-" },
    { label: "Topic", value: thread.topic || "-" },
    {
      label: "Categories",
      value:
        thread.categories && thread.categories.length > 0 ? (
          <Stack gap={6}>
            {[...thread.categories]
              .sort((a, b) => a.rank - b.rank)
              .map((tc) => (
                <Group key={tc.productCategory.id} gap="xs" wrap="nowrap">
                  <Badge
                    color={getValueColor(tc.confidence)}
                    size="sm"
                    tt="none"
                  >
                    {tc.confidence} · {tc.productCategory.name}
                  </Badge>
                  <Link href={routes.categories.details(tc.productCategory.id)}>
                    <ActionIcon
                      variant="transparent"
                      size="xs"
                      aria-label="Go to category"
                    >
                      <LuExternalLink
                        style={{ width: "13px", height: "70%" }}
                      />
                    </ActionIcon>
                  </Link>
                </Group>
              ))}
          </Stack>
        ) : (
          "-"
        ),
    },
    {
      label: "Relevance Est.",
      value:
        thread.relevanceEstimation === undefined || thread.relevanceEstimation === null ? (
          "-"
        ) : (
          <Badge color={getValueColor(thread.relevanceEstimation)}>
            {thread.relevanceEstimation}
          </Badge>
        ),
    },
    {
      label: "Relevance",
      value:
        thread.relevance === undefined || thread.relevance === null ? (
          <Text size="sm" c="dimmed">Not calculated</Text>
        ) : (
          <Badge color={getValueColor(thread.relevance)}>
            {thread.relevance}
          </Badge>
        ),
    },
    ...(thread.relevanceResult
      ? [
          {
            label: "Relevance Breakdown",
            value: <RelevanceBreakdown result={thread.relevanceResult} />,
          },
        ]
      : []),
    {
      label: "Thread Created At",
      value: formatDateTime(thread.threadCreatedAt),
    },
    {
      label: "Last Synced",
      value: formatDateTime(thread.lastSynced),
    },
    {
      label: "Created At",
      value: formatDateTime(thread.createdAt),
    },
    {
      label: "Updated At",
      value: formatDateTime(thread.updatedAt),
    },
    {
      label: "Status",
      value: thread.status ? (
        <Badge color={getStatusColor(thread.status)}>
          {thread.status.split("_").join(" ")}
        </Badge>
      ) : (
        "-"
      ),
    },
    { label: "Author", value: thread.author || "-" },
    {
      label: "URL",
      value: thread.url ? (
        <Anchor href={thread.url} target="_blank" rel="noopener noreferrer">
          {thread.url}
        </Anchor>
      ) : (
        "-"
      ),
    },

    {
      label: "Comment Count",
      value: thread.commentCount ?? "-",
    },
    {
      label: "Text",
      value: thread.text ? (
        <Text size="sm">{thread.text?.substring(0, 400)}</Text>
      ) : (
        "-"
      ),
    },
    {
      label: "OP Summary",
      value: thread.opSummary ? (
        <Text size="sm">{thread.opSummary}</Text>
      ) : (
        "-"
      ),
    },
    ...(thread.media && thread.media.length > 0
      ? [{ label: "Media", value: <CommentMediaList media={thread.media} /> }]
      : []),
  ];

  return (
    <Stack gap="md">
      <Title order={4}>Thread Details</Title>
      <Table striped highlightOnHover verticalSpacing="xs">
        <Table.Tbody>
          {rows.map((row) => (
            <Table.Tr key={row.label}>
              <Table.Td width="30%">
                <Text fw={600}>{row.label}</Text>
              </Table.Td>
              <Table.Td>
                {typeof row.value === "string" ? (
                  <Text size="sm">{row.value}</Text>
                ) : (
                  row.value
                )}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Stack>
  );
};
