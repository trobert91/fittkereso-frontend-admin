"use client";

import { Anchor, Group, Stack, Text } from "@mantine/core";
import { sortBy } from "lodash";
import { FiExternalLink } from "react-icons/fi";
import { Offer } from "@/models/offer";
import { ProductSourceRecord } from "@/models/product-source";

/**
 * Which shops a product is sold in and for how much — one row per source
 * listing, linking out to the shop's own page.
 *
 * Side by side, this answers the question a duplicate pair really poses: two
 * products that each carry the same shop's listing are far more suspicious
 * than two that split one shop each, and two prices that differ by a factor of
 * ten are usually two different bikes.
 */
function priceOf(offers: Offer[] | undefined): string | null {
  const prices = (offers ?? [])
    // Postgres numerics arrive as strings often enough to be worth the coercion.
    .map((offer) => ({ value: Number(offer.price), currency: offer.currency }))
    .filter((offer) => Number.isFinite(offer.value) && offer.value > 0);

  if (prices.length === 0) return null;

  const cheapest = prices.reduce((low, offer) =>
    offer.value < low.value ? offer : low,
  );

  const formatted = new Intl.NumberFormat("hu-HU", {
    style: "currency",
    currency: cheapest.currency || "HUF",
    maximumFractionDigits: 0,
  }).format(cheapest.value);

  return prices.length > 1 ? `${formatted} (${prices.length} offers)` : formatted;
}

export function ProductSourceLinks({
  sources,
  emptyLabel = "No source listings.",
}: {
  sources?: ProductSourceRecord[];
  emptyLabel?: string;
}) {
  if (!sources || sources.length === 0) {
    return (
      <Text size="xs" c="dimmed">
        {emptyLabel}
      </Text>
    );
  }

  // By shop name, so the same shop lands on the same line in both columns of a
  // comparison and the eye can run across.
  const ordered = sortBy(sources, (record) => record.source?.name ?? "￿");

  return (
    <Stack gap={2}>
      {ordered.map((record) => {
        const price = priceOf(record.offers);
        // A record with no linked source is an admin's manual spec entry, and
        // has no shop page to open.
        const name = record.source?.name ?? "manual entry";

        return (
          <Group key={record.id} gap={6} wrap="nowrap" justify="space-between">
            {record.url ? (
              <Anchor
                href={record.url}
                target="_blank"
                rel="noreferrer noopener"
                size="xs"
                style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}
              >
                <Group gap={4} wrap="nowrap">
                  {name}
                  <FiExternalLink size={11} style={{ flexShrink: 0 }} />
                </Group>
              </Anchor>
            ) : (
              <Text size="xs" c="dimmed">
                {name}
              </Text>
            )}
            <Text size="xs" fw={500} style={{ whiteSpace: "nowrap" }}>
              {price ?? "—"}
            </Text>
          </Group>
        );
      })}
    </Stack>
  );
}
