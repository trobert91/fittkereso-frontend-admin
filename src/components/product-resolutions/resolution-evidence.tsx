"use client";

import {
  Alert,
  Anchor,
  Badge,
  Divider,
  Group,
  Stack,
  Text,
} from "@mantine/core";
import Link from "next/link";
import { isEmpty } from "lodash";
import { IoWarning } from "react-icons/io5";
import { ResolutionListItem } from "@/api-actions/product/product-resolutions";
import { formatDate } from "@/utils/date";
import { routes } from "@/utils/routes";
import { SpecMatchTable } from "./spec-match-table";
import { ListingPrice, formatPrice } from "./resolution-product-card";

/**
 * What is left behind the expander once the candidates moved out.
 *
 * "Candidates considered" used to live here as a second, deeper rendering of the
 * same list the closed card showed as tiles. It is now one component —
 * `ResolutionCandidatePanel` — that switches shape on `expanded`, so opening the
 * row deepens the comparison in place instead of restating it further down.
 * "Inputs" likewise sits in the always-visible area.
 *
 * This block is the remainder: the pair's spec comparison, and where the listing
 * actually lives now.
 */
export function ResolutionEvidence({ item }: { item: ResolutionListItem }) {
  const { resolution } = item;

  // Plain blocks rather than Card.Sections: this renders inside a Collapse on
  // the card, and Card.Section's negative margins do not survive being nested
  // in one. The caller supplies the section chrome.
  return (
    // `pt="lg"` rather than a symmetric `py`: the caller's section border sits
    // directly above the first heading, and matching the inter-section rhythm
    // there is what keeps the first heading from reading as glued to it.
    <Stack gap="lg" pt="lg" pb="md">
      {resolution.flow === "duplicate_detection" && (
        <>
          <EvidenceSection title="Spec comparison">
            <SpecMatchTable
              details={resolution.specMatchDetails}
              labelA={resolution.productA?.displayName ?? "A"}
              labelB={resolution.productB?.displayName ?? "B"}
            />
          </EvidenceSection>
          <Divider />
        </>
      )}

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
