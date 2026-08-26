"use client";

import { Avatar, Badge, Button, Card, Group, Stack, Text } from "@mantine/core";
import { Offer, OfferAvailability, OfferCondition } from "@/models/offer";
import { formatDate } from "@/utils/date";

const formatPrice = (price: number, currency: string): string => {
  try {
    return new Intl.NumberFormat("hu-HU", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${price} ${currency}`;
  }
};

const availabilityColor: Record<OfferAvailability, string> = {
  [OfferAvailability.in_stock]: "green",
  [OfferAvailability.out_of_stock]: "red",
  [OfferAvailability.preorder]: "yellow",
  [OfferAvailability.unknown]: "gray",
};

const availabilityLabel: Record<OfferAvailability, string> = {
  [OfferAvailability.in_stock]: "In stock",
  [OfferAvailability.out_of_stock]: "Out of stock",
  [OfferAvailability.preorder]: "Preorder",
  [OfferAvailability.unknown]: "Unknown",
};

const conditionLabel: Record<OfferCondition, string> = {
  [OfferCondition.new]: "New",
  [OfferCondition.used]: "Used",
  [OfferCondition.refurbished]: "Refurbished",
};

function OfferSpecsInline({ offer }: { offer: Offer }) {
  const entries = Object.entries(offer.specs ?? {}).filter(
    ([, value]) => value !== undefined && value !== null && value !== ""
  );

  if (!entries.length) {
    return null;
  }

  return (
    <Group gap={6}>
      {entries.map(([key, value]) => (
        <Badge key={key} variant="light" color="gray" size="md" tt="none">
          {key}: {Array.isArray(value) ? value.join(", ") : String(value)}
        </Badge>
      ))}
    </Group>
  );
}

// Row-based price-comparison layout, one row per seller offer — mirrors the
// public árukereső-style shop-list UI (seller | meta | price + CTA) so
// admins can sanity-check an offer against what shoppers see. `compact`
// shrinks avatar/padding/price size for use nested inside another card
// (e.g. a source card listing several offers) instead of as a standalone row.
export function OfferCard({
  offer,
  compact = false,
}: {
  offer: Offer;
  compact?: boolean;
}) {
  const usedDetails = [
    offer.mileageKm != null ? `${offer.mileageKm} km` : null,
    offer.batteryHealthPercent != null
      ? `${offer.batteryHealthPercent}% battery`
      : null,
    offer.purchaseDate ? `purchased ${offer.purchaseDate}` : null,
  ].filter(Boolean);

  return (
    <Card
      withBorder
      radius="sm"
      padding={compact ? "xs" : "sm"}
      bg="var(--mantine-color-body)"
      style={{ opacity: offer.active ? 1 : 0.6 }}
    >
      <Group justify="space-between" align="center" wrap="nowrap" gap="md">
        <Group gap="sm" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
          {!compact && (
            <Avatar radius="sm" size="md" color="initials">
              {offer.seller.name.slice(0, 2).toUpperCase()}
            </Avatar>
          )}

          <Stack gap={2} style={{ minWidth: 0 }}>
            <Group gap={6} wrap="wrap">
              <Text fw={600} size="sm">
                {offer.seller.name}
              </Text>
              {offer.seller.verified && (
                <Badge color="blue" variant="light" size="sm">
                  Verified
                </Badge>
              )}
              <Badge
                color={availabilityColor[offer.availability]}
                variant="light"
                size="sm"
              >
                {availabilityLabel[offer.availability]}
              </Badge>
              <Badge variant="outline" color="gray" size="sm">
                {conditionLabel[offer.condition]}
              </Badge>
              {!offer.active && (
                <Badge color="gray" variant="filled" size="sm">
                  Inactive
                </Badge>
              )}
            </Group>

            {!compact && offer.seller.location && (
              <Text size="xs" c="dimmed">
                {offer.seller.location}
              </Text>
            )}

            {usedDetails.length > 0 && (
              <Text size="xs" c="dimmed">
                {usedDetails.join(" · ")}
              </Text>
            )}

            <OfferSpecsInline offer={offer} />

            {!compact && offer.usedConditionNotes && (
              <Text size="xs" c="dimmed" lineClamp={1}>
                {offer.usedConditionNotes}
              </Text>
            )}

            <Text size="xs" c="dimmed">
              Updated {formatDate(offer.lastSeenAt) || "—"}
            </Text>
          </Stack>
        </Group>

        <Stack gap={4} align="flex-end" style={{ flexShrink: 0 }}>
          <Group gap={8} align="baseline" wrap="nowrap">
            {offer.priceWithoutDiscount != null && (
              <Text size="xs" c="dimmed" td="line-through">
                {formatPrice(offer.priceWithoutDiscount, offer.currency)}
              </Text>
            )}
            <Text fw={700} size={compact ? "md" : "lg"} style={{ whiteSpace: "nowrap" }}>
              {formatPrice(offer.price, offer.currency)}
            </Text>
          </Group>

          {offer.url ? (
            <Button
              component="a"
              href={offer.url}
              target="_blank"
              rel="noreferrer"
              size="xs"
              variant="filled"
            >
              View offer »
            </Button>
          ) : (
            <Button size="xs" variant="filled" disabled>
              No link
            </Button>
          )}
        </Stack>
      </Group>
    </Card>
  );
}
