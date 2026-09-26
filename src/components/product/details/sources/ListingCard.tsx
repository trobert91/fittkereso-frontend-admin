"use client";

import Link from "next/link";
import {
  Accordion,
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Card,
  CopyButton,
  Group,
  Modal,
  SimpleGrid,
  Stack,
  Text,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { FaChevronRight, FaExternalLinkAlt } from "react-icons/fa";
import { sortBy } from "lodash";
import { OfferAvailability } from "@/models/offer";
import {
  PRODUCT_SOURCE_TYPE_COLORS,
  ProductSourceRecord,
} from "@/models/product-source";
import { SpecDefinitionJsonSchema } from "@/models/product-specs";
import { formatDate, formatRelativeDate } from "@/utils/date";
import { routes } from "@/utils/routes";
import { availabilityBadge, OfferCard } from "../offers/OfferCard";
import { DeleteSourceButton } from "./DeleteSourceButton";
import { ResyncSourceButton } from "./ResyncSourceButton";
import {
  formatMoney,
  listingOfferSummary,
  listingSpecRows,
  SpecOrigin,
  SpecRow,
  sourceRowSections,
} from "./listing-fields";
import {
  ListingIdentityTable,
  ListingOfferEntries,
  ListingSourceRows,
  ListingSpecsTable,
  SectionTitle,
} from "./ListingFieldTables";

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

const ORIGIN_LABELS: [SpecOrigin, string][] = [
  ["mapped", "mapped"],
  ["ai", "by AI"],
  ["changed", "changed by AI"],
  ["dropped", "dropped"],
];

function originCounts(rows: SpecRow[]): [number, string][] {
  return ORIGIN_LABELS.map(
    ([origin, label]) =>
      [rows.filter((row) => row.origin === origin).length, label] as [
        number,
        string
      ]
  ).filter(([count]) => count > 0);
}

// Fixed widths, so the closed rows of every shop line up into columns and a
// product with dozens of sources reads as one list.
const SUMMARY_COLUMNS = {
  externalId: 190,
  price: 190,
  availability: 110,
  variant: 170,
  specs: 130,
  updated: 110,
};

/**
 * The closed state of a listing: one line with what matters most when
 * scanning dozens of sources — which source, the id and price it states, its
 * stock, the offer's size or colour, how many specs it gave, and how fresh it
 * is.
 */
function ListingSummary({
  listing,
  specRows,
  schema,
  opened,
}: {
  listing: ProductSourceRecord;
  specRows: SpecRow[];
  schema: SpecDefinitionJsonSchema | undefined;
  opened: boolean;
}) {
  const source = listing.source;
  const offerCount = listing.offers?.length ?? 0;
  const summary = listingOfferSummary(
    listing.scrapedProduct?.offers ?? [],
    schema
  );
  const aiCount = specRows.filter(
    (row) => row.origin === "ai" || row.origin === "changed"
  ).length;
  const availability =
    summary.availability && summary.availability !== "mixed"
      ? availabilityBadge(summary.availability as OfferAvailability)
      : undefined;

  return (
    <Group gap="sm" wrap="wrap" align="center" style={{ rowGap: 4 }}>
      <Group gap={6} wrap="nowrap" style={{ flex: "1 1 260px", minWidth: 0 }}>
        <FaChevronRight
          size={10}
          style={{
            flexShrink: 0,
            transition: "transform 150ms ease",
            transform: opened ? "rotate(90deg)" : undefined,
          }}
        />
        <Text fw={600} size="sm" truncate="end">
          {source ? source.name : "Admin edits"}
        </Text>
        {source?.type && (
          <Badge
            color={PRODUCT_SOURCE_TYPE_COLORS[source.type]}
            variant="light"
            size="xs"
            tt="none"
            style={{ flexShrink: 0 }}
          >
            {source.type}
          </Badge>
        )}
        {source?.priority !== undefined && (
          <Badge
            color="gray"
            variant="outline"
            size="xs"
            tt="none"
            style={{ flexShrink: 0 }}
          >
            priority {source.priority}
          </Badge>
        )}
        {source?.identifiesProducts === false && (
          <Badge
            color="gray"
            variant="light"
            size="xs"
            tt="none"
            style={{ flexShrink: 0 }}
          >
            contributing
          </Badge>
        )}
        {!listing.specValid && (
          <Badge
            color="red"
            variant="light"
            size="xs"
            style={{ flexShrink: 0 }}
          >
            Invalid
          </Badge>
        )}
        {offerCount > 0 && (
          <Tooltip
            label="The shop's offer comes from this source: it takes its price from the highest-priority source that lists it"
            multiline
            w={300}
            withArrow
          >
            <Badge
              color="green"
              variant="light"
              size="xs"
              tt="none"
              style={{ flexShrink: 0 }}
            >
              {offerCount === 1 ? "Offer" : `${offerCount} offers`}
            </Badge>
          </Tooltip>
        )}
      </Group>

      <Text
        size="xs"
        ff="monospace"
        c="dimmed"
        w={SUMMARY_COLUMNS.externalId}
        truncate="end"
      >
        {summary.count > 1
          ? `${summary.count} offer entries`
          : summary.externalId ??
            listing.scrapedProduct?.externalId ??
            listing.externalId ??
            ""}
      </Text>

      <Group gap={6} wrap="nowrap" w={SUMMARY_COLUMNS.price}>
        {summary.price && (
          <Text size="sm" fw={600} style={{ whiteSpace: "nowrap" }}>
            {summary.price.min === summary.price.max
              ? formatMoney(summary.price.min, summary.price.currency)
              : `from ${formatMoney(
                  summary.price.min,
                  summary.price.currency
                )}`}
          </Text>
        )}
        {summary.oldPrice !== undefined && (
          <Text
            size="xs"
            c="dimmed"
            td="line-through"
            style={{ whiteSpace: "nowrap" }}
          >
            {formatMoney(summary.oldPrice, summary.price?.currency)}
          </Text>
        )}
      </Group>

      <Box w={SUMMARY_COLUMNS.availability}>
        {availability ? (
          <Badge size="sm" variant="light" color={availability.color}>
            {availability.label}
          </Badge>
        ) : summary.availability === "mixed" ? (
          <Badge size="sm" variant="light" color="gray">
            Mixed stock
          </Badge>
        ) : null}
      </Box>

      <Text size="xs" w={SUMMARY_COLUMNS.variant} truncate="end">
        {summary.variants.join(" | ")}
      </Text>

      <Text size="xs" c="dimmed" w={SUMMARY_COLUMNS.specs} truncate="end">
        {specRows.length > 0
          ? `${specRows.length} specs${aiCount ? ` · ${aiCount} AI` : ""}`
          : "no specs"}
      </Text>

      <Text size="xs" c="dimmed" w={SUMMARY_COLUMNS.updated} truncate="end">
        {formatRelativeDate(listing.lastUpdated)}
      </Text>
    </Group>
  );
}

function CountLabel({
  label,
  count,
  extra,
}: {
  label: string;
  count?: number;
  extra?: string;
}) {
  return (
    <Group gap={8} wrap="wrap">
      <Text size="sm" fw={600}>
        {label}
      </Text>
      {count !== undefined && (
        <Badge size="sm" variant="default" radius="sm">
          {count}
        </Badge>
      )}
      {extra && (
        <Text size="xs" c="dimmed">
          {extra}
        </Text>
      )}
    </Group>
  );
}

// The open state's first line: where the listing lives, its state, and what
// can be done with it. Resync and delete act through the product page, so
// they need the product.
function ListingDetailsHeader({
  listing,
  productId,
}: {
  listing: ProductSourceRecord;
  productId?: string;
}) {
  const source = listing.source;
  const errorCount = listing.specErrors
    ? Object.keys(listing.specErrors).length
    : 0;

  return (
    <Group justify="space-between" align="center" wrap="wrap" gap="xs">
      <Group gap={6} wrap="wrap" style={{ minWidth: 0, flex: 1 }}>
        {listing.url && (
          <Anchor
            href={listing.url}
            target="_blank"
            rel="noreferrer"
            size="sm"
            style={{ wordBreak: "break-all" }}
          >
            {listing.url.replace(/^https?:\/\//, "")}
          </Anchor>
        )}
        <Badge
          color={listing.specValid ? "green" : "red"}
          variant="light"
          size="sm"
        >
          {listing.specValid ? "Valid" : "Invalid"}
        </Badge>
        {listing.deduplicated && (
          <Badge color="orange" variant="light" size="sm">
            Deduplicated
          </Badge>
        )}
        {errorCount > 0 && (
          <Tooltip
            label={
              <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                {JSON.stringify(listing.specErrors, null, 2)}
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
        <CopyButton value={listing.id}>
          {({ copied, copy }) => (
            <Tooltip label={copied ? "Copied!" : "Copy ID"} withArrow>
              <Badge
                color={copied ? "green" : "gray"}
                variant="outline"
                size="sm"
                style={{ cursor: "pointer" }}
                onClick={copy}
              >
                {listing.id.slice(0, 8)}…
              </Badge>
            </Tooltip>
          )}
        </CopyButton>
        <Text size="xs" c="dimmed">
          Updated {formatDate(listing.lastUpdated) || "—"}
        </Text>
      </Group>

      <Group gap="xs" style={{ flexShrink: 0 }} wrap="nowrap">
        {source && (
          <Anchor
            component={Link}
            href={routes.productSources.details(source.id)}
            size="sm"
          >
            Source settings
          </Anchor>
        )}
        {productId && source && listing.url ? (
          <ResyncSourceButton
            productId={productId}
            sourceRecordId={listing.id}
            sourceUrl={listing.url}
          />
        ) : null}
        {productId && (
          <DeleteSourceButton productId={productId} sourceId={listing.id} />
        )}
      </Group>
    </Group>
  );
}

// The open state: the offers this source supplied the price of first, then
// every field it extracted — identity and offer entries side by side, its
// specs (marked by where each value came from), its own label/value rows and
// its description. Also the listing details modal's body, where it goes
// without a product id and so without resync and delete.
export function ListingDetails({
  listing,
  productId,
  schema,
  specRows,
}: {
  listing: ProductSourceRecord;
  productId?: string;
  schema: SpecDefinitionJsonSchema | undefined;
  specRows: SpecRow[];
}) {
  const scraped = listing.scrapedProduct;
  const entries = scraped?.offers ?? [];
  const sections = sourceRowSections(scraped?.rawSpecs);
  const sourceRowCount = sections.reduce(
    (total, section) => total + section.rows.length,
    0
  );
  const images = sortBy(scraped?.images ?? [], (img) => img.order);
  const offers = listing.offers ?? [];
  const originSummary = originCounts(specRows)
    .map(([count, label]) => `${count} ${label}`)
    .join(" · ");

  return (
    <Stack gap="md">
      {offers.length > 0 && (
        <Stack gap={6}>
          <SectionTitle>
            {offers.length === 1
              ? "The offer from this source"
              : `The offers from this source (${offers.length})`}
          </SectionTitle>
          {offers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} compact />
          ))}
        </Stack>
      )}

      <ListingDetailsHeader listing={listing} productId={productId} />

      {listing.source && (
        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md" verticalSpacing="md">
          <Stack gap={6}>
            <SectionTitle>Identity</SectionTitle>
            <ListingIdentityTable listing={listing} />
          </Stack>
          <Stack gap={6}>
            <SectionTitle>
              {entries.length > 1
                ? `Offer entries (${entries.length})`
                : "Offer entry"}
            </SectionTitle>
            <ListingOfferEntries entries={entries} schema={schema} />
          </Stack>
        </SimpleGrid>
      )}

      {(specRows.length > 0 || sourceRowCount > 0 || scraped?.description) && (
        <Accordion
          multiple
          defaultValue={["specs"]}
          variant="contained"
          radius="sm"
          chevronPosition="left"
        >
          {specRows.length > 0 && (
            <Accordion.Item value="specs">
              <Accordion.Control>
                <CountLabel
                  label="Specs"
                  count={specRows.length}
                  extra={originSummary}
                />
              </Accordion.Control>
              <Accordion.Panel>
                <ListingSpecsTable rows={specRows} />
              </Accordion.Panel>
            </Accordion.Item>
          )}

          {sourceRowCount > 0 && (
            <Accordion.Item value="sourceRows">
              <Accordion.Control>
                <CountLabel
                  label="Source rows"
                  count={sourceRowCount}
                  extra="the labels and values as the source published them"
                />
              </Accordion.Control>
              <Accordion.Panel>
                <ListingSourceRows sections={sections} />
              </Accordion.Panel>
            </Accordion.Item>
          )}

          {scraped?.description && (
            <Accordion.Item value="description">
              <Accordion.Control>
                <CountLabel
                  label="Description"
                  extra={`${scraped.description.length} characters`}
                />
              </Accordion.Control>
              <Accordion.Panel>
                <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                  {scraped.description}
                </Text>
              </Accordion.Panel>
            </Accordion.Item>
          )}
        </Accordion>
      )}

      {images.length > 0 && (
        <Stack gap={6}>
          <SectionTitle>Images ({images.length})</SectionTitle>
          <SimpleGrid cols={{ base: 6, sm: 8, md: 10, lg: 12 }} spacing={6}>
            {images.map((img) => (
              <SourceImageThumbnail key={img.url} url={img.url} />
            ))}
          </SimpleGrid>
        </Stack>
      )}
    </Stack>
  );
}

/**
 * One source's listing of this product: closed, a one-line summary; open, the
 * fields it extracted. The details render only while open, so a product with
 * dozens of sources stays light.
 */
export function ListingCard({
  listing,
  productId,
  schema,
}: {
  listing: ProductSourceRecord;
  productId: string;
  schema: SpecDefinitionJsonSchema | undefined;
}) {
  const [opened, { toggle }] = useDisclosure(false);
  const specRows = listingSpecRows(listing, schema);

  return (
    <Card withBorder radius="sm" padding={0}>
      <Group gap="xs" wrap="nowrap" px="sm" py={6}>
        <UnstyledButton
          onClick={toggle}
          aria-expanded={opened}
          style={{ flex: 1, minWidth: 0 }}
        >
          <ListingSummary
            listing={listing}
            specRows={specRows}
            schema={schema}
            opened={opened}
          />
        </UnstyledButton>
        {listing.url && (
          <Tooltip label="Open the listing" withArrow>
            <ActionIcon
              component="a"
              href={listing.url}
              target="_blank"
              rel="noreferrer"
              variant="subtle"
              color="gray"
              size="sm"
              aria-label="Open the listing"
            >
              <FaExternalLinkAlt size={11} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>

      {opened && (
        <Box
          px="sm"
          py="sm"
          style={{ borderTop: "1px solid var(--mantine-color-default-border)" }}
        >
          <ListingDetails
            listing={listing}
            productId={productId}
            schema={schema}
            specRows={specRows}
          />
        </Box>
      )}
    </Card>
  );
}
