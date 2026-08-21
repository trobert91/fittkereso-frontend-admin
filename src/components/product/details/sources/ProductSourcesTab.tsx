"use client";

import {
  Anchor,
  Avatar,
  Badge,
  Button,
  Card,
  CopyButton,
  Divider,
  Group,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { selectProduct } from "@/store/slices/product-slice";
import { useAppSelector } from "@/store/store-hooks";
import { Offer, OfferAvailability, OfferCondition } from "@/models/offer";
import { DeleteSourceButton } from "./DeleteSourceButton";
import { ResyncSourceButton } from "./ResyncSourceButton";

const formatDateTime = (value?: string): string => {
  if (!value) {
    return "—";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleString();
};

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
        <Badge key={key} variant="light" color="gray" size="xs" tt="none">
          {key}: {Array.isArray(value) ? value.join(", ") : String(value)}
        </Badge>
      ))}
    </Group>
  );
}

// Row-based price-comparison layout, one row per seller offer — mirrors the
// public árukereső-style shop-list UI (seller | meta | price + CTA) so
// admins can sanity-check a source's offers against what shoppers see.
function OfferRow({ offer }: { offer: Offer }) {
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
      padding="sm"
      bg="var(--mantine-color-body)"
      style={{ opacity: offer.active ? 1 : 0.6 }}
    >
      <Group justify="space-between" align="center" wrap="nowrap" gap="md">
        <Group gap="sm" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
          <Avatar radius="sm" size="md" color="initials">
            {offer.seller.name.slice(0, 2).toUpperCase()}
          </Avatar>

          <Stack gap={2} style={{ minWidth: 0 }}>
            <Group gap={6} wrap="wrap">
              <Text fw={600} size="sm">
                {offer.seller.name}
              </Text>
              {offer.seller.verified && (
                <Badge color="blue" variant="light" size="xs">
                  Verified
                </Badge>
              )}
              <Badge
                color={availabilityColor[offer.availability]}
                variant="light"
                size="xs"
              >
                {availabilityLabel[offer.availability]}
              </Badge>
              <Badge variant="outline" color="gray" size="xs">
                {conditionLabel[offer.condition]}
              </Badge>
              {!offer.active && (
                <Badge color="gray" variant="filled" size="xs">
                  Inactive
                </Badge>
              )}
            </Group>

            {offer.seller.location && (
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

            {offer.usedConditionNotes && (
              <Text size="xs" c="dimmed" lineClamp={1}>
                {offer.usedConditionNotes}
              </Text>
            )}

            <Text size="xs" c="dimmed">
              Last seen {formatDateTime(offer.lastSeenAt)}
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
            <Text fw={700} size="lg" style={{ whiteSpace: "nowrap" }}>
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

export function ProductSourcesTab() {
  const product = useAppSelector(selectProduct);

  if (!product) {
    return null;
  }

  const sources = product.sources ?? [];

  if (!sources.length) {
    return <Text c="dimmed">No sources</Text>;
  }

  return (
    <Stack gap="md">
      {sources.map((source) => {
        const canResync = Boolean(source.source) && Boolean(source.url);
        const scraped = source.scrapedProduct;
        const errorCount = source.specErrors
          ? Object.keys(source.specErrors).length
          : 0;

        return (
          <Card key={source.id} withBorder radius="md" padding="md">
            <Stack gap="sm">
              {/* Identity strip — mirrors the shop/product header of a price-comparison row */}
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Stack gap={2} style={{ minWidth: 0 }}>
                  <Group gap={8} wrap="wrap">
                    {source.source ? (
                      <Text fw={700} size="sm">
                        {source.source.name}
                      </Text>
                    ) : (
                      <Text fw={700} size="sm" c="dimmed">
                        Manual entry
                      </Text>
                    )}
                    <Badge
                      color={source.specValid ? "green" : "red"}
                      variant="light"
                      size="sm"
                    >
                      {source.specValid ? "Valid" : "Invalid"}
                    </Badge>
                    {source.deduplicated && (
                      <Badge color="orange" variant="light" size="sm">
                        Deduplicated
                      </Badge>
                    )}
                    {errorCount > 0 && (
                      <Tooltip
                        label={
                          <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                            {JSON.stringify(source.specErrors, null, 2)}
                          </pre>
                        }
                        multiline
                        w={400}
                        withArrow
                      >
                        <Badge
                          color="red"
                          variant="light"
                          size="sm"
                          style={{ cursor: "pointer" }}
                        >
                          {errorCount} spec error{errorCount === 1 ? "" : "s"}
                        </Badge>
                      </Tooltip>
                    )}
                  </Group>

                  {scraped?.displayName && (
                    <Text size="md" fw={600} lineClamp={1}>
                      {source.url ? (
                        <Anchor
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          underline="hover"
                          c="inherit"
                        >
                          {scraped.displayName}
                        </Anchor>
                      ) : (
                        scraped.displayName
                      )}
                    </Text>
                  )}

                  <Group gap={12} wrap="wrap">
                    {(scraped?.brand || scraped?.model) && (
                      <Text size="xs" c="dimmed">
                        {[scraped?.brand, scraped?.model]
                          .filter(Boolean)
                          .join(" · ")}
                      </Text>
                    )}
                    {scraped?.releaseYear && (
                      <Text size="xs" c="dimmed">
                        Released {scraped.releaseYear}
                      </Text>
                    )}
                    {source.externalId && (
                      <Text size="xs" c="dimmed">
                        SKU {source.externalId}
                      </Text>
                    )}
                    <Text size="xs" c="dimmed">
                      Updated {formatDateTime(source.lastUpdated)}
                    </Text>
                  </Group>
                </Stack>

                <CopyButton value={source.id}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? "Copied!" : "Copy ID"} withArrow>
                      <Badge
                        color={copied ? "green" : "gray"}
                        variant="outline"
                        style={{ cursor: "pointer", flexShrink: 0 }}
                        onClick={copy}
                      >
                        {source.id.slice(0, 8)}…
                      </Badge>
                    </Tooltip>
                  )}
                </CopyButton>
              </Group>

              {source.offers && source.offers.length > 0 && (
                <>
                  <Divider label="Offers" labelPosition="left" />
                  <Stack gap="xs">
                    {source.offers.map((offer) => (
                      <OfferRow key={offer.id} offer={offer} />
                    ))}
                  </Stack>
                </>
              )}

              <Divider />

              <Group gap="xs" justify="flex-end">
                {canResync && source.url ? (
                  <ResyncSourceButton
                    productId={product.id}
                    sourceRecordId={source.id}
                    sourceUrl={source.url}
                  />
                ) : null}
                <DeleteSourceButton productId={product.id} sourceId={source.id} />
              </Group>
            </Stack>
          </Card>
        );
      })}
    </Stack>
  );
}
