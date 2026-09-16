"use client";

import { Group, Pagination, Select, Text } from "@mantine/core";

export const PAGE_SIZES = ["20", "50", "100"];

/**
 * The row above a list table: which slice is on screen, how big a page is, and which page.
 *
 * Extracted from five tables that each carried their own copy of the same Group - a dimmed
 * count on the left, a "Per page" Select and a Pagination on the right - and each worded the
 * count differently ("312 total sellers", "312 total tasks", and so on). The count itself has
 * moved to the page header, where it is visible on every list rather than only the five that
 * happened to implement it; what is left here is the range, which says something the header
 * cannot: where in the set you currently are.
 */
export function ListPagination({
  page,
  pageSize,
  totalPages,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number | null;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}) {
  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = totalItems === null ? null : Math.min(totalItems, page * pageSize);

  return (
    <Group justify="space-between" mb="sm" wrap="wrap" gap="sm">
      <Text size="sm" c="dimmed">
        {totalItems === null || to === null
          ? ""
          : `${from.toLocaleString("hu-HU")}–${to.toLocaleString(
              "hu-HU"
            )} of ${totalItems.toLocaleString("hu-HU")}`}
      </Text>

      <Group gap="sm">
        <Select
          size="xs"
          label="Per page"
          data={PAGE_SIZES}
          value={String(pageSize)}
          onChange={(value) => {
            if (value) {
              onPageSizeChange(Number(value));
            }
          }}
          w={80}
        />

        <Pagination
          total={totalPages}
          value={page}
          onChange={onPageChange}
          size="sm"
          mt="auto"
        />
      </Group>
    </Group>
  );
}
