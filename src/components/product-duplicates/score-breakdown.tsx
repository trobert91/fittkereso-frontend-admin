import { Alert, Badge, Code, Group, Stack, Table, Text } from "@mantine/core";
import {
  ProductDuplicateGate,
  ProductDuplicatePair,
} from "@/models/dtos/product-duplicate-search-models";
import { ProductModel } from "@/models/product-model";
import { formatSpecValue } from "./failed-gate-badges";

/** Mirrors ACCEPT_SCORE / NEAR_MISS_SCORE in libs/product-identity. */
const ACCEPT_SCORE = 80;
const NEAR_MISS_SCORE = 70;

const GATE_LABELS: Record<ProductDuplicateGate, string> = {
  primarySpecMismatch: "Primary spec",
  modelNumberMismatch: "Model number",
  matcherSpecMismatch: "Spec",
};

const GATE_EXPLANATIONS: Record<ProductDuplicateGate, string> = {
  primarySpecMismatch:
    "A spec that decides identity for this category disagrees.",
  modelNumberMismatch:
    "The numbers in the two names differ, and neither set contains the other.",
  matcherSpecMismatch: "A supporting spec disagrees.",
};

function ratio(value: number): string {
  return value.toFixed(2);
}

/** Green once a listing would attach on its own, amber while it still needs a person. */
function scoreColor(score: number): string {
  return score >= ACCEPT_SCORE ? "green" : "yellow";
}

/**
 * Why this pair scores what it does, as the engine actually computes it:
 *
 *   score = clamp(round(100 × max(trigram, levenshtein)) − Σ severities, 1, 100)
 *
 * Everything here comes off the stored pair row — the two similarities and each
 * failed gate with both products' values — so the table is the calculation
 * rather than a re-derivation of it.
 */
export function ScoreBreakdown({
  pair,
  products,
}: {
  pair: ProductDuplicatePair;
  products?: [ProductModel, ProductModel];
}) {
  const similarity = pair.nameSimilarity;
  const gates = pair.failedGates ?? [];
  const deductions = gates.reduce((sum, gate) => sum + gate.severity, 0);

  // A pair carried onto a survivor by a merge keeps the old score but no
  // similarities and no gates — they compared the product that is now gone.
  if (!similarity) {
    return (
      <Alert
        variant="light"
        color="gray"
        title={
          <Badge
            size="lg"
            variant="light"
            color={scoreColor(pair.similarityScore)}
          >
            Score {pair.similarityScore}
          </Badge>
        }
      >
        <Text size="sm">
          This pair was carried over when one of its products was merged away, so
          it keeps the score it had but not the comparison behind it. The next
          scan recomputes it.
        </Text>
      </Alert>
    );
  }

  const trigramWins = similarity.trigram >= similarity.levenshtein;
  const base = Math.round(
    100 * Math.max(similarity.trigram, similarity.levenshtein),
  );
  const beforeClamp = base - deductions;
  const clamped = beforeClamp !== pair.similarityScore;

  return (
    <Stack gap={6}>
      <Group gap="sm" align="center">
        <Badge
          size="lg"
          variant="light"
          color={scoreColor(pair.similarityScore)}
        >
          Score {pair.similarityScore}
        </Badge>
        <Text size="xs" fw={600} tt="uppercase" c="dimmed">
          How it was calculated
        </Text>
      </Group>

      <Table withTableBorder withColumnBorders verticalSpacing={6} fz="xs">
        <Table.Thead>
          <Table.Tr>
            <Table.Th style={{ width: 170 }}>Step</Table.Th>
            <Table.Th>What was compared</Table.Th>
            <Table.Th style={{ width: 70, textAlign: "right" }}>Points</Table.Th>
          </Table.Tr>
        </Table.Thead>

        <Table.Tbody>
          <Table.Tr>
            <Table.Td>
              <Text size="xs" fw={600}>
                Name similarity
              </Text>
              <Text size="xs" c="dimmed">
                the better of the two
              </Text>
            </Table.Td>
            <Table.Td>
              <Stack gap={4}>
                {products && (
                  <Stack gap={2}>
                    <Code fz="xs">
                      {products[0].normalizedName ?? "—"}
                    </Code>
                    <Code fz="xs">
                      {products[1].normalizedName ?? "—"}
                    </Code>
                  </Stack>
                )}
                <Group gap="md">
                  <Text size="xs" fw={trigramWins ? 700 : 400}>
                    trigram {ratio(similarity.trigram)}
                  </Text>
                  <Text size="xs" fw={trigramWins ? 400 : 700}>
                    Levenshtein {ratio(similarity.levenshtein)}
                  </Text>
                </Group>
                {pair.matchedOn === "alias" && (
                  <Text size="xs" c="dimmed">
                    Found through an alias, not the product&apos;s own name key:{" "}
                    <Code fz="xs">{pair.matchedValue}</Code>
                  </Text>
                )}
              </Stack>
            </Table.Td>
            <Table.Td style={{ textAlign: "right" }}>
              <Text size="xs" fw={600}>
                {base}
              </Text>
            </Table.Td>
          </Table.Tr>

          {gates.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={2}>
                <Text size="xs" c="dimmed">
                  No contradictions — nothing was subtracted, so the name
                  distance alone decided this score.
                </Text>
              </Table.Td>
              <Table.Td style={{ textAlign: "right" }}>
                <Text size="xs" c="dimmed">
                  −0
                </Text>
              </Table.Td>
            </Table.Tr>
          )}

          {gates.map((gate, index) => (
            <Table.Tr key={`${gate.gate}-${gate.spec ?? index}`}>
              <Table.Td>
                <Text size="xs" fw={600} c="red">
                  {GATE_LABELS[gate.gate]}
                  {gate.spec ? `: ${gate.spec}` : ""}
                </Text>
                <Text size="xs" c="dimmed">
                  {GATE_EXPLANATIONS[gate.gate]}
                </Text>
              </Table.Td>
              <Table.Td>
                <Group gap={6}>
                  <Code fz="xs">{formatSpecValue(gate.productAValue)}</Code>
                  <Text size="xs" c="dimmed">
                    ≠
                  </Text>
                  <Code fz="xs">{formatSpecValue(gate.productBValue)}</Code>
                </Group>
              </Table.Td>
              <Table.Td style={{ textAlign: "right" }}>
                <Text size="xs" fw={600} c="red">
                  −{gate.severity}
                </Text>
              </Table.Td>
            </Table.Tr>
          ))}

          {clamped && (
            <Table.Tr>
              <Table.Td>
                <Text size="xs" fw={600}>
                  Floor
                </Text>
              </Table.Td>
              <Table.Td>
                <Text size="xs" c="dimmed">
                  The deductions took it to {beforeClamp}; a score never goes
                  below 1.
                </Text>
              </Table.Td>
              <Table.Td style={{ textAlign: "right" }}>
                <Text size="xs" c="dimmed">
                  →&nbsp;1
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>

        <Table.Tfoot>
          <Table.Tr>
            <Table.Td>
              <Text size="xs" fw={700}>
                Score
              </Text>
            </Table.Td>
            <Table.Td>
              <Text size="xs" c="dimmed">
                {verdictOf(pair.similarityScore)}
              </Text>
            </Table.Td>
            <Table.Td style={{ textAlign: "right" }}>
              <Text size="sm" fw={700}>
                {pair.similarityScore}
              </Text>
            </Table.Td>
          </Table.Tr>
        </Table.Tfoot>
      </Table>

      <Text size="xs" c="dimmed">
        A spec only subtracts when <b>both</b> products publish it and the two
        values contradict each other. One that only one side publishes is
        skipped, so &ldquo;no contradictions&rdquo; means nothing disagreed — not
        that everything was compared.
      </Text>
    </Stack>
  );
}

function verdictOf(score: number): string {
  if (score >= ACCEPT_SCORE) {
    return `${ACCEPT_SCORE}+ — a scraped listing with this name would attach to the product outright, with no LLM call.`;
  }
  if (score >= NEAR_MISS_SCORE) {
    const gap = ACCEPT_SCORE - score;
    return `${NEAR_MISS_SCORE}–${ACCEPT_SCORE - 1}: ${gap} ${
      gap === 1 ? "point" : "points"
    } below attaching on its own. A scraped listing goes to the LLM, and two stored products become this pair.`;
  }
  return `Below ${NEAR_MISS_SCORE} — too far apart to pair or to reach the LLM.`;
}
