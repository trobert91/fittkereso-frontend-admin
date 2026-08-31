"use client";

import { Badge, Group, Stack, Text } from "@mantine/core";
import { isArray } from "lodash";
import {
  SpecMatchDetails,
  SpecMatchResult,
} from "@/api-actions/product/product-resolutions";

export function formatSpecValue(
  value: string | number | boolean | string[] | undefined,
): string {
  if (value === undefined || value === null) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (isArray(value)) return value.join(", ");
  return String(value);
}

const MATCH_BACKGROUNDS: Record<SpecMatchResult, string> = {
  match: "var(--mantine-color-green-light)",
  compatible: "var(--mantine-color-yellow-light)",
  mismatch: "var(--mantine-color-red-light)",
};

/**
 * Spec-by-spec comparison, tinted by outcome.
 *
 * Primary specs are marked because they are the ones that decide identity: a
 * single primary mismatch is a stronger signal that two products are different
 * than a dozen agreeing accessory specs are that they are the same.
 */
export function SpecMatchTable({
  details,
  labelA = "A",
  labelB = "B",
}: {
  details?: SpecMatchDetails;
  labelA?: string;
  labelB?: string;
}) {
  if (!details || details.details.length === 0) {
    return (
      <Text size="xs" c="dimmed">
        No comparable specs.
      </Text>
    );
  }

  return (
    <Stack gap={4}>
      <Group gap="xs">
        <Badge
          color={details.primaryMismatches > 0 ? "red" : "green"}
          variant="light"
          size="xs"
          tt="none"
        >
          {details.matchingCount}/{details.comparableCount} match
        </Badge>
        {details.primaryMismatches > 0 && (
          <Badge color="red" variant="light" size="xs" tt="none">
            {details.primaryMismatches} primary mismatch
            {details.primaryMismatches === 1 ? "" : "es"}
          </Badge>
        )}
        {details.matcherSpecMismatches > 0 && (
          <Badge color="orange" variant="light" size="xs" tt="none">
            {details.matcherSpecMismatches} matcher mismatch
            {details.matcherSpecMismatches === 1 ? "" : "es"}
          </Badge>
        )}
        <Text size="xs" c="dimmed">
          {labelA} vs {labelB}
        </Text>
      </Group>

      {details.details.map((spec) => (
        <Group
          key={spec.key}
          gap={6}
          wrap="nowrap"
          style={{
            backgroundColor: MATCH_BACKGROUNDS[spec.match],
            borderRadius: 4,
            padding: "2px 6px",
          }}
        >
          <Text size="xs" c="dimmed" style={{ minWidth: 140 }}>
            {spec.key}
          </Text>
          {spec.isPrimary && (
            <Badge color="blue" variant="light" size="xs" tt="none">
              primary
            </Badge>
          )}
          {spec.isMatcher && (
            <Badge color="grape" variant="light" size="xs" tt="none">
              matcher
            </Badge>
          )}
          <Text size="xs">
            {formatSpecValue(spec.valueA)} vs {formatSpecValue(spec.valueB)}
          </Text>
        </Group>
      ))}
    </Stack>
  );
}
