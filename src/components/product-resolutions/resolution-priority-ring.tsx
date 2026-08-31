"use client";

import {
  Badge,
  Box,
  Divider,
  Group,
  Popover,
  Progress,
  Stack,
  Table,
  Text,
  Tooltip,
} from "@mantine/core";
import { IoWarningOutline } from "react-icons/io5";
import type {
  PriorityFactor,
  ResolutionPriorityBreakdown,
} from "@/api-actions/product/product-resolutions";

/**
 * Urgency, not quality — so the palette is the inverse of `ScoreRing`'s.
 *
 * A high priority means *drop everything*, which has to read as red. Reusing the
 * shared ring here would paint the rows most in need of a human bright green.
 */
const URGENCY_LEVELS = [
  { min: 70, color: "red", label: "review first" },
  { min: 45, color: "orange", label: "worth a look" },
  { min: 20, color: "yellow", label: "low" },
  { min: 0, color: "gray", label: "background" },
] as const;

function urgency(priority: number) {
  return URGENCY_LEVELS.find((level) => priority >= level.min) ?? URGENCY_LEVELS[3];
}

const FACTOR_LABELS: Record<string, string> = {
  blastRadius: "Listings & offers riding on it",
  actionKind: "What is at stake in the action",
  mergeReach: "How far a performed merge reached",
};

/**
 * The queue's ordering key, with its working one click away.
 *
 * The popover is not decoration: a score nobody can interrogate is one nobody
 * can trust or correct. If the top of the queue looks wrong, this is where the
 * term that caused it becomes visible.
 */
export function ResolutionPriorityRing({
  priority,
  breakdown,
  size = 44,
}: {
  priority?: number;
  breakdown?: ResolutionPriorityBreakdown;
  size?: number;
}) {
  if (priority == null) {
    return (
      <Tooltip
        label="Not scored yet — the nightly sweep has not reached this row. It sorts last rather than first: unscored is unknown, not urgent."
        withArrow
        multiline
        maw={300}
      >
        <Badge color="gray" variant="outline" size="sm" tt="none">
          unscored
        </Badge>
      </Tooltip>
    );
  }

  const level = urgency(priority);
  const ring = <Ring value={priority} color={level.color} size={size} />;

  if (!breakdown) {
    return (
      <Tooltip label={`priority ${priority} — ${level.label}`} withArrow>
        <Box style={{ display: "inline-flex" }}>{ring}</Box>
      </Tooltip>
    );
  }

  return (
    <Popover width={380} position="bottom-start" withArrow shadow="md">
      <Popover.Target>
        <Box style={{ display: "inline-flex", cursor: "pointer" }}>{ring}</Box>
      </Popover.Target>
      <Popover.Dropdown>
        <PriorityBreakdown priority={priority} breakdown={breakdown} />
      </Popover.Dropdown>
    </Popover>
  );
}

function Ring({
  value,
  color,
  size,
}: {
  value: number;
  color: string;
  size: number;
}) {
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const strokeColor = `var(--mantine-color-${color}-6)`;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="var(--mantine-color-dark-5)"
        strokeWidth={stroke}
      />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={strokeColor}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference - (value / 100) * circumference}
        transform={`rotate(-90 ${center} ${center})`}
      />
      <text
        x={center}
        y={center}
        textAnchor="middle"
        dominantBaseline="central"
        fill="currentColor"
        fontSize={Math.max(8, Math.round(size * 0.38))}
        fontWeight={700}
      >
        {Math.round(value)}
      </text>
    </svg>
  );
}

/** Why this row sits where it does. */
function PriorityBreakdown({
  priority,
  breakdown,
}: {
  priority: number;
  breakdown: ResolutionPriorityBreakdown;
}) {
  const level = urgency(priority);

  return (
    <Stack gap="xs">
      <Group justify="space-between" wrap="nowrap">
        <Text fw={600} size="sm">
          Priority {priority}
        </Text>
        <Badge color={level.color} variant="light" size="sm" tt="none">
          {level.label}
        </Badge>
      </Group>

      <Text size="xs" c="dimmed">
        Multiplied, not added — a decision we are sure about needs no review
        however much rides on it, and one touching nothing needs none however
        unsure we are.
      </Text>

      <Stack gap={6}>
        <Multiplicand
          label="Uncertainty"
          hint={`how likely the decision is wrong — confidence ${breakdown.confidence}`}
          value={breakdown.uncertainty}
        />
        <Multiplicand
          label="Impact"
          hint="what a wrong decision costs"
          value={breakdown.impact}
        />
        <Multiplicand
          label="Status"
          hint="whether this is review work at all"
          value={breakdown.statusWeight}
        />
      </Stack>

      <Divider />

      <Text size="xs" fw={600}>
        What makes up the impact
      </Text>
      <Table verticalSpacing={2} horizontalSpacing={4} fz="xs">
        <Table.Tbody>
          {breakdown.impactFactors.map((factor) => (
            <FactorRow key={factor.key} factor={factor} />
          ))}
        </Table.Tbody>
      </Table>

      {!breakdown.blastRadiusMeasured && (
        <Group gap={4} wrap="nowrap" align="flex-start">
          <IoWarningOutline size={14} color="var(--mantine-color-orange-6)" />
          <Text size="xs" c="dimmed">
            The blast radius was assumed, not counted — counting it at scrape
            time would cost a query per listing. The nightly sweep replaces it.
          </Text>
        </Group>
      )}
    </Stack>
  );
}

function Multiplicand({
  label,
  hint,
  value,
}: {
  label: string;
  hint: string;
  value: number;
}) {
  return (
    <Box>
      <Group justify="space-between" wrap="nowrap" gap="xs">
        <Text size="xs">
          {label}{" "}
          <Text span size="xs" c="dimmed">
            — {hint}
          </Text>
        </Text>
        <Text size="xs" fw={600} style={{ whiteSpace: "nowrap" }}>
          {value.toFixed(2)}
        </Text>
      </Group>
      <Progress value={value * 100} size="xs" color="gray" mt={2} />
    </Box>
  );
}

function FactorRow({ factor }: { factor: PriorityFactor }) {
  return (
    <Table.Tr>
      <Table.Td>{FACTOR_LABELS[factor.key] ?? factor.key}</Table.Td>
      <Table.Td ta="right" fw={600}>
        {factor.value.toFixed(2)}
      </Table.Td>
      <Table.Td ta="right" c="dimmed">
        ×{factor.weight}
      </Table.Td>
    </Table.Tr>
  );
}
