"use client";

import {
  Badge,
  Button,
  Chip,
  Group,
  Modal,
  ScrollArea,
  SegmentedControl,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { useMemo, useState } from "react";
import type {
  IssueStatus,
  ValidationIssue,
  ValidationIssueSource,
} from "@/models/validation-issue";
import { IoMdAlert } from "react-icons/io";
import { IssueRow } from "./issue-row";

export type ValidationIssueWithSource = {
  issue: ValidationIssue;
  sourceLabel?: string;
  sourceColor?: string;
};

type StatusGroup = "resolved" | "unresolved";

const STATUS_GROUP_OPTIONS: StatusGroup[] = ["resolved", "unresolved"];

const STATUS_GROUP_MEMBERS: Record<StatusGroup, IssueStatus[]> = {
  resolved: ["resolved", "pending"],
  unresolved: ["unresolved", "unresolvable"],
};

type SourceFilter = "all" | ValidationIssueSource;
type SortMode = "default" | "magnitude_desc" | "magnitude_asc";

export const ValidationIssuesModal = ({
  issues,
  issuesWithSource,
  issueSeverity,
  openIssueSeverity,
  moderationPriority,
  label,
}: {
  issues?: ValidationIssue[];
  issuesWithSource?: ValidationIssueWithSource[];
  issueSeverity?: number;
  openIssueSeverity?: number;
  moderationPriority?: number;
  label?: string;
}) => {
  const [opened, setOpened] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusGroup[]>([
    "unresolved",
  ]);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("default");

  const rows: ValidationIssueWithSource[] =
    issuesWithSource ?? (issues ?? []).map((issue) => ({ issue }));
  const showBelongsTo = !!issuesWithSource;

  const issueCount = rows.length;
  const unfixedCount = rows.filter((r) => r.issue.status !== "resolved").length;

  const visibleRows = useMemo(() => {
    const allowedStatuses = new Set<IssueStatus>(
      statusFilter.flatMap((group) => STATUS_GROUP_MEMBERS[group]),
    );
    const filtered = rows.filter(({ issue }) => {
      if (allowedStatuses.size > 0 && !allowedStatuses.has(issue.status))
        return false;
      if (sourceFilter !== "all" && issue.source !== sourceFilter) return false;
      return true;
    });
    if (sortMode === "default") return filtered;
    const direction = sortMode === "magnitude_desc" ? -1 : 1;
    return [...filtered].sort(
      (a, b) => direction * (a.issue.magnitude - b.issue.magnitude),
    );
  }, [rows, statusFilter, sourceFilter, sortMode]);

  const buttonColor =
    openIssueSeverity != null && openIssueSeverity > 0
      ? "red"
      : issueSeverity != null && issueSeverity > 0
        ? "orange"
        : "gray";

  return (
    <>
      <Tooltip
        label={`severity: ${issueSeverity ?? 0} | unfixed: ${openIssueSeverity ?? 0}${moderationPriority != null ? ` | priority: ${moderationPriority.toFixed(1)}` : ""}`}
        withArrow
      >
        <Button
          size="compact-xs"
          variant="light"
          color={buttonColor}
          leftSection={<IoMdAlert size={10} />}
          onClick={() => setOpened(true)}
        >
          {label ? `${label}: ` : ""}{issueCount} issue{issueCount !== 1 ? "s" : ""}
          {unfixedCount > 0 && ` (${unfixedCount} unfixed)`}
          {moderationPriority != null && ` · p${moderationPriority.toFixed(1)}`}
        </Button>
      </Tooltip>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={
          <Group gap="sm">
            <Text fw={600}>Validation Issues</Text>
            {label && <Badge color="gray" variant="light" tt="none">{label}</Badge>}
            <Badge color={buttonColor} variant="light">{issueCount} total</Badge>
            {unfixedCount > 0 && (
              <Badge color="red" variant="light">{unfixedCount} unfixed</Badge>
            )}
            {issueSeverity != null && (
              <Badge color="orange" variant="light">severity: {issueSeverity}</Badge>
            )}
            {openIssueSeverity != null && (
              <Badge color={openIssueSeverity > 0 ? "red" : "gray"} variant="light">
                unfixed severity: {openIssueSeverity}
              </Badge>
            )}
            {moderationPriority != null && (
              <Badge color={moderationPriority > 0 ? "pink" : "gray"} variant="light">
                priority: {moderationPriority.toFixed(1)}
              </Badge>
            )}
          </Group>
        }
        size="90%"
        scrollAreaComponent={ScrollArea.Autosize}
      >
        {rows.length === 0 ? (
          <Text size="sm" c="dimmed">
            No issues.
          </Text>
        ) : (
          <Stack gap="md">
            <Stack gap="xs">
              <Group gap="md" align="center" wrap="wrap">
                <Text size="xs" c="dimmed" fw={500}>
                  Status
                </Text>
                <Chip.Group
                  multiple
                  value={statusFilter}
                  onChange={(value) => setStatusFilter(value as StatusGroup[])}
                >
                  <Group gap="xs">
                    {STATUS_GROUP_OPTIONS.map((group) => (
                      <Chip key={group} value={group} size="xs">
                        {group}
                      </Chip>
                    ))}
                  </Group>
                </Chip.Group>
              </Group>
              <Group gap="md" align="center" wrap="wrap">
                <Text size="xs" c="dimmed" fw={500}>
                  Source
                </Text>
                <SegmentedControl
                  size="xs"
                  value={sourceFilter}
                  onChange={(value) => setSourceFilter(value as SourceFilter)}
                  data={[
                    { value: "all", label: "all" },
                    { value: "deterministic", label: "deterministic" },
                    { value: "llm", label: "llm" },
                  ]}
                />
                <Text size="xs" c="dimmed" fw={500}>
                  Sort
                </Text>
                <SegmentedControl
                  size="xs"
                  value={sortMode}
                  onChange={(value) => setSortMode(value as SortMode)}
                  data={[
                    { value: "default", label: "default" },
                    { value: "magnitude_desc", label: "magnitude ↓" },
                    { value: "magnitude_asc", label: "magnitude ↑" },
                  ]}
                />
                <Text size="xs" c="dimmed">
                  {visibleRows.length} of {rows.length} shown
                </Text>
              </Group>
            </Stack>
            {visibleRows.length === 0 ? (
              <Text size="sm" c="dimmed">
                No issues match the current filters.
              </Text>
            ) : (
              <Stack gap="xs">
                {visibleRows.map(({ issue, sourceLabel, sourceColor }, index) => (
                  <IssueRow
                    key={index}
                    issue={issue}
                    belongsToLabel={showBelongsTo ? sourceLabel ?? "comment" : undefined}
                    belongsToColor={showBelongsTo ? sourceColor : undefined}
                  />
                ))}
              </Stack>
            )}
          </Stack>
        )}
      </Modal>
    </>
  );
};
