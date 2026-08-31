"use client";

import { Badge, Group, Stack, Table, Text } from "@mantine/core";
import { isArray, orderBy } from "lodash";
import {
  SpecMatchDetail,
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

/** Row tint by outcome. Kept light so the kind badges in the first column stay
 *  legible on top of them. */
const MATCH_BACKGROUNDS: Record<SpecMatchResult, string> = {
  match: "var(--mantine-color-green-light)",
  compatible: "var(--mantine-color-yellow-light)",
  mismatch: "var(--mantine-color-red-light)",
};

/**
 * Which role a spec plays in deciding identity. `primary` outranks `matcher`
 * when a spec is both — a primary mismatch is the stronger statement.
 */
function specKind(spec: SpecMatchDetail): {
  label: string;
  color: string;
  /** Sorts identity-defining specs to the top, where a mismatch is worth most. */
  rank: number;
} | null {
  if (spec.isPrimary) return { label: "primary", color: "blue", rank: 0 };
  if (spec.isMatcher) return { label: "matcher", color: "grape", rank: 1 };
  return null;
}

/**
 * Spec-by-spec comparison as a real table: role, field, then one column per
 * side.
 *
 * Two columns rather than an inline "a vs b" string because the comparison is
 * vertical — scanning one product's values down a column, and across only where
 * a row is tinted as disagreeing, is what the reviewer is actually doing. A
 * single run-on cell forces them to re-parse each row to find the boundary.
 *
 * Rows are ordered primary → matcher → the rest, since a single primary
 * mismatch is a stronger signal that two products differ than a dozen agreeing
 * accessory specs are that they are the same.
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

  const rows = orderBy(
    details.details,
    [(spec) => specKind(spec)?.rank ?? 2, (spec) => spec.key],
    ["asc", "asc"],
  );

  return (
    <Stack gap={6}>
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
      </Group>

      {/* Wide spec values must not push the card into a horizontal scroll. */}
      <Table.ScrollContainer minWidth={480} type="native">
        <Table
          withTableBorder
          withColumnBorders
          verticalSpacing={4}
          horizontalSpacing="xs"
          layout="fixed"
        >
          <Table.Thead>
            <Table.Tr>
              <Table.Th w={90}>Role</Table.Th>
              <Table.Th w={170}>Field</Table.Th>
              <Table.Th>{labelA}</Table.Th>
              <Table.Th>{labelB}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((spec) => {
              const kind = specKind(spec);
              return (
                <Table.Tr
                  key={spec.key}
                  style={{ backgroundColor: MATCH_BACKGROUNDS[spec.match] }}
                >
                  <Table.Td>
                    {kind && (
                      <Badge
                        color={kind.color}
                        variant="light"
                        size="xs"
                        tt="none"
                      >
                        {kind.label}
                      </Badge>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" c="dimmed">
                      {spec.key}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <SpecValue
                      value={spec.valueA}
                      emphasised={spec.match === "mismatch"}
                    />
                  </Table.Td>
                  <Table.Td>
                    <SpecValue
                      value={spec.valueB}
                      emphasised={spec.match === "mismatch"}
                    />
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Stack>
  );
}

/** Disagreeing values are bolded so the eye lands on the difference itself,
 *  not just the tinted row it sits in. */
function SpecValue({
  value,
  emphasised,
}: {
  value: SpecMatchDetail["valueA"];
  emphasised: boolean;
}) {
  return (
    <Text size="xs" fw={emphasised ? 700 : 400} style={{ wordBreak: "break-word" }}>
      {formatSpecValue(value)}
    </Text>
  );
}
