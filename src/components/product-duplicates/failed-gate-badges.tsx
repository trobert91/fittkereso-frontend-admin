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
};

export function formatSpecValue(value: unknown): string {
  if (value === undefined || value === null) return "—";
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (isArray(value)) return value.join(", ");
  return String(value);
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
          color={gate.gate === "matcherSpecMismatch" ? "orange" : "red"}
          variant="light"
          tt="none"
        >
          −{gate.severity} {gate.spec ?? GATE_LABELS[gate.gate]}:{" "}
          {formatSpecValue(gate.productAValue)} ≠{" "}
          {formatSpecValue(gate.productBValue)}
        </Badge>
      ))}
    </Group>
  );
}
