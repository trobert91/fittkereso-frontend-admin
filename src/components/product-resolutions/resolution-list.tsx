"use client";
"use no memo";

import { forwardRef, useImperativeHandle } from "react";
import {
  Center,
  Group,
  Loader,
  Pagination,
  Select,
  SimpleGrid,
  Stack,
  Text,
} from "@mantine/core";
import { isEmpty } from "lodash";
import { useResolutionSearch } from "@/hooks/useResolutionSearch";
import { ResolutionCard } from "./resolution-card";
import { ResolutionFilterBar } from "./resolution-filter-bar";

export interface ProductResolutionListRef {
  refresh: () => void;
}

const PAGE_SIZES = ["10", "20", "50", "100"];

/**
 * The review queue.
 *
 * Ordering is the backend's; the default "open statuses only" filter is this
 * screen's, sent explicitly from `useResolutionSearch` — the API filters by
 * status only when asked. Rows lead on `priority` — how much it matters that a
 * human looks — so page 1 is uncertain decisions on well-populated products,
 * not whatever happened to score highest on similarity.
 */
export const ProductResolutionList = forwardRef<ProductResolutionListRef>(
  function ProductResolutionList(_props, ref) {
    const {
      params,
      setParams,
      items,
      totalItems,
      totalPages,
      loading,
      refresh,
      replaceItem,
      removeItem,
    } = useResolutionSearch();

    useImperativeHandle(ref, () => ({ refresh }));

    return (
      <Stack gap="md">
        <ResolutionFilterBar params={params} onChange={setParams} />

        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            {totalItems} total item{totalItems === 1 ? "" : "s"}
          </Text>
          <Group gap="sm" align="flex-end">
            <Select
              size="sm"
              label="Per page"
              data={PAGE_SIZES}
              value={String(params.pageSize ?? 20)}
              onChange={(value) =>
                value && setParams({ pageSize: Number(value) })
              }
              w={90}
            />
            <Pagination
              total={totalPages}
              value={params.page ?? 1}
              onChange={(page) => setParams({ page })}
              size="sm"
              mt="auto"
            />
          </Group>
        </Group>

        {loading && (
          <Center py="xl">
            <Loader />
          </Center>
        )}

        {!loading && isEmpty(items) && (
          <Center py="xl">
            <Text c="dimmed">
              Nothing to review. Widen the status filter to see decided records.
            </Text>
          </Center>
        )}

        {!loading && !isEmpty(items) && (
          <SimpleGrid cols={1} spacing="md">
            {items.map((item) => (
              <ResolutionCard
                key={item.resolution.id}
                item={item}
                onUpdated={replaceItem}
                onDeleted={removeItem}
              />
            ))}
          </SimpleGrid>
        )}

        <Center mt="lg">
          <Pagination
            total={totalPages}
            value={params.page ?? 1}
            onChange={(page) => setParams({ page })}
            size="md"
          />
        </Center>
      </Stack>
    );
  },
);
