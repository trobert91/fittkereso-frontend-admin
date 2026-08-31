"use client";

import { Badge, Group, Stack, Text, ThemeIcon, Timeline } from "@mantine/core";
import { isEmpty } from "lodash";
import { FaCheck, FaTimes } from "react-icons/fa";
import { IoWarning } from "react-icons/io5";
import { MdRateReview } from "react-icons/md";
import { PiRobot } from "react-icons/pi";
import {
  ProductResolutionDecisionEntry,
  ProductResolutionRecord,
} from "@/api-actions/product/product-resolutions";
import { formatDate } from "@/utils/date";
import { ACTION_KIND_LABELS, VERDICT_LABELS } from "./resolution-labels";

/**
 * The append-only decision log, newest first.
 *
 * This is the "spot and correct a wrong decision" view: it reads as one story
 * from the system's original verdict through every human correction, and
 * `actionPerformed` on each entry is what separates "this was decided" from
 * "this was carried out" — the distinction the whole pipeline turns on.
 */
export function ResolutionDecisionTimeline({
  resolution,
}: {
  resolution: ProductResolutionRecord;
}) {
  const entries = resolution.decisions ?? [];

  if (isEmpty(entries)) {
    return (
      <Text size="sm" c="dimmed">
        No decisions recorded.
      </Text>
    );
  }

  return (
    <Timeline bulletSize={20} lineWidth={2}>
      {[...entries].reverse().map((entry, index) => (
        <Timeline.Item
          key={`${entry.at}-${index}`}
          bullet={<EntryBullet entry={entry} />}
          title={<EntryTitle entry={entry} resolution={resolution} />}
        >
          <EntryBody entry={entry} />
        </Timeline.Item>
      ))}
    </Timeline>
  );
}

function entryColor(entry: ProductResolutionDecisionEntry): string {
  if (entry.error) return "red";
  return entry.actor === "system" ? "violet" : "blue";
}

function EntryBullet({ entry }: { entry: ProductResolutionDecisionEntry }) {
  return (
    <ThemeIcon size={20} radius="xl" color={entryColor(entry)} variant="filled">
      {entry.error ? (
        <IoWarning size={11} />
      ) : entry.actor === "system" ? (
        <PiRobot size={11} />
      ) : (
        <MdRateReview size={11} />
      )}
    </ThemeIcon>
  );
}

function EntryTitle({
  entry,
  resolution,
}: {
  entry: ProductResolutionDecisionEntry;
  resolution: ProductResolutionRecord;
}) {
  const color = entryColor(entry);

  const productName = (id?: string) => {
    if (!id) return undefined;
    const match = [
      resolution.productA,
      resolution.productB,
      resolution.resolvedProduct,
      resolution.sourceRecord?.model,
    ].find((product) => product?.id === id);
    return match?.displayName ?? id.slice(0, 8);
  };

  const { action } = entry;
  const movedCount = action.sourceRecordIds?.length ?? 0;

  return (
    <Group gap={6} wrap="wrap" align="center">
      <Badge color={color} variant="light" size="xs" tt="none">
        {entry.actor}
      </Badge>

      <Badge color={color} variant="outline" size="xs" tt="none">
        {VERDICT_LABELS[entry.verdict]}
      </Badge>

      {action.kind !== "none" && (
        <Badge color="gray" variant="light" size="xs" tt="none">
          {ACTION_KIND_LABELS[action.kind]}
        </Badge>
      )}

      {productName(action.targetProductId ?? action.productId) && (
        <Text size="xs">
          → {productName(action.targetProductId ?? action.productId)}
        </Text>
      )}

      {action.sourceProductId && (
        <Text size="xs" c="dimmed">
          from {productName(action.sourceProductId)}
        </Text>
      )}

      {movedCount > 0 && (
        <Badge color="gray" variant="outline" size="xs" tt="none">
          {movedCount} listing{movedCount === 1 ? "" : "s"} moved
        </Badge>
      )}

      {entry.actionPerformed ? (
        <Badge
          color="green"
          variant="light"
          size="xs"
          tt="none"
          leftSection={<FaCheck size={8} />}
        >
          performed
        </Badge>
      ) : (
        <Badge
          color="gray"
          variant="light"
          size="xs"
          tt="none"
          leftSection={<FaTimes size={8} />}
        >
          {entry.error ? "not performed" : "no catalog change"}
        </Badge>
      )}

      <Text size="xs" c="dimmed" style={{ marginLeft: "auto" }}>
        {formatDate(entry.at, "yyyy-MM-dd HH:mm")}
      </Text>
    </Group>
  );
}

function EntryBody({ entry }: { entry: ProductResolutionDecisionEntry }) {
  if (!entry.error && !entry.note) return null;

  return (
    <Stack gap={2} mt={2}>
      {entry.error && (
        <Text size="xs" c="red">
          {entry.error}
        </Text>
      )}
      {entry.note && (
        <Text size="xs" c="dimmed">
          “{entry.note}”
        </Text>
      )}
    </Stack>
  );
}
