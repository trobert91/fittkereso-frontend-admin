"use client";

import { useMemo, useState } from "react";
import { Center, Group, Pagination, Select, Stack, Text } from "@mantine/core";
import { orderBy } from "lodash";
import { Offer, OfferAvailability, OfferCondition } from "@/models/offer";
import { OfferCard } from "./OfferCard";

const DEFAULT_PAGE_SIZE = 20;

type OfferSortKey =
  | "lastSeenAt"
  | "createdAt"
  | "price"
  | "availability"
  | "condition";

type OfferSortOrder = "asc" | "desc";

const sortOptions: {
  value: string;
  sort: OfferSortKey;
  order: OfferSortOrder;
  label: string;
}[] = [
  { value: "lastSeenAt-DESC", sort: "lastSeenAt", order: "desc", label: "Last updated" },
  { value: "createdAt-DESC", sort: "createdAt", order: "desc", label: "Newest" },
  { value: "createdAt-ASC", sort: "createdAt", order: "asc", label: "Oldest" },
  { value: "price-ASC", sort: "price", order: "asc", label: "Price: low to high" },
  { value: "price-DESC", sort: "price", order: "desc", label: "Price: high to low" },
  { value: "availability-ASC", sort: "availability", order: "asc", label: "Availability" },
  { value: "condition-ASC", sort: "condition", order: "asc", label: "Condition" },
];

// Enum columns sort by their Postgres declaration order, so mirror that
// ordering here rather than sorting the enum values alphabetically — keeps
// client-side sorting consistent with how the backend orders offers.
const availabilityRank: Record<OfferAvailability, number> = {
  [OfferAvailability.in_stock]: 0,
  [OfferAvailability.out_of_stock]: 1,
  [OfferAvailability.preorder]: 2,
  [OfferAvailability.unknown]: 3,
};

const conditionRank: Record<OfferCondition, number> = {
  [OfferCondition.new]: 0,
  [OfferCondition.used]: 1,
  [OfferCondition.refurbished]: 2,
};

// `price` arrives as a Postgres numeric (serialized as a string), and the
// timestamps as ISO strings — normalize everything to a number so lodash
// compares them by value instead of lexicographically.
function sortValue(offer: Offer, sort: OfferSortKey): number {
  switch (sort) {
    case "price":
      return Number(offer.price);
    case "lastSeenAt":
      return new Date(offer.lastSeenAt).getTime();
    case "createdAt":
      return new Date(offer.createdAt).getTime();
    case "availability":
      return availabilityRank[offer.availability] ?? Number.MAX_SAFE_INTEGER;
    case "condition":
      return conditionRank[offer.condition] ?? Number.MAX_SAFE_INTEGER;
  }
}

/**
 * The single offer list UI, shared by the product details page "Offers" tab
 * and the product details modal. Both get their offers from the product
 * details endpoint payload (`ProductModel.offers`), so this component is
 * purely presentational — sorting and paging happen client-side.
 */
export function ProductOffersList({
  offers,
  pageSize = DEFAULT_PAGE_SIZE,
}: {
  offers?: Offer[];
  pageSize?: number;
}) {
  const [page, setPage] = useState(1);
  const [sortValueKey, setSortValueKey] = useState(sortOptions[0].value);

  const selectedSort =
    sortOptions.find((option) => option.value === sortValueKey) ??
    sortOptions[0];

  const sortedOffers = useMemo(
    () =>
      orderBy(
        offers ?? [],
        // NULLS LAST equivalent: unparseable values sink to the end of an
        // ascending sort instead of poisoning the comparison with NaN.
        (offer) => {
          const value = sortValue(offer, selectedSort.sort);
          return Number.isNaN(value) ? Number.MAX_SAFE_INTEGER : value;
        },
        selectedSort.order
      ),
    [offers, selectedSort.sort, selectedSort.order]
  );

  const totalItems = sortedOffers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Clamp during render rather than in an effect: the offer set can shrink
  // (e.g. the product is reloaded with fewer offers) while `page` still
  // points past the end, and deriving it avoids a cascading re-render.
  const currentPage = Math.min(page, totalPages);

  const visibleOffers = sortedOffers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Text size="sm" c="dimmed">
          {totalItems} offer{totalItems === 1 ? "" : "s"}
        </Text>
        <Select
          data={sortOptions.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
          value={sortValueKey}
          onChange={(value) => {
            if (!value) return;
            setSortValueKey(value);
            setPage(1);
          }}
          allowDeselect={false}
          w={200}
        />
      </Group>

      {totalItems === 0 ? (
        <Center p="xl">
          <Text c="dimmed">No offers yet</Text>
        </Center>
      ) : (
        <Stack gap="xs">
          {visibleOffers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </Stack>
      )}

      {totalPages > 1 && (
        <Center mt="md">
          <Pagination
            total={totalPages}
            value={currentPage}
            onChange={setPage}
            size="sm"
          />
        </Center>
      )}
    </Stack>
  );
}
