import { Alert, Badge, Box, Card, Group, Stack, Text } from "@mantine/core";
import { IoMdAlert } from "react-icons/io";
import {
  IssueStatus,
  ValidationIssue,
  ValidationIssueSource,
} from "@/models/validation-issue";

export type IssueSeverity = "critical" | "major" | "minor";

export const SEVERITY_COLOR: Record<IssueSeverity, string> = {
  critical: "red",
  major: "orange",
  minor: "yellow",
};

/** Bucket by stamped magnitude so the color tracks the backend descriptor
 *  table without a separate mirrored map. */
export function magnitudeSeverity(magnitude: number): IssueSeverity {
  if (magnitude >= 30) return "critical";
  if (magnitude >= 15) return "major";
  return "minor";
}

export function issuesWorstSeverity(
  issues: ValidationIssue[],
): IssueSeverity | undefined {
  if (issues.length === 0) return undefined;
  const order: IssueSeverity[] = ["critical", "major", "minor"];
  for (const severity of order) {
    if (
      issues.some((issue) => magnitudeSeverity(issue.magnitude) === severity)
    ) {
      return severity;
    }
  }
  return "minor";
}

const STATUS_COLOR: Record<IssueStatus, string> = {
  resolved: "green",
  pending: "blue",
  unresolved: "orange",
  unresolvable: "red",
};

const SOURCE_COLOR: Record<ValidationIssueSource, string> = {
  llm: "violet",
  deterministic: "gray",
};

function formatIssueValue(value: unknown): string {
  if (value == null) return "—";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") {
    const trimmed = value.length > 80 ? value.slice(0, 77) + "..." : value;
    return trimmed;
  }
  return String(value);
}

/** Variant-specific badges that don't fit the common `current → suggested`
 *  diff: drop-quote ids, op codes, duplicate-model cluster summaries. */
function variantBadges(issue: ValidationIssue): React.ReactNode {
  switch (issue.type) {
    case "quote_duplicate":
      return (
        <Badge
          color="gray"
          variant="light"
          size="xs"
          tt="none"
          radius="sm"
          ff="monospace"
        >
          dropped: {issue.droppedQuoteId}
        </Badge>
      );
    case "quote_not_verbatim":
      return (
        <Badge color="gray" variant="outline" size="xs" tt="none" radius="sm">
          op: {issue.op}
        </Badge>
      );
    case "duplicate_model":
      return (
        <>
          <Badge color="grape" variant="light" size="xs" tt="none" radius="sm">
            {issue.refIds.length} refs
          </Badge>
          <Badge color="grape" variant="light" size="xs" tt="none" radius="sm">
            {issue.sharedModelIds.length} shared model
            {issue.sharedModelIds.length === 1 ? "" : "s"}
          </Badge>
        </>
      );
    default:
      return null;
  }
}

export const IssueRow = ({
  issue,
  belongsToLabel,
  belongsToColor,
}: {
  issue: ValidationIssue;
  /** Optional "belongs to" badge — shown in the aggregated comment-level
   *  modal where issues come from multiple sources (refs + comment). */
  belongsToLabel?: string;
  belongsToColor?: string;
}) => {
  const severity = magnitudeSeverity(issue.magnitude);
  const quoteId = (issue as { quoteId?: string }).quoteId;
  const currentValue = (issue as { currentValue?: unknown }).currentValue;
  const suggestedValue = (issue as { suggestedValue?: unknown }).suggestedValue;

  return (
    <Card
      withBorder
      padding="xs"
      radius="sm"
      style={{
        borderLeft: `3px solid var(--mantine-color-${SEVERITY_COLOR[severity]}-7)`,
      }}
    >
      <Stack gap={6}>
        <Group gap="xs" wrap="wrap">
          <Badge
            color={SEVERITY_COLOR[severity]}
            variant="light"
            size="sm"
            tt="none"
            radius="sm"
          >
            {issue.type.replace(/_/g, " ")}
          </Badge>
          <Badge
            color={SEVERITY_COLOR[severity]}
            variant="filled"
            size="xs"
            tt="none"
            radius="sm"
          >
            magnitude {issue.magnitude}
          </Badge>
          <Badge
            color={STATUS_COLOR[issue.status]}
            variant="light"
            size="xs"
            tt="none"
            radius="sm"
          >
            {issue.status}
          </Badge>
          <Badge
            color={SOURCE_COLOR[issue.source]}
            variant="outline"
            size="xs"
            tt="none"
            radius="sm"
          >
            {issue.source}
          </Badge>
          {belongsToLabel && (
            <Badge
              color={belongsToColor ?? "gray"}
              variant="light"
              size="xs"
              tt="none"
              radius="sm"
            >
              {belongsToLabel}
            </Badge>
          )}
          {quoteId && (
            <Badge
              color="gray"
              variant="light"
              size="xs"
              tt="none"
              radius="sm"
              ff="monospace"
            >
              {quoteId}
            </Badge>
          )}
          {variantBadges(issue)}
        </Group>
        {issue.reasoning && (
          <Text size="sm" style={{ wordBreak: "break-word" }}>
            {issue.reasoning}
          </Text>
        )}
        {(currentValue !== undefined || suggestedValue !== undefined) && (
          <Group gap="xs" wrap="wrap" align="center">
            {currentValue !== undefined && (
              <Box>
                <Text size="xs" c="dimmed" tt="uppercase" mb={2}>
                  current
                </Text>
                <Badge
                  color="red"
                  variant="light"
                  size="sm"
                  tt="none"
                  radius="sm"
                  ff="monospace"
                >
                  {formatIssueValue(currentValue)}
                </Badge>
              </Box>
            )}
            {currentValue !== undefined && suggestedValue !== undefined && (
              <Text size="lg" c="dimmed">
                →
              </Text>
            )}
            {suggestedValue !== undefined && (
              <Box>
                <Text size="xs" c="dimmed" tt="uppercase" mb={2}>
                  suggested
                </Text>
                <Badge
                  color="green"
                  variant="light"
                  size="sm"
                  tt="none"
                  radius="sm"
                  ff="monospace"
                >
                  {formatIssueValue(suggestedValue)}
                </Badge>
              </Box>
            )}
          </Group>
        )}
        {issue.resolutionFailedReason && (
          <Alert
            variant="light"
            color="red"
            icon={<IoMdAlert />}
            title="resolution failed"
            p="xs"
          >
            <Text size="xs">{issue.resolutionFailedReason}</Text>
          </Alert>
        )}
      </Stack>
    </Card>
  );
};
