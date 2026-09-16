"use client";

import { ReactNode } from "react";
import { ActionIcon, Group, Text, Tooltip } from "@mantine/core";
import { PiArrowsClockwise } from "react-icons/pi";
import { CommonPage } from "@/components/common-page";
import { PageHeader } from "@/components/page-header";
import { ListStateProvider, useListState } from "./list-context";

/**
 * The count, beside the title.
 *
 * Renders nothing rather than "0" until the first search lands: a zero that turns into 312 a
 * moment later is worse than a blank, because the zero looks like an answer.
 */
function ListCount() {
  const { totalItems } = useListState();

  if (totalItems === null) {
    return null;
  }

  return (
    <Text span size="sm" c="dimmed" fw={400}>
      {totalItems.toLocaleString("hu-HU")}
      {totalItems === 1 ? " item" : " items"}
    </Text>
  );
}

/**
 * Re-runs the current search.
 *
 * It has to call the table's search directly rather than nudge page state, because every
 * table's effect deliberately skips a search whose parameters match what is already loaded -
 * so setting page to the page it is already on would do nothing at all.
 */
function RefreshButton() {
  const { loading, refresh } = useListState();

  if (!refresh) {
    return null;
  }

  return (
    <Tooltip label="Refresh">
      <ActionIcon
        variant="default"
        size="lg"
        aria-label="Refresh"
        loading={loading}
        onClick={refresh}
      >
        <PiArrowsClockwise size="1.1rem" />
      </ActionIcon>
    </Tooltip>
  );
}

/**
 * The shell every list page shares: title with a live count, a refresh button, breadcrumbs,
 * and whatever create action the page brings.
 *
 * Replaces the CommonPage + PageHeader + <XTable /> assembly each list page repeated, which
 * left the count to the table - so five tables printed their own phrasing of it and three
 * showed none at all.
 */
export function ListPage({
  title,
  breadcrumbs,
  actions,
  children,
}: {
  title: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <CommonPage>
      <ListStateProvider>
        <PageHeader
          title={
            <Group gap="xs" align="baseline" wrap="nowrap">
              <span>{title}</span>
              <ListCount />
            </Group>
          }
          breadcrumbs={breadcrumbs}
          actions={
            <Group gap="xs">
              <RefreshButton />
              {actions}
            </Group>
          }
        />

        {children}
      </ListStateProvider>
    </CommonPage>
  );
}
