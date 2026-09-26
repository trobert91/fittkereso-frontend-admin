import { Badge, Group, Text } from "@mantine/core";
import { isArray } from "lodash";
import {
  ProductDuplicateFailedGate,
  ProductDuplicateGate,
} from "@/models/dtos/product-duplicate-search-models";

const GATE_LABELS: Record<ProductDuplicateGate, string> = {
  primarySpecMismatch: "primary spec",
  modelNumberMismatch: "model number",
  matcherSpecMismatch: "spec",
  specMissing: "missing",
};

export function formatSpecValue(value: unknown): string {
  if (value === undefined || value === null) return "—";
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (isArray(value)) return value.join(", ");
  return String(value);
}

/** A gate's value; a `specMissing` gate's silent side reads "missing". */
export function formatGateValue(value: unknown): string {
  return value === null || value === undefined ? "missing" : formatSpecValue(value);
}

/** One chip per contradiction: what it cost and both products' values (A ≠ B). */
export function FailedGateBadges({
  gates,
}: {
  gates: ProductDuplicateFailedGate[];
}) {
  if (gates.length === 0) {
    return (
      <Text size="xs" c="dimmed">
        No contradictions
      </Text>
    );
  }

  return (
    <Group gap={4}>
      {gates.map((gate, index) => (
        <Badge
          key={`${gate.gate}-${gate.spec ?? index}`}
          color={
            gate.gate === "matcherSpecMismatch"
              ? "orange"
              : gate.gate === "specMissing"
                ? "yellow"
                : "red"
          }
          variant="light"
          tt="none"
        >
          −{gate.severity} {gate.spec ?? GATE_LABELS[gate.gate]}:{" "}
          {formatGateValue(gate.productAValue)} ≠{" "}
          {formatGateValue(gate.productBValue)}
        </Badge>
      ))}
    </Group>
  );
}
