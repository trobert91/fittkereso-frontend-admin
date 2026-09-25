"use client";

import { ReactNode, useState } from "react";
import {
  Anchor,
  Badge,
  Group,
  SegmentedControl,
  Stack,
  Table,
  Text,
  Tooltip,
} from "@mantine/core";
import { OfferAvailability } from "@/models/offer";
import { ProductSourceRecord, ScrapedOffer } from "@/models/product-source";
import { SpecDefinitionJsonSchema } from "@/models/product-specs";
import { availabilityBadge } from "../offers/OfferCard";
import {
  formatSpecValue,
  hasValue,
  OfferCell,
  OfferFieldRow,
  offerFieldRows,
  SourceRowSection,
  SpecOrigin,
  SpecRow,
  SpecValue,
} from "./listing-fields";

const LABEL_WIDTH = 180;

// Every table in a listing card shares this look, so the field names line up
// down the card and read as one list of key/value pairs.
function FieldTable({
  head,
  children,
}: {
  head?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Table.ScrollContainer minWidth={320} type="native">
      <Table
        fz="sm"
        verticalSpacing={4}
        horizontalSpacing="sm"
        striped
        highlightOnHover
        withTableBorder
        withColumnBorders
      >
        {head && <Table.Thead>{head}</Table.Thead>}
        <Table.Tbody>{children}</Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

function FieldLabel({ label, fieldKey }: { label: string; fieldKey?: string }) {
  return (
    <Table.Td w={LABEL_WIDTH} style={{ verticalAlign: "top" }}>
      <Text size="sm" c="dimmed" lh={1.3}>
        {label}
      </Text>
      {fieldKey && fieldKey !== label && (
        <Text size="xs" c="dimmed" ff="monospace" lh={1.3} opacity={0.7}>
          {fieldKey}
        </Text>
      )}
    </Table.Td>
  );
}

export function SectionTitle({
  children,
  extra,
}: {
  children: ReactNode;
  extra?: ReactNode;
}) {
  return (
    <Group gap="xs" justify="space-between" wrap="wrap">
      <Text size="xs" fw={700} tt="uppercase" c="dimmed">
        {children}
      </Text>
      {extra}
    </Group>
  );
}

// ---------------------------------------------------------------- Identity

export function ListingIdentityTable({
  listing,
}: {
  listing: ProductSourceRecord;
}) {
  const scraped = listing.scrapedProduct;
  const externalId = scraped?.externalId ?? listing.externalId;

  const rows: [string, ReactNode][] = [
    ["Brand", scraped?.brand],
    [
      "Model",
      scraped?.model && (
        <Group gap={6} wrap="wrap">
          <Text size="sm">{scraped.model}</Text>
          {scraped.nameCleaned !== undefined && (
            <Tooltip
              label={
                scraped.nameCleaned
                  ? "Cleaned from the title by the AI identity extraction"
                  : "The raw title: the AI identity extraction was skipped or failed"
              }
              withArrow
            >
              <Badge
                size="xs"
                variant="light"
                color={scraped.nameCleaned ? "violet" : "orange"}
              >
                {scraped.nameCleaned ? "AI" : "Raw title"}
              </Badge>
            </Tooltip>
          )}
        </Group>
      ),
    ],
    ["Display name", scraped?.displayName],
    ["Original title", scraped?.originalName],
    ["Release year", scraped?.releaseYear],
    ["Category", scraped?.category?.name],
    [
      "External id",
      externalId && (
        <Text size="sm" ff="monospace">
          {externalId}
        </Text>
      ),
    ],
    [
      "Declared sizes",
      scraped?.siblingExternalIds?.length
        ? scraped.siblingExternalIds.join(", ")
        : undefined,
    ],
    [
      "Aliases",
      scraped?.aliases?.length ? scraped.aliases.join(", ") : undefined,
    ],
    ["Match key", listing.normalizedSourceName],
  ];

  const shown = rows.filter(([, value]) => hasValue(value));
  if (!shown.length) {
    return (
      <Text size="sm" c="dimmed">
        No identity fields
      </Text>
    );
  }

  return (
    <FieldTable>
      {shown.map(([label, value]) => (
        <Table.Tr key={label}>
          <FieldLabel label={label} />
          <Table.Td style={{ wordBreak: "break-word" }}>{value}</Table.Td>
        </Table.Tr>
      ))}
    </FieldTable>
  );
}

// ---------------------------------------------------------------- Offer entries

const numberFormat = new Intl.NumberFormat("hu-HU", {
  maximumFractionDigits: 2,
});

// Ids read better in a fixed-width font, where a 0 and an O differ.
const IDENTIFIER_FIELDS = new Set([
  "externalId",
  "resolvedExternalId",
  "gtin",
  "mpn",
]);

function OfferValue({ row, cell }: { row: OfferFieldRow; cell: OfferCell }) {
  if (cell.state === "absent") {
    return (
      <Text size="sm" c="dimmed">
        —
      </Text>
    );
  }
  if (cell.state === "empty") {
    return (
      <Tooltip
        label="The source reads this field and found it empty, which clears it on the offer"
        withArrow
      >
        <Text
          size="sm"
          c="dimmed"
          fs="italic"
          style={{ cursor: "help", width: "fit-content" }}
        >
          empty
        </Text>
      </Tooltip>
    );
  }

  const value = cell.value;
  switch (row.kind) {
    case "price":
      return (
        <Text size="sm" fw={row.key === "price" ? 600 : undefined}>
          {numberFormat.format(Number(value))}
        </Text>
      );
    case "availability": {
      const badge = availabilityBadge(value as OfferAvailability);
      return (
        <Badge size="sm" variant="light" color={badge.color}>
          {badge.label}
        </Badge>
      );
    }
    case "url":
      return (
        <Anchor
          href={String(value)}
          target="_blank"
          rel="noreferrer"
          size="sm"
          lineClamp={1}
          style={{ wordBreak: "break-all" }}
        >
          {String(value).replace(/^https?:\/\//, "")}
        </Anchor>
      );
    case "list":
      return <Text size="sm">{(value as string[]).join(", ")}</Text>;
    case "spec":
      return (
        <Text size="sm">{formatSpecValue(value as SpecValue, row.unit)}</Text>
      );
    default:
      return (
        <Text
          size="sm"
          ff={IDENTIFIER_FIELDS.has(row.key) ? "monospace" : undefined}
        >
          {String(value)}
        </Text>
      );
  }
}

export function ListingOfferEntries({
  entries,
  schema,
}: {
  entries: ScrapedOffer[];
  schema: SpecDefinitionJsonSchema | undefined;
}) {
  if (!entries.length) {
    return (
      <Text size="sm" c="dimmed">
        No offer entries
      </Text>
    );
  }

  const { rows, unmapped } = offerFieldRows(entries, schema);
  const several = entries.length > 1;

  return (
    <Stack gap={6}>
      <FieldTable
        head={
          several ? (
            <Table.Tr>
              <Table.Th w={LABEL_WIDTH} />
              {entries.map((entry, index) => (
                <Table.Th key={index}>
                  <Text size="xs" ff="monospace" fw={600}>
                    {entry.externalId ?? `Entry ${index + 1}`}
                  </Text>
                </Table.Th>
              ))}
            </Table.Tr>
          ) : undefined
        }
      >
        {rows.map((row) => (
          <Table.Tr key={row.key}>
            <FieldLabel
              label={row.label}
              fieldKey={
                row.kind === "spec" ? row.key.slice("specs.".length) : undefined
              }
            />
            {row.cells.map((cell, index) => (
              <Table.Td
                key={index}
                style={{ verticalAlign: "top", maxWidth: 360 }}
              >
                <OfferValue row={row} cell={cell} />
              </Table.Td>
            ))}
          </Table.Tr>
        ))}
      </FieldTable>
      {unmapped.length > 0 && (
        <Text size="xs" c="dimmed">
          Not read from this source: {unmapped.join(", ")}. The seller&apos;s
          other sources decide these.
        </Text>
      )}
    </Stack>
  );
}

// ---------------------------------------------------------------- Specs

const ORIGINS: Record<
  SpecOrigin,
  { label: string; color: string; hint: string }
> = {
  mapped: {
    label: "Mapped",
    color: "blue",
    hint: "Read from the source's own field by the config's mapping",
  },
  ai: {
    label: "AI",
    color: "violet",
    hint: "Added by the AI spec pass: the mapping had no value for it",
  },
  changed: {
    label: "AI changed",
    color: "orange",
    hint: "Mapped from the source, then replaced by the AI spec pass",
  },
  dropped: {
    label: "Dropped",
    color: "red",
    hint: "Mapped from the source, but left out of the final specs",
  },
};

type OriginFilter = SpecOrigin | "all";

function SpecValueCell({ row }: { row: SpecRow }) {
  return (
    <Table.Td style={{ verticalAlign: "top", wordBreak: "break-word" }}>
      <Text
        size="sm"
        td={row.origin === "dropped" ? "line-through" : undefined}
        c={row.origin === "dropped" ? "dimmed" : undefined}
      >
        {formatSpecValue(row.value, row.unit)}
      </Text>
      {row.origin === "changed" && (
        <Text size="xs" c="dimmed">
          mapped:{" "}
          <span style={{ textDecoration: "line-through" }}>
            {formatSpecValue(row.mappedValue, row.unit)}
          </span>
        </Text>
      )}
    </Table.Td>
  );
}

export function ListingSpecsTable({ rows }: { rows: SpecRow[] }) {
  const [filter, setFilter] = useState<OriginFilter>("all");

  if (!rows.length) {
    return (
      <Text size="sm" c="dimmed">
        No specs
      </Text>
    );
  }

  const counts = (Object.keys(ORIGINS) as SpecOrigin[])
    .map((origin) => ({
      origin,
      count: rows.filter((row) => row.origin === origin).length,
    }))
    .filter(({ count }) => count > 0);
  const shown =
    filter === "all" ? rows : rows.filter((row) => row.origin === filter);

  return (
    <Stack gap={6}>
      {counts.length > 1 && (
        <SegmentedControl
          size="xs"
          value={filter}
          onChange={(value) => setFilter(value as OriginFilter)}
          data={[
            { value: "all", label: `All ${rows.length}` },
            ...counts.map(({ origin, count }) => ({
              value: origin,
              label: `${ORIGINS[origin].label} ${count}`,
            })),
          ]}
          style={{ alignSelf: "flex-start" }}
        />
      )}
      <FieldTable>
        {shown.map((row) => (
          <Table.Tr key={row.key}>
            <FieldLabel label={row.label} fieldKey={row.key} />
            <SpecValueCell row={row} />
            {row.origin && (
              <Table.Td w={100} style={{ verticalAlign: "top" }}>
                <Tooltip label={ORIGINS[row.origin].hint} withArrow>
                  <Badge
                    size="xs"
                    variant="light"
                    color={ORIGINS[row.origin].color}
                    style={{ cursor: "help" }}
                  >
                    {ORIGINS[row.origin].label}
                  </Badge>
                </Tooltip>
              </Table.Td>
            )}
          </Table.Tr>
        ))}
      </FieldTable>
    </Stack>
  );
}

// ---------------------------------------------------------------- Source rows

export function ListingSourceRows({
  sections,
}: {
  sections: SourceRowSection[];
}) {
  return (
    <FieldTable>
      {sections.flatMap((section, index) => [
        ...(section.title
          ? [
              <Table.Tr key={`section-${index}`}>
                <Table.Td colSpan={2} bg="var(--mantine-color-default-hover)">
                  <Text size="xs" fw={700}>
                    {section.title}
                  </Text>
                </Table.Td>
              </Table.Tr>,
            ]
          : []),
        ...section.rows.map((row) => (
          <Table.Tr key={row.key}>
            <FieldLabel label={row.name} />
            <Table.Td style={{ wordBreak: "break-word" }}>{row.value}</Table.Td>
          </Table.Tr>
        )),
      ])}
    </FieldTable>
  );
}
