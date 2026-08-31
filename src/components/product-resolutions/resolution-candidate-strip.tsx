"use client";

import { useMemo, useState } from "react";
import { Badge, Group, Stack, Text, Tooltip } from "@mantine/core";
import { orderBy } from "lodash";
import { LuPlus } from "react-icons/lu";
import {
  ProductResolutionCandidateRecord,
  ProductResolutionRecord,
  ResolutionListingSummary,
} from "@/api-actions/product/product-resolutions";
import { ProductDetailsModal } from "@/components/product/details-modal";
import { ResolutionListingCard, ResolutionProductCard } from "./resolution-product-card";
import { productLookup } from "./resolution-labels";

const STRIP_LIMIT = 2;

/**
 * The scraped listing on the left, the candidates it was matched against on the
 * right — the closed card's answer to "did the system pick the right product?".
 *
 * Candidates are ordered by match score and capped at the top two, with the one
 * the system actually chose badged. That is the comparison a reviewer makes:
 * not "is this candidate plausible" but "was it more plausible than the runner
 * up". A count badge stands in for the rest.
 */
export function ResolutionCandidateStrip({
  resolution,
  listing,
}: {
  resolution: ProductResolutionRecord;
  listing?: ResolutionListingSummary;
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

  const visible = ordered.slice(0, STRIP_LIMIT);
  const hiddenCount = Math.max(ordered.length - visible.length, 0);

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

  return (
    <>
      {/* `stretch` so every card in the row is the tallest one's height —
          cards carry different amounts of metadata (specs, gate badges, a
          price), and ragged bottoms make them read as unrelated rather than as
          a set being compared. */}
      <Group align="stretch" gap="md" wrap="wrap">
        <ResolutionListingCard
          listing={listing}
          title={listingTitle}
          subtitle={
            input?.category?.name ?? input?.categoryHint ?? undefined
          }
          lines={[
            resolution.sourceRecord?.source?.name,
            resolution.sourceRecord?.externalId
              ? `id: ${resolution.sourceRecord.externalId}`
              : undefined,
          ]}
        />

        {visible.length === 0 && (
          <Stack justify="center" px="md">
            <Text size="sm" c="dimmed">
              No candidates were recalled — a new product was created.
            </Text>
          </Stack>
        )}

        {visible.map((candidate) => (
          <CandidateCard
            key={candidate.candidateId}
            candidate={candidate}
            product={products[candidate.candidateId]}
            chosen={candidate.candidateId === chosenId}
            onOpen={() => setDetailProductId(candidate.candidateId)}
          />
        ))}

        {hiddenCount > 0 && (
          <Tooltip
            label={`${hiddenCount} further candidate${hiddenCount === 1 ? "" : "s"} scored below these — expand the card to see them all`}
            withArrow
          >
            <Badge
              color="gray"
              variant="light"
              size="sm"
              tt="none"
              leftSection={<LuPlus size={10} />}
              style={{ alignSelf: "center" }}
            >
              {hiddenCount} more
            </Badge>
          </Tooltip>
        )}
      </Group>

      <ProductDetailsModal
        productId={detailProductId}
        opened={detailProductId !== null}
        onClose={() => setDetailProductId(null)}
      />
    </>
  );
}

function CandidateCard({
  candidate,
  product,
  chosen,
  onOpen,
}: {
  candidate: ProductResolutionCandidateRecord;
  product?: ReturnType<typeof productLookup>[string];
  chosen: boolean;
  onOpen: () => void;
}) {
  const failedGates = candidate.gates?.failedGates ?? [];
  const passed = candidate.gates?.passed ?? false;
  const specs = candidate.specMatchDetails;

  return (
    <ResolutionProductCard
      product={product}
      fallbackName={
        candidate.displayName ?? candidate.model ?? candidate.candidateId
      }
      score={candidate.matchScore}
      scoreLabel={`match score: ${Math.round(candidate.matchScore ?? 0)} · recalled via ${candidate.source.split("_").join(" ")}`}
      dimmed={!chosen && !passed}
      selected={chosen}
      onClick={onOpen}
      badges={
        <>
          {chosen && (
            <Badge color="green" variant="filled" size="xs" tt="none">
              chosen
            </Badge>
          )}
          {passed ? (
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
        </>
      }
    />
  );
}
