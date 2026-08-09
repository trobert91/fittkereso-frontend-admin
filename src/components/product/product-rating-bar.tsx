"use no memo";

import { useState } from "react";
import { Progress, Stack, Text, Group, Button } from "@mantine/core";
import { ProductRating } from "@/models/rating-types";

/** Returns a Mantine color token based on a 0–100 percent value. */
function rangeColor(percent: number): string {
  if (percent < 20) return "red";
  if (percent < 40) return "orange";
  if (percent < 60) return "yellow";
  if (percent < 80) return "lime";
  return "green";
}

interface RatingRowProps {
  label: string;
  value: number;
  max: number;
  color?: string;
}

function RatingRow({ label, value, max, color }: RatingRowProps) {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0;
  const resolvedColor = color ?? rangeColor(percent);
  return (
    <Stack gap={2}>
      <Group justify="space-between" gap={4}>
        <Text size="xs" c="dimmed" style={{ whiteSpace: "nowrap" }}>
          {label}
        </Text>
        <Text size="xs" fw={500}>
          {value}
        </Text>
      </Group>
      <Progress value={percent} color={resolvedColor} size="sm" radius="xs" />
    </Stack>
  );
}

interface ScoreRowProps {
  label: string;
  /** 0–100 integer */
  value: number | null | undefined;
  color?: string;
}

function ScoreRow({ label, value, color }: ScoreRowProps) {
  if (value == null) return null;
  const resolvedColor = color ?? rangeColor(value);
  return (
    <Stack gap={2}>
      <Group justify="space-between" gap={4}>
        <Text size="xs" c="dimmed" style={{ whiteSpace: "nowrap" }}>
          {label}
        </Text>
        <Text size="xs" fw={500}>
          {value}
        </Text>
      </Group>
      <Progress value={value} color={resolvedColor} size="sm" radius="xs" />
    </Stack>
  );
}

export function ProductRatingBar({
  rating,
}: {
  rating: ProductRating | null | undefined;
}) {
  const [expanded, setExpanded] = useState(false);

  if (!rating) return null;

  const total = rating.totalReviewCount;

  return (
    <Stack gap={6} mt={6} style={{ minWidth: 180, maxWidth: 240 }}>
      <ScoreRow label="Rating" value={rating.rating} />
      <RatingRow
        label="Strong positive"
        value={rating.strongPositiveReviewCount}
        max={total}
        color="green"
      />
      <RatingRow
        label="Positive"
        value={rating.positiveReviewCount}
        max={total}
      />
      <RatingRow
        label="Negative"
        value={rating.negativeReviewCount}
        max={total}
        color="orange"
      />
      <RatingRow
        label="Strong negative"
        value={rating.strongNegativeReviewCount}
        max={total}
        color="red"
      />

      {expanded && (
        <>
          <RatingRow
            label="Neutral"
            value={rating.neutralReviewCount}
            max={total}
            color="gray"
          />
          <RatingRow
            label="Mixed"
            value={rating.mixedReviewCount}
            max={total}
            color="blue"
          />
          <RatingRow
            label="Total"
            value={rating.totalReviewCount}
            max={total}
            color="blue"
          />
          <RatingRow
            label="Hands-on"
            value={rating.handsonReviewCount}
            max={total}
            color="teal"
          />
          <ScoreRow label="Avg score" value={rating.averageReviewScore} />
        </>
      )}

      <Button
        size="compact-xs"
        variant="subtle"
        color="gray"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? "Hide" : "Show more"}
      </Button>
    </Stack>
  );
}
