"use client";

import { useState } from "react";
import { Badge, Button, Group, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";
import { FaUndo } from "react-icons/fa";
import { JsonEditor } from "@/components/JsonEditor";
import { DetailsSection } from "@/components/details/details-section";
import { restoreProductSourceVersion } from "@/api-actions/product-source/product-source-history";
import { ProductSource } from "@/models/dtos/product-source-search-models";
import {
  describeActor,
  ProductSourceVersion,
} from "@/models/dtos/product-source-history-models";
import { formatDate } from "@/utils/date";

// Mirrors DETAIL_VERSION_LIMIT in product-source-version.service.ts — how many
// versions one detail response carries.
const DETAIL_VERSION_LIMIT = 50;

/**
 * Every configuration this source has had, newest number first, and the way to
 * put an old one back.
 *
 * Renders from the source it is given rather than fetching: the detail, update
 * and restore responses all carry the history, so this panel is never showing
 * a list the last save has already moved past.
 *
 * Restoring is a COPY — v2 put back while v5 is in force becomes v6, the row it
 * came from stays where it is, and the restore is itself reversible. That is
 * why the button is offered on every row except the current one: there is no
 * version it can destroy.
 */
export function ProductSourceVersions({
  productSource,
  onRestored,
}: {
  productSource: ProductSource;
  /** Hands back the source the restore returned, history included. */
  onRestored?: (updated: ProductSource) => void;
}) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [restoring, setRestoring] = useState<number | null>(null);

  const versions: ProductSourceVersion[] = productSource.versions ?? [];

  // The highest number is the one in force. Read off the first row rather than
  // recomputed: the list is ordered by it.
  const currentVersion = versions[0]?.version ?? null;

  const confirmRestore = (version: ProductSourceVersion) => {
    modals.openConfirmModal({
      title: `Restore version ${version.version}?`,
      children: (
        <Text size="sm">
          This writes a <strong>new</strong> version carrying v
          {version.version}&apos;s config. Nothing is deleted — v
          {currentVersion} stays in the history, and you can restore it again to
          undo this.
        </Text>
      ),
      labels: { confirm: "Restore", cancel: "Cancel" },
      onConfirm: () => void restore(version.version),
    });
  };

  const restore = async (version: number) => {
    setRestoring(version);

    try {
      const updated = await restoreProductSourceVersion(
        productSource.id,
        version,
      );

      notifications.show({
        title: "Restored",
        message: `Version ${version} is back in force, as version ${updated.versions?.[0]?.version ?? "the newest"}.`,
        color: "green",
      });

      setExpanded(null);
      onRestored?.(updated);
    } catch (restoreError: any) {
      notifications.show({
        title: "Restore failed",
        message: restoreError?.message ?? "Could not restore that version",
        color: "red",
      });
    } finally {
      setRestoring(null);
    }
  };

  return (
    <DetailsSection
      title="Config history"
      description="Every configuration this source has had. Restoring an older one writes a new version rather than overwriting anything."
    >
      {versions.length === 0 && (
        <Text size="sm" c="dimmed">
          No config versions yet. The next config change will create version 1.
        </Text>
      )}

      <Stack gap="xs">
        {versions.map((version) => {
          const isCurrent = version.version === currentVersion;

          return (
            <Stack
              key={version.id}
              gap={6}
              p="xs"
              style={{
                borderRadius: 6,
                border: "1px solid var(--mantine-color-default-border)",
              }}
            >
              <Group justify="space-between" wrap="nowrap">
                <Group gap="xs" wrap="wrap">
                  <Badge variant="filled">v{version.version}</Badge>
                  {isCurrent && (
                    <Badge color="green" variant="light">
                      in force
                    </Badge>
                  )}
                  {version.restoredFromVersion != null && (
                    <Badge color="grape" variant="light">
                      restored from v{version.restoredFromVersion}
                    </Badge>
                  )}
                  <Text size="sm" c="dimmed">
                    {formatDate(version.createdAt)} · {describeActor(version)}
                  </Text>
                </Group>

                <Group gap="xs" wrap="nowrap">
                  <Button
                    size="compact-sm"
                    variant="subtle"
                    onClick={() =>
                      setExpanded(
                        expanded === version.version ? null : version.version,
                      )
                    }
                  >
                    {expanded === version.version ? "Hide" : "Show config"}
                  </Button>

                  {/* Hidden rather than disabled on the version already in
                      force: the API answers that with a conflict, so offering
                      it would only produce an error. */}
                  {!isCurrent && (
                    <Button
                      size="compact-sm"
                      variant="light"
                      leftSection={<FaUndo size={11} />}
                      loading={restoring === version.version}
                      onClick={() => confirmRestore(version)}
                    >
                      Restore
                    </Button>
                  )}
                </Group>
              </Group>

              {version.note && (
                <Text size="sm" fs="italic">
                  {version.note}
                </Text>
              )}

              {expanded === version.version && (
                <JsonEditor
                  value={JSON.stringify(version.config, null, 2)}
                  schema={undefined}
                  disabled
                  showFormatButton={false}
                  minHeight={200}
                  maxHeight={400}
                />
              )}
            </Stack>
          );
        })}
      </Stack>

      {/* The detail response carries a bounded slice of the history, so a
          source edited many times would otherwise look like it stops here. */}
      {versions.length >= DETAIL_VERSION_LIMIT && (
        <Text size="xs" c="dimmed">
          Showing the {DETAIL_VERSION_LIMIT} most recent versions.
        </Text>
      )}
    </DetailsSection>
  );
}
