"use client";

import { ReactNode } from "react";
import { Badge, Group, Stack, Text } from "@mantine/core";
import { DetailsSection } from "@/components/details/details-section";
import {
  describeActor,
  ProductSourceAction,
  ProductSourceActionType,
} from "@/models/dtos/product-source-history-models";
import { ProductSource } from "@/models/dtos/product-source-search-models";
import { formatDate } from "@/utils/date";

// Mirrors DETAIL_ACTION_LIMIT in product-source-version.service.ts.
const DETAIL_ACTION_LIMIT = 100;

/** Heading and colour per entry kind. */
const ACTION_META: Record<
  ProductSourceActionType,
  { label: string; color: string }
> = {
  created: { label: "Source created", color: "blue" },
  config_version_created: { label: "Config version saved", color: "teal" },
  config_restored: { label: "Config restored", color: "grape" },
  config_validation_failed: { label: "Config validation failed", color: "red" },
  sync_triggered: { label: "Sync queued", color: "cyan" },
  scheduling_changed: { label: "Scheduling changed", color: "yellow" },
  processing_changed: { label: "Processing changed", color: "yellow" },
  seller_changed: { label: "Seller changed", color: "indigo" },
};

const str = (value: unknown): string | null =>
  typeof value === "string" ? value : null;

const num = (value: unknown): number | null =>
  typeof value === "number" ? value : null;

const onOff = (value: unknown): string =>
  value === true ? "on" : value === false ? "off" : "—";

/**
 * What each entry says beyond its heading.
 *
 * Deliberately not a key/value dump of the payload: these are written by our
 * own code and each one means something specific, so an unknown type renders
 * its heading alone rather than raw JSON somebody has to decode.
 */
function ActionDetail({ action }: { action: ProductSourceAction }): ReactNode {
  const payload = action.payload ?? {};

  switch (action.type) {
    case "config_version_created": {
      const note = str(payload["note"]);
      return (
        <Text size="sm">
          Version {num(payload["version"]) ?? "?"}
          {note ? ` — ${note}` : ""}
        </Text>
      );
    }

    case "config_restored":
      return (
        <Text size="sm">
          Version {num(payload["restoredFromVersion"]) ?? "?"} put back as
          version {num(payload["version"]) ?? "?"}
        </Text>
      );

    case "config_validation_failed": {
      const problems = Array.isArray(payload["problems"])
        ? (payload["problems"] as { path?: string; message?: string }[])
        : [];

      return (
        <Stack gap={2}>
          <Text size="sm">
            A task refused to run this source because its config does not match
            the schema.
          </Text>
          {problems.map((problem, index) => (
            <Text key={index} size="xs" c="red" ff="monospace">
              {problem.path}: {problem.message}
            </Text>
          ))}
        </Stack>
      );
    }

    case "sync_triggered":
      return (
        <Text size="sm">
          {str(payload["mode"]) ?? "unknown"} sync,{" "}
          {str(payload["trigger"]) === "manual" ? "by hand" : "scheduled"}
        </Text>
      );

    case "scheduling_changed":
    case "processing_changed":
      return (
        <Text size="sm">
          {onOff(payload["from"])} → {onOff(payload["to"])}
        </Text>
      );

    case "seller_changed":
      return (
        <Text size="sm">
          {str(payload["fromLabel"]) ?? "—"} → {str(payload["toLabel"]) ?? "—"}
        </Text>
      );

    default:
      return null;
  }
}

/**
 * The source's append-only trail, newest first.
 *
 * A record rather than a document: nothing here can be edited or put back, and
 * a config version is shown by number only — the config itself lives in the
 * version history panel, which is the one place it is stored.
 */
export function ProductSourceHistory({
  productSource,
}: {
  productSource: ProductSource;
}) {
  const actions: ProductSourceAction[] = productSource.actions ?? [];

  return (
    <DetailsSection
      title="History"
      description="What has happened to this source, newest first."
    >
      {actions.length === 0 && (
        <Text size="sm" c="dimmed">
          Nothing recorded for this source yet.
        </Text>
      )}

      <Stack gap="sm">
        {actions.map((action) => {
          const meta = ACTION_META[action.type];

          return (
            <Stack key={action.id} gap={2}>
              <Group gap="xs" wrap="wrap">
                <Badge color={meta?.color ?? "gray"} variant="light">
                  {meta?.label ?? action.type}
                </Badge>
                <Text size="xs" c="dimmed">
                  {formatDate(action.occurredAt)} · {describeActor(action)}
                </Text>
              </Group>
              <ActionDetail action={action} />
            </Stack>
          );
        })}
      </Stack>

      {actions.length >= DETAIL_ACTION_LIMIT && (
        <Text size="xs" c="dimmed">
          Showing the {DETAIL_ACTION_LIMIT} most recent entries.
        </Text>
      )}
    </DetailsSection>
  );
}
