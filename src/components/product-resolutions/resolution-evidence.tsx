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
import { LuExternalLink, LuFilterX } from "react-icons/lu";
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
import { ListingPrice, formatPrice } from "./resolution-product-card";
import { filterReasonLabel, productLookup } from "./resolution-labels";

/**
 * Everything behind the decision, in one block shared by the card's inline
 * expansion and the review modal — so what a reviewer reads before deciding is
 * literally the same view either way.
 *
 * "What the system was given" is deliberately *not* here: it moved out to
 * `ResolutionInputPanel`, which both callers render in their always-visible
 * area. This block is only the part that earns an expander.
 */
export function ResolutionEvidence({ item }: { item: ResolutionListItem }) {
  const { resolution } = item;

  // Plain blocks rather than Card.Sections: this renders inside a Collapse on
  // the card, and Card.Section's negative margins do not survive being nested
  // in one. The caller supplies the section chrome.
  return (
    // `pt="lg"` rather than a symmetric `py`: the caller's section border sits
    // directly above the first heading, and matching the inter-section rhythm
    // there is what keeps "Candidates considered" from reading as glued to it.
    <Stack gap="lg" pt="lg" pb="md">
      <EvidenceSection title="Candidates considered">
        <CandidateList resolution={resolution} />
      </EvidenceSection>

      {resolution.flow === "duplicate_detection" && (
        <>
          <Divider />
          <EvidenceSection title="Spec comparison">
            <SpecMatchTable
              details={resolution.specMatchDetails}
              labelA={resolution.productA?.displayName ?? "A"}
              labelB={resolution.productB?.displayName ?? "B"}
            />
          </EvidenceSection>
        </>
      )}

      <Divider />
      <EvidenceSection title="The listing">
        <ListingPanel item={item} />
      </EvidenceSection>
    </Stack>
  );
}

/** The heading every evidence block wears. Exported so the sections that live
 *  outside the expander look like they belong to the same view. */
export function EvidenceSection({
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
    <Card
      withBorder
      p="sm"
      radius="sm"
      // Same green treatment as the candidate strip, so the chosen candidate is
      // recognisable in both places without re-reading the badges.
      style={
        chosen
          ? {
              borderColor: "var(--mantine-color-green-6)",
              borderWidth: 2,
              background: "var(--mantine-color-green-light)",
            }
          : undefined
      }
    >
      <Stack gap={8}>
        <Group justify="space-between" wrap="nowrap">
          <Group gap="xs" wrap="nowrap">
            {chosen && (
              <Badge color="green" variant="filled" size="sm" tt="none">
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
          filtered={candidate.filtered}
        />

        {/* For a filtered candidate this string is the whole explanation —
            there is no score breakdown or spec table below it, because it was
            dropped before either was computed. Rendered inline rather than as
            tooltip-only text: it is the one thing a reviewer opened this row
            to read. */}
        {candidate.filtered && (
          <Alert
            color="orange"
            variant="light"
            p="xs"
            icon={<LuFilterX size={14} />}
          >
            <Text size="xs">
              Excluded by the {filterReasonLabel(candidate.filtered.reason)}{" "}
              filter:{" "}
              <Text span size="xs" fw={600} ff="monospace">
                {candidate.filtered.detail}
              </Text>
            </Text>
          </Alert>
        )}

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

/**
 * The scraped listing and — the part that matters — the product it sits on
 * *now*, read live rather than from the row's stored `resolvedProduct`. An
 * unrelated merge can move a listing after a decision was recorded, and acting
 * without noticing that is how a correction goes to the wrong product.
 */
function ListingPanel({ item }: { item: ResolutionListItem }) {
  const { resolution, state, listing } = item;
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

      {listing?.originalName && (
        <Text size="sm">
          <Text span c="dimmed" size="xs">
            listing title:{" "}
          </Text>
          {listing.originalName}
        </Text>
      )}

      {/* Both prices come from the cheapest offer on each side, so this is a
          like-for-like comparison with the product below. */}
      {listing?.price != null && (
        <Group gap="xs" align="baseline">
          <Text size="xs" c="dimmed">
            listing price:
          </Text>
          <ListingPrice listing={listing} />
        </Group>
      )}

      {(record.url ?? listing?.url) && (
        <Anchor
          href={record.url ?? listing?.url}
          target="_blank"
          size="xs"
          truncate
        >
          {record.url ?? listing?.url}
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
        <Group gap="xs" align="baseline">
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
          {current.price != null && (
            <Text size="sm" fw={600}>
              {formatPrice(current.price)}
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
