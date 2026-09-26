"use client";

import Link from "next/link";
import {
  Anchor,
  Badge,
  Card,
  Group,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { selectProduct } from "@/store/slices/product-slice";
import { useAppSelector } from "@/store/store-hooks";
import { Offer } from "@/models/offer";
import { SpecDefinitionJsonSchema } from "@/models/product-specs";
import { routes } from "@/utils/routes";
import { availabilityBadge, OfferCard } from "../offers/OfferCard";
import { ListingCard } from "./ListingCard";
import { formatMoney, groupListingsByShop, ShopGroup } from "./listing-fields";
import { SectionTitle } from "./ListingFieldTables";

// The shop's composed offers on this product, on the shop's header line, so
// the result stays visible while every source below it is closed.
function ShopOfferSummary({ offers }: { offers: Offer[] }) {
  if (!offers.length) {
    return (
      <Text size="xs" c="dimmed">
        No offer
      </Text>
    );
  }

  if (offers.length > 1) {
    const cheapest = offers.reduce((min, offer) =>
      offer.price < min.price ? offer : min
    );
    return (
      <Text size="sm">
        {offers.length} offers · from{" "}
        <b>{formatMoney(cheapest.price, cheapest.currency)}</b>
      </Text>
    );
  }

  const [offer] = offers;
  const availability = availabilityBadge(offer.availability);
  return (
    <Group gap={8} wrap="nowrap">
      {offer.priceWithoutDiscount != null && (
        <Text size="xs" c="dimmed" td="line-through">
          {formatMoney(offer.priceWithoutDiscount, offer.currency)}
        </Text>
      )}
      <Text size="sm" fw={700}>
        {formatMoney(offer.price, offer.currency)}
      </Text>
      <Badge size="sm" variant="light" color={availability.color}>
        {availability.label}
      </Badge>
    </Group>
  );
}

/**
 * One box per seller: its name and its composed offer on top, and each of its
 * sources inside as a box of its own, closed, highest priority first.
 */
function ShopSection({
  group,
  productId,
  schema,
  offers,
  unpricedOffers,
}: {
  group: ShopGroup;
  productId: string;
  schema: SpecDefinitionJsonSchema | undefined;
  // The shop's offers on this product.
  offers: Offer[];
  // Those of them that no source supplied the price of.
  unpricedOffers: Offer[];
}) {
  const count = group.listings.length;

  return (
    <Card withBorder radius="md" padding="sm" shadow="xs">
      <Card.Section withBorder inheritPadding py="xs">
        <Group justify="space-between" align="center" gap="sm">
          <Group gap="xs" align="center">
            {group.sellerId ? (
              <Anchor
                component={Link}
                href={routes.sellers.details(group.sellerId)}
                fw={700}
              >
                {group.name}
              </Anchor>
            ) : (
              <Text fw={700} c={group.manual ? "dimmed" : undefined}>
                {group.name}
              </Text>
            )}
            {!group.manual && (
              <Tooltip
                label="The shop's offers are composed field by field from its sources, highest priority first. A field a source does not read is left to the others."
                multiline
                w={320}
                withArrow
                disabled={count < 2}
              >
                <Badge variant="default" size="sm" tt="none">
                  {count} source{count === 1 ? "" : "s"}
                </Badge>
              </Tooltip>
            )}
          </Group>
          {!group.manual && <ShopOfferSummary offers={offers} />}
        </Group>
      </Card.Section>

      <Card.Section
        inheritPadding
        py="sm"
        bg="var(--mantine-color-default-hover)"
      >
        <Stack gap="xs">
          {group.listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              productId={productId}
              schema={schema}
            />
          ))}

          {unpricedOffers.length > 0 && (
            <Stack gap={6}>
              <SectionTitle>Offers not priced from any source</SectionTitle>
              {unpricedOffers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} compact />
              ))}
            </Stack>
          )}
        </Stack>
      </Card.Section>
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

  const schema = product.productCategory?.jsonSchema;
  const offers = product.offers ?? [];
  const pricedOfferIds = new Set(
    sources.flatMap((source) => (source.offers ?? []).map((offer) => offer.id))
  );
  const offersOf = (group: ShopGroup) =>
    group.sellerId
      ? offers.filter((offer) => offer.seller?.id === group.sellerId)
      : [];

  return (
    <Stack gap="sm">
      {groupListingsByShop(sources).map((group) => (
        <ShopSection
          key={group.key}
          group={group}
          productId={product.id}
          schema={schema}
          offers={offersOf(group)}
          unpricedOffers={offersOf(group).filter(
            (offer) => !pricedOfferIds.has(offer.id)
          )}
        />
      ))}
    </Stack>
  );
}
