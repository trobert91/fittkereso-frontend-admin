"use client";

import { useMemo, useState } from "react";
import {
  Alert,
  Anchor,
  Badge,
  Card,
  Divider,
  Group,
  Progress,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import Link from "next/link";
import { isEmpty, orderBy } from "lodash";
import { IoWarning } from "react-icons/io5";
import { LuExternalLink } from "react-icons/lu";
import {
  MatchResultComponents,
  ProductResolutionCandidateRecord,
  ProductResolutionRecord,
  ResolutionListItem,
} from "@/api-actions/product/product-resolutions";
import { ProductDetailsModal } from "@/components/product/details-modal";
import { formatDate } from "@/utils/date";
import { routes } from "@/utils/routes";
import { GateBadges } from "./gate-badges";
import { SpecMatchTable } from "./spec-match-table";
import { productLookup } from "./resolution-labels";

/**
 * Everything behind the decision, in one block shared by the card's inline
 * expansion and the review modal — so what a reviewer reads before deciding is
 * literally the same view either way.
 */
export function ResolutionEvidence({ item }: { item: ResolutionListItem }) {
  const { resolution } = item;

  // Plain blocks rather than Card.Sections: this renders inside a Collapse on
  // the card, and Card.Section's negative margins do not survive being nested
  // in one. The caller supplies the section chrome.
  return (
    <Stack gap="lg" py="md">
      <Section title="Candidates considered">
        <CandidateList resolution={resolution} />
      </Section>

      {resolution.flow === "duplicate_detection" && (
        <>
          <Divider />
          <Section title="Spec comparison">
            <SpecMatchTable
              details={resolution.specMatchDetails}
              labelA={resolution.productA?.displayName ?? "A"}
              labelB={resolution.productB?.displayName ?? "B"}
            />
          </Section>
        </>
      )}

      <Divider />
      <Section title="What the system was given">
        <InputPanel resolution={resolution} />
      </Section>

      <Divider />
      <Section title="The listing">
        <ListingPanel item={item} />
      </Section>
    </Stack>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Stack gap="xs">
      <Text size="xs" fw={700} c="dimmed" tt="uppercase">
        {title}
      </Text>
      {children}
    </Stack>
  );
}

function CandidateList({
  resolution,
}: {
  resolution: ProductResolutionRecord;
}) {
  const [detailProductId, setDetailProductId] = useState<string | null>(null);
  const products = useMemo(() => productLookup(resolution), [resolution]);
  const chosenId = resolution.resolvedProduct?.id;

  const ordered = useMemo(
    () => orderBy(resolution.candidates ?? [], [(c) => c.matchScore ?? 0], ["desc"]),
    [resolution.candidates],
  );

  if (isEmpty(ordered)) {
    return (
      <Text size="sm" c="dimmed">
        No candidates were recalled for this decision.
      </Text>
    );
  }

  return (
    <>
      <Stack gap="sm">
        {ordered.map((candidate) => (
          <CandidateDetail
            key={candidate.candidateId}
            candidate={candidate}
            name={
              products[candidate.candidateId]?.displayName ??
              candidate.displayName ??
              candidate.model ??
              candidate.candidateId
            }
            chosen={candidate.candidateId === chosenId}
            onOpen={() => setDetailProductId(candidate.candidateId)}
          />
        ))}
      </Stack>

      <ProductDetailsModal
        productId={detailProductId}
        opened={detailProductId !== null}
        onClose={() => setDetailProductId(null)}
      />
    </>
  );
}

function CandidateDetail({
  candidate,
  name,
  chosen,
  onOpen,
}: {
  candidate: ProductResolutionCandidateRecord;
  name: string;
  chosen: boolean;
  onOpen: () => void;
}) {
  return (
    <Card withBorder p="sm" radius="sm">
      <Stack gap={8}>
        <Group justify="space-between" wrap="nowrap">
          <Group gap="xs" wrap="nowrap">
            {chosen && (
              <Badge color="blue" variant="filled" size="sm" tt="none">
                chosen
              </Badge>
            )}
            <Anchor size="sm" fw={600} onClick={onOpen} component="button">
              {name}
            </Anchor>
            <Anchor
              component={Link}
              href={routes.products.details(candidate.candidateId)}
              target="_blank"
            >
              <LuExternalLink size={12} />
            </Anchor>
          </Group>

          <Group gap="xs" wrap="nowrap">
            {candidate.brand && (
              <Text size="xs" c="dimmed">
                {candidate.brand}
              </Text>
            )}
            <Tooltip
              label="How this candidate was recalled into the comparison."
              withArrow
            >
              <Badge variant="outline" size="sm" tt="none">
                {candidate.source.split("_").join(" ")}
              </Badge>
            </Tooltip>
            {candidate.matchScore !== undefined && (
              <Badge color="grape" variant="light" size="sm" tt="none">
                score {Math.round(candidate.matchScore)}
              </Badge>
            )}
          </Group>
        </Group>

        <GateBadges
          passed={candidate.gates?.passed ?? false}
          failedGates={candidate.gates?.failedGates ?? []}
        />

        {candidate.matchComponents && (
          <MatchComponentBars components={candidate.matchComponents} />
        )}

        {candidate.specMatchDetails && (
          <>
            <Divider />
            <SpecMatchTable
              details={candidate.specMatchDetails}
              labelA="listing"
              labelB={name}
            />
          </>
        )}
      </Stack>
    </Card>
  );
}

/** The score's constituent parts. A high total built entirely on string
 *  similarity with no spec agreement is a different kind of match than one
 *  backed by an alias hit, and the breakdown is what shows that. */
function MatchComponentBars({
  components,
}: {
  components: MatchResultComponents;
}) {
  const bars: { label: string; value: number }[] = [
    { label: "name similarity", value: components.stringSimilarity },
    { label: "token overlap", value: components.tokenOverlap },
    { label: "alphanumeric", value: components.alphaMatch },
    { label: "specs", value: components.specSimilarity },
  ];

  return (
    <Stack gap={4}>
      {bars.map((bar) => (
        <Group key={bar.label} gap="xs" wrap="nowrap">
          <Text size="xs" c="dimmed" style={{ minWidth: 120 }}>
            {bar.label}
          </Text>
          <Progress
            value={Math.max(0, Math.min(100, bar.value * 100))}
            size="sm"
            radius="sm"
            style={{ flex: 1, maxWidth: 220 }}
          />
          <Text size="xs" c="dimmed" style={{ minWidth: 32 }}>
            {Math.round(bar.value * 100)}
          </Text>
        </Group>
      ))}
      {components.aliasMatch && (
        <Badge color="green" variant="light" size="xs" tt="none" w="fit-content">
          alias match
        </Badge>
      )}
    </Stack>
  );
}

function InputPanel({ resolution }: { resolution: ProductResolutionRecord }) {
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

/**
 * The scraped listing and — the part that matters — the product it sits on
 * *now*, read live rather than from the row's stored `resolvedProduct`. An
 * unrelated merge can move a listing after a decision was recorded, and acting
 * without noticing that is how a correction goes to the wrong product.
 */
function ListingPanel({ item }: { item: ResolutionListItem }) {
  const { resolution, state } = item;
  const record = resolution.sourceRecord;

  if (!record) {
    return (
      <Text size="sm" c="dimmed">
        No scraped listing is linked to this record, so split and merge
        corrections are unavailable.
      </Text>
    );
  }

  const current = record.model;
  const resolved = resolution.resolvedProduct;
  const moved = !!current && !!resolved && current.id !== resolved.id;

  return (
    <Stack gap="xs">
      <Group gap="xs" wrap="wrap">
        {record.source?.name && (
          <Badge variant="light" size="sm" tt="none">
            {record.source.name}
          </Badge>
        )}
        {record.externalId && (
          <Badge color="gray" variant="light" size="sm" tt="none">
            id: {record.externalId}
          </Badge>
        )}
        {record.lastUpdated && (
          <Badge color="gray" variant="light" size="sm" tt="none">
            scraped: {formatDate(record.lastUpdated, "yyyy-MM-dd HH:mm")}
          </Badge>
        )}
      </Group>

      {record.url && (
        <Anchor href={record.url} target="_blank" size="xs" truncate>
          {record.url}
        </Anchor>
      )}

      {moved && (
        <Alert color="orange" icon={<IoWarning size={16} />}>
          This listing has moved since the decision was recorded — it now sits on{" "}
          <strong>{current!.displayName}</strong>, not{" "}
          <strong>{resolved!.displayName}</strong>. Corrections act on where it
          is now.
        </Alert>
      )}

      {current && (
        <Group gap="xs">
          <Text size="sm" c="dimmed">
            Currently on:
          </Text>
          <Anchor
            component={Link}
            href={routes.products.details(current.id)}
            target="_blank"
            size="sm"
            fw={500}
          >
            {current.displayName}
          </Anchor>
          {current.brand?.name && (
            <Text size="xs" c="dimmed">
              {current.brand.name}
            </Text>
          )}
        </Group>
      )}

      {!isEmpty(state.splittableSourceRecordIds) && (
        <Text size="xs" c="dimmed">
          A split would carve out {state.splittableSourceRecordIds.length}{" "}
          listing
          {state.splittableSourceRecordIds.length === 1 ? "" : "s"}.
        </Text>
      )}
    </Stack>
  );
}
