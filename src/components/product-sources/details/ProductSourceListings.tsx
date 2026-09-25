"use client";

import { useEffect, useState } from "react";
import {
  Anchor,
  Badge,
  Center,
  Group,
  Pagination,
  SegmentedControl,
  Stack,
  Table,
  Text,
  TextInput,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import Link from "next/link";
import { getProductSourceRecords } from "@/api-actions/product-source/product-source-records";
import { DetailsSection } from "@/components/details/details-section";
import { ProductSource } from "@/models/dtos/product-source-search-models";
import { ProductSourceRecordList } from "@/models/dtos/product-source-record-models";
import { formatDate } from "@/utils/date";
import { routes } from "@/utils/routes";

const PAGE_SIZE = 25;

type AttachedFilter = "all" | "attached" | "unattached";

const attachedParam: Record<AttachedFilter, boolean | undefined> = {
  all: undefined,
  attached: true,
  unattached: false,
};

/**
 * The source's listings (one per URL), newest sighting first.
 *
 * Fetched here rather than carried by the source's detail response: a feed
 * source holds thousands. "Unattached" is the reason this exists — a source
 * that does not identify products stores a row whose offer its seller's
 * identifying source has not written yet with no product, so that list is
 * what the identifying source lacks.
 */
export function ProductSourceListings({
  productSource,
}: {
  productSource: ProductSource;
}) {
  const [attached, setAttached] = useState<AttachedFilter>(
    productSource.identifiesProducts === false ? "unattached" : "all",
  );
  const [searchInput, setSearchInput] = useState("");
  const [search] = useDebouncedValue(searchInput, 300);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<ProductSourceRecordList | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    getProductSourceRecords(productSource.id, {
      attached: attachedParam[attached],
      search: search || undefined,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    })
      .then((list) => {
        if (!current) return;
        setResult(list);
        setError(null);
      })
      .catch((loadError: Error) => {
        if (current) setError(loadError.message);
      });
    return () => {
      current = false;
    };
  }, [productSource.id, attached, search, page]);

  const totalPages = Math.max(1, Math.ceil((result?.total ?? 0) / PAGE_SIZE));

  return (
    <DetailsSection
      title="Listings"
      description="What this source has stored, one listing per URL, newest sighting first. An unattached listing waits for its seller's identifying source to write its offer, and joins it then."
    >
      <Group justify="space-between" wrap="wrap">
        <SegmentedControl
          value={attached}
          onChange={(value) => {
            setAttached(value as AttachedFilter);
            setPage(1);
          }}
          data={[
            { value: "all", label: "All" },
            { value: "attached", label: "On a product" },
            { value: "unattached", label: "Unattached" },
          ]}
        />
        <TextInput
          placeholder="Search URL, externalId or title"
          value={searchInput}
          onChange={(event) => {
            setSearchInput(event.currentTarget.value);
            setPage(1);
          }}
          w={280}
        />
      </Group>

      {error && (
        <Text size="sm" c="red">
          {error}
        </Text>
      )}

      {result && result.items.length === 0 && (
        <Center p="md">
          <Text size="sm" c="dimmed">
            No listings match.
          </Text>
        </Center>
      )}

      {result && result.items.length > 0 && (
        <Stack gap="xs">
          <Text size="xs" c="dimmed">
            {result.total} listing{result.total === 1 ? "" : "s"}
          </Text>
          <Table.ScrollContainer minWidth={800}>
            <Table striped verticalSpacing="xs" fz="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Title</Table.Th>
                  <Table.Th>externalId</Table.Th>
                  <Table.Th>Price</Table.Th>
                  <Table.Th>Product</Table.Th>
                  <Table.Th>Last seen</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {result.items.map((row) => (
                  <Table.Tr key={row.id}>
                    <Table.Td>
                      {row.url ? (
                        <Anchor href={row.url} target="_blank" rel="noreferrer" size="sm">
                          {row.title ?? row.url}
                        </Anchor>
                      ) : (
                        (row.title ?? "—")
                      )}
                    </Table.Td>
                    <Table.Td ff="monospace">
                      {row.offerExternalIds.join(", ") || row.externalId || "—"}
                    </Table.Td>
                    <Table.Td>{row.price ?? "—"}</Table.Td>
                    <Table.Td>
                      {row.productId ? (
                        <Anchor
                          component={Link}
                          href={routes.products.details(row.productId)}
                          size="sm"
                        >
                          {row.productName ?? row.productId}
                        </Anchor>
                      ) : (
                        <Badge color="orange" variant="light">
                          unattached
                        </Badge>
                      )}
                    </Table.Td>
                    <Table.Td>{formatDate(row.seenAt)}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
          {totalPages > 1 && (
            <Group justify="center">
              <Pagination value={page} onChange={setPage} total={totalPages} size="sm" />
            </Group>
          )}
        </Stack>
      )}
    </DetailsSection>
  );
}
