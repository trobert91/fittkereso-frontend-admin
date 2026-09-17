"use client";

import { Button, Group, Text } from "@mantine/core";
import { sortBy } from "lodash";
import { FiExternalLink } from "react-icons/fi";
import { Offer } from "@/models/offer";
import { ProductSourceRecord } from "@/models/product-source";
import { ProductSpecs } from "@/models/product-specs";

/**
 * Every offer on a product as one row of small buttons — shop, the offer's own
 * variant specs, and its price — each opening that shop's page.
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

    // A listing with no offer still gets a button: it is a shop this product is
    // published in, which is half of what the comparison is asking.
    if (offers.length === 0) {
      return [{ key: record.id, shop, variant: "", price: null, url: record.url }];
    }

    return offers.map((offer) => ({
      key: offer.id,
      shop,
      variant: variantOf(offer.specs),
      price: priceOf(offer),
      url: offer.url ?? record.url,
    }));
  });

  // By shop, then price, so the same shop lands in the same place in both
  // columns of a comparison and the eye can run across.
  return sortBy(entries, [(entry) => entry.shop, (entry) => entry.price ?? ""]);
}

export function ProductOfferButtons({
  sources,
  emptyLabel = "No listings.",
}: {
  sources?: ProductSourceRecord[];
  emptyLabel?: string;
}) {
  const entries = sources ? entriesOf(sources) : [];

  if (entries.length === 0) {
    return (
      <Text size="xs" c="dimmed">
        {emptyLabel}
      </Text>
    );
  }

  return (
    <Group gap={6}>
      {entries.map((entry) => (
        <Button
          key={entry.key}
          component={entry.url ? "a" : "button"}
          href={entry.url}
          target={entry.url ? "_blank" : undefined}
          rel={entry.url ? "noreferrer noopener" : undefined}
          disabled={!entry.url}
          size="compact-xs"
          variant="light"
          color="gray"
          rightSection={entry.url ? <FiExternalLink size={10} /> : undefined}
          styles={{ label: { fontWeight: 400 } }}
        >
          <Text span size="xs" inherit>
            {entry.shop}
            {entry.variant ? `, ${entry.variant}` : ""}
          </Text>
          <Text span size="xs" c="dimmed" mx={5} inherit>
            |
          </Text>
          <Text span size="xs" fw={600} inherit>
            {entry.price ?? "no offer"}
          </Text>
        </Button>
      ))}
    </Group>
  );
}
