"use client";

import { useState } from "react";
import { Anchor, Button, Stack, Table, Text } from "@mantine/core";
import { sortBy } from "lodash";
import { Offer } from "@/models/offer";
import { ProductSourceRecord } from "@/models/product-source";
import { ProductSpecs } from "@/models/product-specs";

/**
 * Every offer on a product: shop, the offer's own variant specs, and its price
 * linking out to that listing.
 *
 * Side by side this is what decides a duplicate pair. Two products carrying the
 * *same* shop twice are far more suspicious than two that split one shop each;
 * a 53cm against a 48cm of the same bike is a variant, not a duplicate; and
 * prices an order of magnitude apart are usually two different bikes.
 */
interface OfferEntry {
  key: string;
  shop: string;
  variant: string;
  price: string | null;
  url?: string;
}

/** The offer's own specs — frame size, colour — values only, which is what distinguishes it. */
function variantOf(specs: ProductSpecs | undefined): string {
  if (!specs) return "";
  return Object.values(specs)
    .flatMap((value) => {
      if (value === undefined || value === null || value === "") return [];
      if (Array.isArray(value)) return value.length ? [value.join(" ")] : [];
      if (typeof value === "boolean") return [];
      return [String(value)];
    })
    .join(" · ");
}

function priceOf(offer: Offer): string | null {
  // Postgres numerics arrive as strings often enough to be worth the coercion.
  const value = Number(offer.price);
  if (!Number.isFinite(value) || value <= 0) return null;

  return new Intl.NumberFormat("hu-HU", {
    style: "currency",
    currency: offer.currency || "HUF",
    maximumFractionDigits: 0,
  }).format(value);
}

function entriesOf(sources: ProductSourceRecord[]): OfferEntry[] {
  const entries = sources.flatMap((record) => {
    // A record with no linked source is an admin's manual spec entry.
    const shop = record.source?.name ?? "manual entry";
    const offers = record.offers ?? [];

    // A listing with no offer still gets a row: it is a shop this product is
    // published in, which is half of what the comparison is asking.
    if (offers.length === 0) {
      return [
        { key: record.id, shop, variant: "", price: null, url: record.url },
      ];
    }

    return offers.map((offer) => ({
      key: offer.id,
      shop,
      variant: variantOf(offer.specs),
      price: priceOf(offer),
      // The offer's own URL is the variant's page where a shop has one, and
      // falls back to the listing the offer was scraped from.
      url: offer.url ?? record.url,
    }));
  });

  // By shop, then price, so the same shop lands on the same line in both
  // columns of a comparison and the eye can run across.
  return sortBy(entries, [(entry) => entry.shop, (entry) => entry.price ?? ""]);
}

/** Matches the spec badges' threshold, so a row's two collapsing lists agree. */
const COLLAPSED_COUNT = 4;

export function ProductOfferTable({
  sources,
  emptyLabel = "No listings.",
}: {
  sources?: ProductSourceRecord[];
  emptyLabel?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const entries = sources ? entriesOf(sources) : [];

  if (entries.length === 0) {
    return (
      <Text size="xs" c="dimmed">
        {emptyLabel}
      </Text>
    );
  }

  const hasMore = entries.length > COLLAPSED_COUNT;
  const visible =
    expanded || !hasMore ? entries : entries.slice(0, COLLAPSED_COUNT);

  return (
    <Stack gap={4} align="flex-start">
      {/* No header: three columns whose contents say what they are. */}
      <Table
        withRowBorders={false}
        verticalSpacing={2}
        horizontalSpacing={10}
        fz="xs"
      >
        <Table.Tbody>
          {visible.map((entry) => (
            <Table.Tr key={entry.key}>
              <Table.Td>
                <Text size="xs">{entry.shop}</Text>
              </Table.Td>
              <Table.Td>
                <Text size="xs" c="dimmed">
                  {entry.variant || "—"}
                </Text>
              </Table.Td>
              <Table.Td ta="right" style={{ whiteSpace: "nowrap" }}>
                {entry.url ? (
                  <Anchor
                    href={entry.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    size="xs"
                    fw={600}
                  >
                    {entry.price ?? "open listing"}
                  </Anchor>
                ) : (
                  <Text size="xs" fw={600} c="dimmed">
                    {entry.price ?? "—"}
                  </Text>
                )}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      {hasMore && (
        <Button
          size="compact-xs"
          variant="subtle"
          color="blue"
          onClick={() => setExpanded((open) => !open)}
        >
          {expanded ? "Hide" : `+${entries.length - COLLAPSED_COUNT} more`}
        </Button>
      )}
    </Stack>
  );
}
