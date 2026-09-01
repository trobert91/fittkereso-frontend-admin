"use client";

import { Badge, Group, Stack, Text, Tooltip } from "@mantine/core";
import { isEmpty } from "lodash";
import { ProductResolutionRecord } from "@/api-actions/product/product-resolutions";

/**
 * What the resolution pipeline was handed before it looked at anything.
 *
 * Lives in the card's *closed* state rather than behind the expander: half the
 * bad automated calls are bad inputs — a model string that swallowed a variant,
 * a category hint pointing at the wrong tree — and a reviewer who has to expand
 * the row to find that out has already spent the glance the queue is optimised
 * for. Badge-per-field on purpose, so a missing or wrong field is a shape
 * difference rather than something to read for.
 */
export function ResolutionInputPanel({
  resolution,
}: {
  resolution: ProductResolutionRecord;
}) {
  const snapshot = resolution.inputSnapshot;

  if (!snapshot) {
    return (
      <Text size="sm" c="dimmed">
        No input snapshot was recorded.
      </Text>
    );
  }

  if (snapshot.kind === "duplicate_detection") {
    return (
      <Stack gap="xs">
        <Group gap="xs" wrap="wrap">
          {snapshot.brandName && (
            <Badge variant="light" size="sm" tt="none">
              {snapshot.brandName}
            </Badge>
          )}
          {snapshot.categorySlug && (
            <Badge variant="light" color="gray" size="sm" tt="none">
              {snapshot.categorySlug}
            </Badge>
          )}
          <Tooltip
            label="The pg_trgm pre-filter score that put this pair up for comparison — distinct from the in-process similarity score."
            withArrow
            multiline
            maw={320}
          >
            <Badge variant="outline" size="sm" tt="none">
              trigram {Math.round(snapshot.trigramScore)}
            </Badge>
          </Tooltip>
        </Group>

        <Group align="flex-start" gap="xl" wrap="wrap">
          <NameBlock title="Query" entry={snapshot.query} />
          <NameBlock title="Candidate" entry={snapshot.candidate} />
        </Group>
      </Stack>
    );
  }

  const { input, options, referenceProduct } = snapshot;

  return (
    <Stack gap="xs">
      <Group gap="xs" wrap="wrap">
        <Field label="brand" value={input.brand} />
        <Field label="model" value={input.model} />
        <Field label="display name" value={input.displayName} />
        <Field
          label="category"
          value={input.category?.name ?? input.categoryHint}
        />
        <Field label="content quality" value={input.contentQuality} />
      </Group>

      {(!isEmpty(input.modelClues) || !isEmpty(input.variantClues)) && (
        <Group gap="xs" wrap="wrap">
          {input.modelClues?.map((clue) => (
            <Badge key={`model-${clue}`} color="cyan" variant="light" size="xs" tt="none">
              model clue: {clue}
            </Badge>
          ))}
          {input.variantClues?.map((clue) => (
            <Badge key={`variant-${clue}`} color="grape" variant="light" size="xs" tt="none">
              variant clue: {clue}
            </Badge>
          ))}
        </Group>
      )}

      {referenceProduct && (
        <Badge color="blue" variant="light" size="sm" tt="none" w="fit-content">
          anchored on {referenceProduct.model ?? referenceProduct.productId}
        </Badge>
      )}

      <Group gap="xs" wrap="wrap">
        <Badge color="gray" variant="outline" size="xs" tt="none">
          mode: {options.mode}
        </Badge>
        {options.useEmbedding && (
          <Badge color="gray" variant="outline" size="xs" tt="none">
            embedding recall
          </Badge>
        )}
        {options.webSearchEnabled && (
          <Badge color="red" variant="light" size="xs" tt="none">
            web search
          </Badge>
        )}
        {options.llmDecisionEnabled && (
          <Badge color="violet" variant="light" size="xs" tt="none">
            llm decision
          </Badge>
        )}
        {options.decisionStrategy && (
          <Badge color="gray" variant="outline" size="xs" tt="none">
            {options.decisionStrategy}
          </Badge>
        )}
      </Group>
    </Stack>
  );
}

function NameBlock({
  title,
  entry,
}: {
  title: string;
  entry: { model: string; displayName?: string; aliases: string[] };
}) {
  return (
    <Stack gap={2}>
      <Text size="xs" fw={600} c="dimmed">
        {title}
      </Text>
      <Text size="sm">{entry.displayName ?? entry.model}</Text>
      {!isEmpty(entry.aliases) && (
        <Group gap={4} wrap="wrap">
          {entry.aliases.map((alias) => (
            <Badge key={alias} color="gray" variant="light" size="xs" tt="none">
              {alias}
            </Badge>
          ))}
        </Group>
      )}
    </Stack>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <Badge color="blue" variant="light" size="sm" tt="none" radius="sm">
      {label}: {value}
    </Badge>
  );
}
