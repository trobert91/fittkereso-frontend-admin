"use client";

import { useState } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  CopyButton,
  Group,
  Modal,
  SimpleGrid,
  Spoiler,
  Stack,
  Text,
  Title,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { selectProduct } from "@/store/slices/product-slice";
import { useAppSelector } from "@/store/store-hooks";
import { ProductSourceRecord, ScrapedProductSpec } from "@/models/product-source";
import { sortBy } from "lodash";
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

// Small thumbnail that opens the full-size scraped image in a modal on
// click, instead of navigating away to the source-shop's own image URL.
function SourceImageThumbnail({ url }: { url: string }) {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <UnstyledButton onClick={open} style={{ cursor: "zoom-in" }}>
        <Box
          style={{
            position: "relative",
            width: 48,
            height: 48,
            borderRadius: 6,
            overflow: "hidden",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- scraped
              images live on arbitrary source-shop hosts, not the CDN
              domains next/image is configured to allow */}
          <img
            src={url}
            alt="Scraped product"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
        </Box>
      </UnstyledButton>

      <Modal opened={opened} onClose={close} centered size="auto">
        {/* eslint-disable-next-line @next/next/no-img-element -- see above */}
        <img
          src={url}
          alt="Scraped product"
          style={{ maxWidth: "80vw", maxHeight: "80vh", display: "block" }}
        />
      </Modal>
    </>
  );
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
  const images = sortBy(scraped?.images ?? [], (img) => img.order);

  return (
    <Card withBorder radius="sm" padding="sm">
      <Card.Section withBorder inheritPadding py="xs">
        <Group justify="space-between" align="center" wrap="nowrap" gap="md">
          <Group gap={6} wrap="wrap" style={{ minWidth: 0, flex: 1 }}>
            {source.source ? (
              <Title order={5} fw={600}>
                {source.source.name}
              </Title>
            ) : (
              <Title order={5} fw={600} c="dimmed">
                Manual entry
              </Title>
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
                <Badge color="red" variant="light" size="sm" style={{ cursor: "pointer" }}>
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

          <Group gap="xs" style={{ flexShrink: 0 }} wrap="nowrap">
            {orderedSpecs.length > 0 && (
              <Button
                variant={openSpecs.includes("specs") ? "filled" : "default"}
                size="xs"
                onClick={() => setOpenSpecs((open) => togglePanel(open, "specs"))}
              >
                Final specs ({orderedSpecs.length})
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
      </Card.Section>

      <Stack gap="sm" mt="sm">
        <Stack gap={2}>
          {scraped?.displayName && (
            source.url ? (
              <Button
                component="a"
                href={source.url}
                target="_blank"
                rel="noreferrer"
                size="xs"
                variant="light"
                justify="flex-start"
                style={{ maxWidth: "fit-content" }}
              >
                <Text size="sm" fw={500} lineClamp={1} c="inherit">
                  {scraped.displayName}
                </Text>
              </Button>
            ) : (
              <Text size="sm" fw={500} lineClamp={1}>
                {scraped.displayName}
              </Text>
            )
          )}

          {scraped?.originalName && scraped.originalName !== scraped?.model && (
            <Badge
              color="gray"
              variant="outline"
              size="sm"
              style={{ textTransform: "none", maxWidth: "fit-content" }}
            >
              Original title: {scraped.originalName}
            </Badge>
          )}

          <Group gap={12} wrap="wrap">
            {(scraped?.brand || scraped?.model) && (
              <Badge color="gray" variant="outline" size="sm" style={{ textTransform: "none" }}>
                {[scraped?.brand, scraped?.model].filter(Boolean).join(" · ")}
              </Badge>
            )}
            {scraped?.releaseYear && (
              <Text size="xs" c="dimmed">
                Released {scraped.releaseYear}
              </Text>
            )}
            {source.externalId && (
              <Badge color="gray" variant="outline" size="sm" style={{ textTransform: "none" }}>
                externalId: {source.externalId}
              </Badge>
            )}
            <Badge color="gray" variant="outline" size="sm" style={{ textTransform: "none" }}>
              Updated {formatDate(source.lastUpdated) || "—"}
            </Badge>
          </Group>

          {scraped?.description && (
            <Spoiler
              maxHeight={40}
              showLabel="Show description"
              hideLabel="Hide"
              w="100%"
              mt="xs"
            >
              <Text size="xs" c="dimmed" style={{ whiteSpace: "pre-wrap" }}>
                {scraped.description}
              </Text>
            </Spoiler>
          )}
        </Stack>

        {openSpecs.includes("specs") && orderedSpecs.length > 0 && (
          <AdminSpecTable specs={orderedSpecs} />
        )}

        {openSpecs.includes("rawSpecs") && orderedRawSpecs.length > 0 && (
          <AdminSpecTable specs={orderedRawSpecs} />
        )}

        {images.length > 0 && (
          <SimpleGrid cols={{ base: 6, sm: 8, md: 10, lg: 12 }} spacing={6}>
            {images.map((img) => (
              <SourceImageThumbnail key={img.url} url={img.url} />
            ))}
          </SimpleGrid>
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
