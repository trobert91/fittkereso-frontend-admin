"use client";

import {
  Anchor,
  Badge,
  Card,
  CopyButton,
  Divider,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { ReactNode } from "react";
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

function OfferCard({ offer }: { offer: Offer }) {
  return (
    <Card key={offer.id} withBorder radius="sm" padding="sm" bg="var(--mantine-color-default-hover)">
      <Stack gap="xs">
        <Group justify="space-between" align="flex-start">
          <Group gap="xs">
            <Text fw={600} size="sm">
              {offer.seller.name}
            </Text>
            {offer.seller.verified && (
              <Badge color="blue" variant="light" size="sm">
                Verified
              </Badge>
            )}
            {!offer.active && (
              <Badge color="gray" variant="outline" size="sm">
                Inactive
              </Badge>
            )}
          </Group>
          <Badge color={availabilityColor[offer.availability]} size="sm">
            {availabilityLabel[offer.availability]}
          </Badge>
        </Group>

        <Group gap="xs" align="baseline">
          <Text fw={700} size="lg">
            {formatPrice(offer.price, offer.currency)}
          </Text>
          <Badge variant="light" size="sm">
            {conditionLabel[offer.condition]}
          </Badge>
        </Group>

        {offer.seller.location && (
          <Text size="xs" c="dimmed">
            {offer.seller.location}
          </Text>
        )}

        {offer.url && (
          <Anchor
            href={offer.url}
            target="_blank"
            rel="noreferrer"
            size="sm"
            style={{ wordBreak: "break-all" }}
          >
            {offer.url}
          </Anchor>
        )}

        <SimpleGrid cols={2} spacing="sm">
          {offer.condition === OfferCondition.used && (
            <>
              {offer.mileageKm != null && (
                <SourceField label="Mileage">
                  <Text size="sm">{offer.mileageKm} km</Text>
                </SourceField>
              )}
              {offer.batteryHealthPercent != null && (
                <SourceField label="Battery health">
                  <Text size="sm">{offer.batteryHealthPercent}%</Text>
                </SourceField>
              )}
              {offer.purchaseDate && (
                <SourceField label="Purchase date">
                  <Text size="sm">{offer.purchaseDate}</Text>
                </SourceField>
              )}
            </>
          )}
          <SourceField label="Last seen">
            <Text size="sm">{formatDateTime(offer.lastSeenAt)}</Text>
          </SourceField>
        </SimpleGrid>

        {offer.usedConditionNotes && (
          <Text size="xs" c="dimmed">
            {offer.usedConditionNotes}
          </Text>
        )}
      </Stack>
    </Card>
  );
}

function SourceField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Stack gap={2}>
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
        {label}
      </Text>
      {children}
    </Stack>
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
    <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
      {sources.map((source) => {
        const canResync = Boolean(source.source) && Boolean(source.url);

        return (
          <Card key={source.id} withBorder radius="md" padding="md">
            <Stack gap="sm">
              <Group justify="space-between" align="flex-start">
                <Group gap="xs">
                  {source.source ? (
                    <Text fw={600}>{source.source.name}</Text>
                  ) : (
                    <Text fw={600} c="dimmed">
                      Manual
                    </Text>
                  )}
                  <Badge color={source.specValid ? "green" : "red"} size="sm">
                    {source.specValid ? "Valid" : "Invalid"}
                  </Badge>
                  {source.deduplicated && (
                    <Badge color="orange" variant="light" size="sm">
                      Deduplicated
                    </Badge>
                  )}
                </Group>

                <CopyButton value={source.id}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? "Copied!" : "Copy ID"} withArrow>
                      <Badge
                        color={copied ? "green" : "gray"}
                        variant="outline"
                        style={{ cursor: "pointer" }}
                        onClick={copy}
                      >
                        {source.id.slice(0, 8)}…
                      </Badge>
                    </Tooltip>
                  )}
                </CopyButton>
              </Group>

              {source.url && (
                <Anchor
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  size="sm"
                  style={{ wordBreak: "break-all" }}
                >
                  {source.url}
                </Anchor>
              )}

              {source.specErrors && Object.keys(source.specErrors).length ? (
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
                    style={{ cursor: "pointer", alignSelf: "flex-start" }}
                  >
                    {Object.keys(source.specErrors).length} spec error
                    {Object.keys(source.specErrors).length === 1 ? "" : "s"}
                  </Badge>
                </Tooltip>
              ) : null}

              <Divider />

              <SimpleGrid cols={2} spacing="sm">
                <SourceField label="External ID">
                  <Text size="sm">{source.externalId ?? "—"}</Text>
                </SourceField>

                <SourceField label="Source name">
                  <Text size="sm">{source.sourceName ?? "—"}</Text>
                </SourceField>

                <SourceField label="Normalized source name">
                  <Text size="sm">{source.normalizedSourceName ?? "—"}</Text>
                </SourceField>

                <SourceField label="Last updated">
                  <Text size="sm">{formatDateTime(source.lastUpdated)}</Text>
                </SourceField>
              </SimpleGrid>

              {source.offers && source.offers.length > 0 && (
                <>
                  <Divider label="Offers" labelPosition="left" />
                  <Stack gap="xs">
                    {source.offers.map((offer) => (
                      <OfferCard key={offer.id} offer={offer} />
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
    </SimpleGrid>
  );
}
