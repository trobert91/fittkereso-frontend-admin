"use client";

import {
  Badge,
  Box,
  Divider,
  Group,
  Popover,
  Progress,
  Stack,
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
 * Impact's lower bound, mirroring `IMPACT_FLOOR` in the backend's priority
 * service: `impact = 0.2 + 0.8 × weightedMean(factors)`.
 *
 * Duplicated rather than shipped in the breakdown because it is a property of
 * the formula, not of the row — every row has the same floor. If the backend
 * ever makes it configurable it belongs on the payload instead.
 */
const IMPACT_FLOOR = 0.2;

/** Impact never reaches zero, so a bar at the floor needs saying — otherwise the
 *  number and the empty bar beside it look like a contradiction. */
function impactHint(impact: number): string {
  const atFloor = impact <= IMPACT_FLOOR + 0.005;
  return atFloor
    ? `what a wrong decision costs — at the ${IMPACT_FLOOR.toFixed(2)} floor, nothing rides on this`
    : `what a wrong decision costs — ${IMPACT_FLOOR.toFixed(2)} floor plus the factors below`;
}

/**
 * Status is two multipliers in one number: the workflow weight (pending 1,
 * done 0.15, superseded 0) times a staleness taper for a listing nobody has
 * seen in a while.
 *
 * A pending row showing 0.50 under "whether this is review work at all" reads as
 * a bug unless the taper is named, so name it whenever it is doing the work.
 */
function statusHint(statusWeight: number): string {
  const base = "whether this is review work at all";
  // The workflow weights are all ≥ 0.15, and staleness only ever multiplies
  // down, so a value that is not one of them implies the taper is applied.
  const looksTapered =
    statusWeight > 0 &&
    ![1, 0.15].some((weight) => Math.abs(statusWeight - weight) < 0.005);

  return looksTapered
    ? `${base} — reduced because the listing has not been seen in a while`
    : base;
}

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
      <Box>
        <Group justify="space-between" wrap="nowrap">
          <Text fw={600} size="sm">
            Priority {priority}
          </Text>
          <Badge color={level.color} variant="light" size="sm" tt="none">
            {level.label}
          </Badge>
        </Group>

        {/* The result, not another input — so it carries the urgency colour the
            ring uses and is drawn heavier than the terms below it. Priority is
            already 0–100, so it needs no scaling. */}
        <Progress
          value={Math.min(Math.max(priority, 0), 100)}
          color={level.color}
          size="md"
          radius="sm"
          mt={4}
        />
      </Box>

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
          hint={impactHint(breakdown.impact)}
          value={breakdown.impact}
          // Impact cannot go below its floor, so a bar drawn from zero would
          // show a fifth full for a row whose factors contributed nothing —
          // and would compress every real difference into the top 80%.
          floor={IMPACT_FLOOR}
        />
        <Multiplicand
          label="Status"
          hint={statusHint(breakdown.statusWeight)}
          value={breakdown.statusWeight}
        />
      </Stack>

      <Divider />

      <Text size="xs" fw={600}>
        What makes up the impact
      </Text>
      <Stack gap={6}>
        {breakdown.impactFactors.map((factor) => (
          <FactorRow key={factor.key} factor={factor} />
        ))}
      </Stack>

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

/**
 * One term of the product, with its bar drawn over the range it can actually
 * occupy.
 *
 * `floor` matters because a term with a floor is not a 0–1 scale: impact bottoms
 * out at `IMPACT_FLOOR`, so drawing it from zero would report the *minimum
 * possible value* as a fifth of the way to the maximum. The printed number stays
 * the true one — it is what multiplies into the score — while the bar answers
 * the different question of how far up its own range this row sits.
 */
function Multiplicand({
  label,
  hint,
  value,
  floor = 0,
}: {
  label: string;
  hint: string;
  value: number;
  floor?: number;
}) {
  const span = 1 - floor;
  const scaled = span > 0 ? (value - floor) / span : 0;

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
      {/* No `color`: the theme's primary is what every other bar in the queue
          uses, and it is the one shade guaranteed to read against the popover's
          surface. An explicit grey sat on top of the dark background and made
          the filled track invisible. */}
      <Progress
        value={Math.min(Math.max(scaled, 0), 1) * 100}
        size="sm"
        radius="sm"
        mt={2}
      />
    </Box>
  );
}

/**
 * One impact factor, as a bar of its own.
 *
 * The bar length is the factor's raw value, matching the number printed beside
 * it — not `value × weight`. The weighted product is not a quantity a reviewer
 * can check anything against, whereas the raw value is exactly what the backend
 * stores and what the weighted mean consumes.
 *
 * All three tracks are full width so the values can be compared down a shared
 * baseline, which is the common read here. Encoding the weight as track *width*
 * was the obvious alternative and is worse: at the shipped weights the smallest
 * factor gets a ~70px track, too small to read a fill in, and the ragged right
 * edge defeats exactly the comparison the section exists for.
 *
 * The weight rides on opacity instead — a low-weight term recedes without
 * shrinking — and is spelled out in the tooltip, since opacity alone is a hint
 * rather than a readable quantity.
 */
function FactorRow({ factor }: { factor: PriorityFactor }) {
  // Floor the fade well above invisible: this dims a secondary term, it does not
  // hide one. A factor with a small weight still contributed.
  const emphasis = 0.55 + 0.45 * Math.min(Math.max(factor.weight, 0), 1);

  return (
    <Box>
      <Group justify="space-between" wrap="nowrap" gap="xs">
        <Text size="xs">{FACTOR_LABELS[factor.key] ?? factor.key}</Text>
        <Group gap={6} wrap="nowrap">
          <Text size="xs" fw={600} style={{ whiteSpace: "nowrap" }}>
            {factor.value.toFixed(2)}
          </Text>
          <Tooltip
            label={`Counts for ${Math.round(factor.weight * 100)}% of the impact mean`}
            withArrow
          >
            <Text size="xs" c="dimmed" style={{ whiteSpace: "nowrap" }}>
              ×{factor.weight}
            </Text>
          </Tooltip>
        </Group>
      </Group>
      <Progress
        value={Math.min(Math.max(factor.value, 0), 1) * 100}
        size="sm"
        radius="sm"
        mt={2}
        style={{ opacity: emphasis }}
      />
    </Box>
  );
}
