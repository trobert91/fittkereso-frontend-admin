"use client";

import { useEffect, useState } from "react";
import { Center, Group, Loader, Pagination, Select, Stack, Text } from "@mantine/core";
import { selectProduct } from "@/store/slices/product-slice";
import { useAppSelector } from "@/store/store-hooks";
import { useProductOfferSearch } from "@/hooks/useProductOfferSearch";
import { OfferSearchParams } from "@/models/dtos/offer-search-models";
import { OfferCard } from "./OfferCard";

const PAGE_SIZE = 100;

const sortOptions: {
  value: string;
  sort: OfferSearchParams["sort"];
  order: OfferSearchParams["order"];
  label: string;
}[] = [
  { value: "lastSeenAt-DESC", sort: "lastSeenAt", order: "DESC", label: "Last updated" },
  { value: "createdAt-DESC", sort: "createdAt", order: "DESC", label: "Newest" },
  { value: "createdAt-ASC", sort: "createdAt", order: "ASC", label: "Oldest" },
  { value: "price-ASC", sort: "price", order: "ASC", label: "Price: low to high" },
  { value: "price-DESC", sort: "price", order: "DESC", label: "Price: high to low" },
  { value: "availability-ASC", sort: "availability", order: "ASC", label: "Availability" },
  { value: "condition-ASC", sort: "condition", order: "ASC", label: "Condition" },
];

export function ProductOffersTab() {
  const product = useAppSelector(selectProduct);
  const [page, setPage] = useState(1);
  const [sortValue, setSortValue] = useState(sortOptions[0].value);

  const { search, loading, searchResult } = useProductOfferSearch();

  const productId = product?.id;
  const selectedSort =
    sortOptions.find((option) => option.value === sortValue) ?? sortOptions[0];

  useEffect(() => {
    if (!productId) return;

    search(productId, {
      page,
      pageSize: PAGE_SIZE,
      sort: selectedSort.sort,
      order: selectedSort.order,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, page, sortValue]);

  useEffect(() => {
    setPage(1);
  }, [sortValue]);

  if (!product) {
    return null;
  }

  const offers = searchResult?.items ?? [];
  const totalPages = searchResult?.totalPages ?? 1;
  const totalItems = searchResult?.totalItems ?? 0;

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
          value={sortValue}
          onChange={(value) => value && setSortValue(value)}
          allowDeselect={false}
          w={200}
        />
      </Group>

      {loading ? (
        <Center p="xl">
          <Loader />
        </Center>
      ) : offers.length === 0 ? (
        <Center p="xl">
          <Text c="dimmed">No offers yet</Text>
        </Center>
      ) : (
        <Stack gap="xs">
          {offers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </Stack>
      )}

      {totalPages > 1 && (
        <Center mt="md">
          <Pagination total={totalPages} value={page} onChange={setPage} size="sm" />
        </Center>
      )}
    </Stack>
  );
}
