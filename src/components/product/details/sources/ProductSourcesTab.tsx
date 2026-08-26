"use client";

import { useState } from "react";
import {
  Anchor,
  Badge,
  Button,
  Card,
  CopyButton,
  Group,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { selectProduct } from "@/store/slices/product-slice";
import { useAppSelector } from "@/store/store-hooks";
import { ProductSourceRecord, ScrapedProductSpec } from "@/models/product-source";
import { OrderedSpec, ProductSpecs } from "@/models/product-specs";
import { AdminSpecTable } from "../specs/AdminSpecTable";
import { OfferCard } from "../offers/OfferCard";
import { DeleteSourceButton } from "./DeleteSourceButton";
import { ResyncSourceButton } from "./ResyncSourceButton";
import { formatDate } from "@/utils/date";

// Reshapes a source's raw specs/specs into AdminSpecTable's input shape so
// the Specs/Raw specs panels below render with the exact same component
// (and visual language) as the "Specifications" tab.
function toOrderedSpecs(specs?: ProductSpecs): OrderedSpec[] {
  return Object.entries(specs ?? {})
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => ({ key, label: key, value }));
}

function toOrderedRawSpecs(rawSpecs?: ScrapedProductSpec[]): OrderedSpec[] {
  return (rawSpecs ?? []).map((spec, index) => ({
    key: `${spec.name}-${index}`,
    label: spec.sectionTitle ? `${spec.sectionTitle} / ${spec.name}` : spec.name,
    value: spec.values?.length ? spec.values.join(", ") : (spec.description ?? "—"),
  }));
}

// Toggles a value in/out of an open-panels array — drives which of the
// Specs/Raw specs panels the header buttons currently reveal.
function togglePanel(open: string[], panel: string): string[] {
  return open.includes(panel) ? open.filter((v) => v !== panel) : [...open, panel];
}

function ProductSourceCard({
  source,
  productId,
}: {
  source: ProductSourceRecord;
  productId: string;
}) {
  const [openSpecs, setOpenSpecs] = useState<string[]>([]);

  const canResync = Boolean(source.source) && Boolean(source.url);
  const scraped = source.scrapedProduct;
  const errorCount = source.specErrors ? Object.keys(source.specErrors).length : 0;
  const offers = source.offers ?? [];

  const orderedSpecs = toOrderedSpecs(scraped?.specs);
  const orderedRawSpecs = toOrderedRawSpecs(scraped?.rawSpecs);

  return (
    <Card withBorder radius="sm" padding="sm">
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
          <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
            <Group gap={6} wrap="wrap">
              {source.source ? (
                <Text fw={600} size="sm">
                  {source.source.name}
                </Text>
              ) : (
                <Text fw={600} size="sm" c="dimmed">
                  Manual entry
                </Text>
              )}
              <Badge color={source.specValid ? "green" : "red"} variant="light" size="sm">
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
              <CopyButton value={source.id}>
                {({ copied, copy }) => (
                  <Tooltip label={copied ? "Copied!" : "Copy ID"} withArrow>
                    <Badge
                      color={copied ? "green" : "gray"}
                      variant="outline"
                      size="sm"
                      style={{ cursor: "pointer" }}
                      onClick={copy}
                    >
                      {source.id.slice(0, 8)}…
                    </Badge>
                  </Tooltip>
                )}
              </CopyButton>
            </Group>

            {scraped?.displayName && (
              <Text size="sm" fw={500} lineClamp={1}>
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
                  {[scraped?.brand, scraped?.model].filter(Boolean).join(" · ")}
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
                Updated {formatDate(source.lastUpdated) || "—"}
              </Text>
            </Group>
          </Stack>

          <Group gap="xs" style={{ flexShrink: 0 }} wrap="nowrap">
            {orderedSpecs.length > 0 && (
              <Button
                variant={openSpecs.includes("specs") ? "filled" : "default"}
                size="xs"
                onClick={() => setOpenSpecs((open) => togglePanel(open, "specs"))}
              >
                Specs ({orderedSpecs.length})
              </Button>
            )}
            {orderedRawSpecs.length > 0 && (
              <Button
                variant={openSpecs.includes("rawSpecs") ? "filled" : "default"}
                size="xs"
                onClick={() => setOpenSpecs((open) => togglePanel(open, "rawSpecs"))}
              >
                Raw specs ({orderedRawSpecs.length})
              </Button>
            )}
            {canResync && source.url ? (
              <ResyncSourceButton
                productId={productId}
                sourceRecordId={source.id}
                sourceUrl={source.url}
              />
            ) : null}
            <DeleteSourceButton productId={productId} sourceId={source.id} />
          </Group>
        </Group>

        {openSpecs.includes("specs") && orderedSpecs.length > 0 && (
          <AdminSpecTable specs={orderedSpecs} />
        )}

        {openSpecs.includes("rawSpecs") && orderedRawSpecs.length > 0 && (
          <AdminSpecTable specs={orderedRawSpecs} />
        )}

        {offers.length > 0 && (
          <Stack gap="xs">
            {offers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} compact />
            ))}
          </Stack>
        )}
      </Stack>
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
      {sources.map((source) => (
        <ProductSourceCard key={source.id} source={source} productId={product.id} />
      ))}
    </Stack>
  );
}
