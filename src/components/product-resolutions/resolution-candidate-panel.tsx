"use client";

import { useMemo, useState } from "react";
import {
  Alert,
  Anchor,
  Badge,
  Box,
  CopyButton,
  Divider,
  Group,
  Image,
  Progress,
  SimpleGrid,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import Link from "next/link";
import { isEmpty, orderBy } from "lodash";
import { LuExternalLink, LuFilterX } from "react-icons/lu";
import {
  MatchResultComponents,
  ProductResolutionCandidateRecord,
  ProductResolutionRecord,
  ResolutionListingSummary,
} from "@/api-actions/product/product-resolutions";
import { ProductDetailsModal } from "@/components/product/details-modal";
import { ProductModel } from "@/models/product-model";
import { routes } from "@/utils/routes";
import { SpecMatchTable } from "./spec-match-table";
import {
  ResolutionListingCard,
  ResolutionProductCard,
} from "./resolution-product-card";
import { filterReasonLabel, productLookup } from "./resolution-labels";

/** Grid tiles shown before the card is expanded. Two candidates plus the
 *  listing is the comparison a reviewer actually makes — "was the winner more
 *  plausible than the runner-up" — and the rest are a count. */
const CLOSED_LIMIT = 2;

/**
 * The open state's image box. Deliberately smaller than the closed tile's on
 * both axes — and sized independently of it, so widening the tile to fit fewer
 * per row does not also inflate every expanded row.
 *
 * The row is wide, and a picture big enough to dominate it would push the
 * evidence that earns the expansion off the first screen.
 */
const OPEN_IMAGE_WIDTH = 190;
const OPEN_IMAGE_HEIGHT = 140;

/**
 * The candidates, in the two shapes the card needs.
 *
 * Closed, it is a grid of tiles: the listing beside the top candidates, which
 * answers "did the system pick the right product?" at a glance. Opened, each
 * candidate becomes a full-width row split in two — identity on the left
 * (picture, name, gates, spec count, the badges the tile carried) and the
 * evidence on the right (score breakdown, filter reason, spec table).
 *
 * One component rather than two because the closed and open states are the same
 * list at different depths, and keeping them apart is what let the tile and the
 * detail row drift into disagreeing about which candidate was chosen.
 */
export function ResolutionCandidatePanel({
  resolution,
  listing,
  candidateImageUrls,
  expanded,
}: {
  resolution: ProductResolutionRecord;
  listing?: ResolutionListingSummary;
  /** `productId => imageUrl`, shipped alongside the row because a stored
   *  candidate carries only its id — there is no product object to read a
   *  picture off for anything but the chosen one. */
  candidateImageUrls?: Record<string, string>;
  expanded: boolean;
}) {
  const [detailProductId, setDetailProductId] = useState<string | null>(null);

  const products = useMemo(() => productLookup(resolution), [resolution]);
  const chosenId = resolution.resolvedProduct?.id;

  const ordered = useMemo(
    () =>
      orderBy(
        resolution.candidates ?? [],
        [
          // The chosen candidate leads regardless of score — it is the decision
          // under review, and burying it under a higher-scoring runner-up would
          // hide exactly the case worth looking at.
          (candidate) => (candidate.candidateId === chosenId ? 1 : 0),
          (candidate) => candidate.matchScore ?? 0,
        ],
        ["desc", "desc"],
      ),
    [resolution.candidates, chosenId],
  );

  const input =
    resolution.inputSnapshot?.kind === "product_resolution"
      ? resolution.inputSnapshot.input
      : undefined;
  const scraped = resolution.sourceRecord?.scrapedProduct;

  const listingTitle =
    [input?.brand, input?.model].filter(Boolean).join(" ") ||
    input?.displayName ||
    scraped?.displayName ||
    scraped?.model ||
    "unknown listing";

  const listingCard = (
    <ResolutionListingCard
      listing={listing}
      title={listingTitle}
      subtitle={input?.category?.name ?? input?.categoryHint ?? undefined}
      lines={[
        resolution.sourceRecord?.source?.name,
        resolution.sourceRecord?.externalId
          ? `id: ${resolution.sourceRecord.externalId}`
          : undefined,
      ]}
    />
  );

  const empty = isEmpty(ordered);
  const visible = expanded ? ordered : ordered.slice(0, CLOSED_LIMIT);
  const hiddenCount = ordered.length - visible.length;
  const hiddenFiltered = ordered
    .slice(visible.length)
    .filter((candidate) => candidate.filtered).length;

  return (
    <>
      <Stack gap="md">
        {/* The listing keeps its tile in both states. It is the thing every
            candidate is being compared *to*, so turning it into a row of its
            own would put the comparison on two different axes. */}
        <Group align="stretch" gap="md" wrap="wrap">
          {listingCard}

          {empty && (
            <Stack justify="center" px="md">
              <Text size="sm" c="dimmed">
                No candidates were recalled — a new product was created.
              </Text>
            </Stack>
          )}

          {!expanded &&
            visible.map((candidate) => (
              <CandidateTile
                key={candidate.candidateId}
                candidate={candidate}
                product={products[candidate.candidateId]}
                imageUrl={candidateImageUrls?.[candidate.candidateId]}
                chosen={candidate.candidateId === chosenId}
                onOpen={() => setDetailProductId(candidate.candidateId)}
              />
            ))}

          {!expanded && hiddenCount > 0 && (
            <Tooltip
              // "scored below" would be a false description of a filtered
              // candidate, which was dropped before it was ever scored.
              label={`${hiddenCount} further candidate${hiddenCount === 1 ? "" : "s"} ${hiddenFiltered > 0 ? "did not make the cut" : "scored below these"} — expand the card to see them all`}
              withArrow
            >
              <Badge
                color="gray"
                variant="light"
                size="sm"
                tt="none"
                style={{ alignSelf: "center" }}
              >
                +{hiddenCount} more
              </Badge>
            </Tooltip>
          )}
        </Group>

        {expanded && !empty && (
          <Stack gap="sm">
            {visible.map((candidate) => (
              <CandidateRow
                key={candidate.candidateId}
                candidate={candidate}
                product={products[candidate.candidateId]}
                imageUrl={candidateImageUrls?.[candidate.candidateId]}
                chosen={candidate.candidateId === chosenId}
                onOpen={() => setDetailProductId(candidate.candidateId)}
              />
            ))}
          </Stack>
        )}
      </Stack>

      <ProductDetailsModal
        productId={detailProductId}
        opened={detailProductId !== null}
        onClose={() => setDetailProductId(null)}
      />
    </>
  );
}

/** The badges both shapes carry, so the tile and the row cannot disagree about
 *  what a candidate is. */
function CandidateBadges({
  candidate,
  chosen,
}: {
  candidate: ProductResolutionCandidateRecord;
  chosen: boolean;
}) {
  const failedGates = candidate.gates?.failedGates ?? [];
  const passed = candidate.gates?.passed ?? false;
  const specs = candidate.specMatchDetails;
  const filtered = candidate.filtered;

  return (
    <>
      {chosen && (
        <Badge color="green" variant="filled" size="xs" tt="none">
          chosen
        </Badge>
      )}

      {filtered ? (
        <Tooltip label={filtered.detail} withArrow multiline maw={320}>
          <Badge color="orange" variant="light" size="xs" tt="none">
            filtered · {filterReasonLabel(filtered.reason)}
          </Badge>
        </Tooltip>
      ) : passed ? (
        <Badge color="green" variant="light" size="xs" tt="none">
          gates passed
        </Badge>
      ) : (
        <Tooltip
          label={
            failedGates.length
              ? failedGates.map((gate) => gate.split("_").join(" ")).join(", ")
              : "not accepted"
          }
          withArrow
        >
          <Badge color="red" variant="light" size="xs" tt="none">
            {failedGates.length
              ? `${failedGates.length} gate${failedGates.length === 1 ? "" : "s"} failed`
              : "not accepted"}
          </Badge>
        </Tooltip>
      )}

      {specs && specs.comparableCount > 0 && (
        <Badge
          color={specs.primaryMismatches > 0 ? "red" : "gray"}
          variant="light"
          size="xs"
          tt="none"
        >
          {specs.matchingCount}/{specs.comparableCount} specs
        </Badge>
      )}

      <Tooltip label="How this candidate was recalled into the comparison." withArrow>
        <Badge color="gray" variant="outline" size="xs" tt="none">
          {candidate.source.split("_").join(" ")}
        </Badge>
      </Tooltip>
    </>
  );
}

/** Closed state: one candidate as a grid tile. */
function CandidateTile({
  candidate,
  product,
  imageUrl,
  chosen,
  onOpen,
}: {
  candidate: ProductResolutionCandidateRecord;
  product?: ProductModel;
  imageUrl?: string;
  chosen: boolean;
  onOpen: () => void;
}) {
  const passed = candidate.gates?.passed ?? false;

  return (
    <ResolutionProductCard
      product={product}
      imageUrl={imageUrl}
      productId={candidate.candidateId}
      fallbackName={
        candidate.displayName ?? candidate.model ?? candidate.candidateId
      }
      score={candidate.matchScore}
      scoreLabel={`match score: ${Math.round(candidate.matchScore ?? 0)} · recalled via ${candidate.source.split("_").join(" ")}`}
      // Filtered candidates stay at full opacity despite having lost. Dimming
      // is for "considered and outscored"; a candidate excluded on a single
      // contradiction is the one worth a second look when the filter is the
      // thing that got it wrong.
      dimmed={!chosen && !passed && !candidate.filtered}
      selected={chosen}
      onClick={onOpen}
      badges={<CandidateBadges candidate={candidate} chosen={chosen} />}
    />
  );
}

/**
 * Open state: one candidate per row, identity left, evidence right.
 *
 * The split is the point. Everything on the left answers "which product is
 * this?" and is the same set of facts the closed tile shows; everything on the
 * right is what the matcher *derived* and is the reason the row was expanded.
 * Reading down the left column compares products, down the right compares
 * evidence — neither of which the old single-column detail list allowed.
 */
function CandidateRow({
  candidate,
  product,
  imageUrl: candidateImageUrl,
  chosen,
  onOpen,
}: {
  candidate: ProductResolutionCandidateRecord;
  product?: ProductModel;
  imageUrl?: string;
  chosen: boolean;
  onOpen: () => void;
}) {
  const name =
    product?.displayName ??
    candidate.displayName ??
    candidate.model ??
    candidate.candidateId;

  // The loaded product wins when there is one — it is only ever the chosen
  // candidate, and its relations are already hydrated. Everything else falls
  // back to the id-keyed map, which is the only picture those candidates have.
  const imageUrl =
    product?.mainImage?.url ??
    product?.images?.find((img) => !!img.url)?.url ??
    candidateImageUrl;

  const hasEvidence =
    !!candidate.matchComponents ||
    !!candidate.specMatchDetails ||
    !!candidate.filtered;

  return (
    <Box
      p="sm"
      style={{
        borderRadius: "var(--mantine-radius-sm)",
        border: chosen
          ? "2px solid var(--mantine-color-green-6)"
          : "1px solid var(--mantine-color-dark-4)",
        background: chosen ? "var(--mantine-color-green-light)" : "transparent",
      }}
    >
      <SimpleGrid
        cols={{ base: 1, sm: 2 }}
        spacing="md"
      >
        {/* Left: which product is this? */}
        <Stack gap={8}>
          <Group gap="sm" wrap="nowrap" align="flex-start">
            <Box
              style={{
                width: OPEN_IMAGE_WIDTH,
                height: OPEN_IMAGE_HEIGHT,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--mantine-color-dark-7)",
                borderRadius: "var(--mantine-radius-xs)",
                overflow: "hidden",
                cursor: "pointer",
              }}
              onClick={onOpen}
            >
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={name}
                  h={OPEN_IMAGE_HEIGHT}
                  w={OPEN_IMAGE_WIDTH}
                  fit="contain"
                />
              ) : (
                <Text size="xs" c="dimmed">
                  no image
                </Text>
              )}
            </Box>

            <Stack gap={6} style={{ minWidth: 0, flex: 1 }}>
              <Group gap={6} wrap="nowrap" align="center">
                <Anchor size="sm" fw={600} onClick={onOpen} component="button" ta="left">
                  {name}
                </Anchor>
                <Anchor
                  component={Link}
                  href={routes.products.details(candidate.candidateId)}
                  target="_blank"
                  style={{ display: "inline-flex", flexShrink: 0 }}
                >
                  <LuExternalLink size={12} />
                </Anchor>
              </Group>

              {(product?.brand?.name ??
                candidate.brand ??
                product?.productCategory?.name) && (
                <Text size="xs" c="dimmed" lineClamp={1}>
                  {[
                    product?.brand?.name ?? candidate.brand,
                    product?.productCategory?.name,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </Text>
              )}

              <CopyButton value={candidate.candidateId}>
                {({ copied, copy }) => (
                  <Tooltip
                    label={copied ? "Copied" : "Copy product ID"}
                    withArrow
                  >
                    <Badge
                      variant="outline"
                      size="xs"
                      color={copied ? "green" : "gray"}
                      tt="none"
                      ff="monospace"
                      w="fit-content"
                      style={{ cursor: "pointer" }}
                      onClick={copy}
                    >
                      {candidate.candidateId}
                    </Badge>
                  </Tooltip>
                )}
              </CopyButton>

              {product?.price != null && (
                <Text size="sm" fw={700}>
                  {product.price.toLocaleString("hu-HU")}
                </Text>
              )}

              {candidate.matchScore !== undefined && (
                <Group gap={6} wrap="nowrap" align="center">
                  <Progress
                    value={Math.max(0, Math.min(100, candidate.matchScore))}
                    size="sm"
                    radius="sm"
                    style={{ flex: 1 }}
                  />
                  <Text size="xs" c="dimmed" style={{ minWidth: 22, textAlign: "right" }}>
                    {Math.round(candidate.matchScore)}
                  </Text>
                </Group>
              )}

              <Group gap={4} wrap="wrap">
                <CandidateBadges candidate={candidate} chosen={chosen} />
              </Group>
            </Stack>
          </Group>
        </Stack>

        {/* Right: what the matcher derived. */}
        <Stack gap={8} style={{ minWidth: 0 }}>
          {/* For a filtered candidate this string is the whole explanation —
              there is no score breakdown or spec table below it, because it was
              dropped before either was computed. */}
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
              {candidate.matchComponents && <Divider />}
              <SpecMatchTable
                details={candidate.specMatchDetails}
                labelA="listing"
                labelB={name}
              />
            </>
          )}

          {!hasEvidence && (
            <Text size="xs" c="dimmed">
              Nothing was derived for this candidate — it carries no score
              breakdown or spec comparison.
            </Text>
          )}
        </Stack>
      </SimpleGrid>
    </Box>
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
          <Text size="xs" c="dimmed" style={{ minWidth: 110 }}>
            {bar.label}
          </Text>
          <Progress
            value={Math.max(0, Math.min(100, bar.value * 100))}
            size="sm"
            radius="sm"
            style={{ flex: 1 }}
          />
          <Text size="xs" c="dimmed" style={{ minWidth: 26, textAlign: "right" }}>
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
