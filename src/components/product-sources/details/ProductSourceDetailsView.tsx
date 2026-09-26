"use client";

import { ReactNode } from "react";
import Link from "next/link";
import {
  Anchor,
  Badge,
  Box,
  Button,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { FaEdit } from "react-icons/fa";
import { IoMdInformationCircleOutline } from "react-icons/io";
import { CopyIdBadge } from "@/components/copy-id-badge";
import { JsonEditor } from "@/components/JsonEditor";
import { ProductSource } from "@/models/dtos/product-source-search-models";
import {
  isFeedSourceType,
  PRODUCT_SOURCE_TYPE_COLORS,
} from "@/models/product-source";
import { formatDate } from "@/utils/date";
import { routes } from "@/utils/routes";

/**
 * One block of fields as label/value rows. Its title matches the edit form's
 * section, so a field sits under the same heading in both modes; the form's
 * longer explanation moves into the info tooltip to keep the view dense.
 */
function FieldGroup({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Stack gap={6}>
      <Group gap={4} wrap="nowrap">
        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
          {title}
        </Text>
        {description && (
          <Tooltip label={description} multiline w={300} withArrow>
            <Box
              component="span"
              c="dimmed"
              style={{ display: "inline-flex", cursor: "help" }}
            >
              <IoMdInformationCircleOutline size={14} />
            </Box>
          </Tooltip>
        )}
      </Group>
      <Box
        style={{
          display: "grid",
          gridTemplateColumns: "max-content minmax(0, 1fr)",
          columnGap: "var(--mantine-spacing-md)",
          rowGap: 4,
          alignItems: "center",
        }}
      >
        {children}
      </Box>
    </Stack>
  );
}

/**
 * One label/value row. The value is rendered by the caller so a field can be a
 * badge, a link or a copyable id, but an unset one reads "—" everywhere
 * instead of collapsing to blank space.
 */
function Field({ label, value }: { label: string; value: ReactNode }) {
  const isEmpty = value === null || value === undefined || value === "";

  return (
    <>
      <Text size="sm" c="dimmed">
        {label}
      </Text>
      {isEmpty ? (
        <Text size="sm" c="dimmed">
          —
        </Text>
      ) : (
        <Box fz="sm" style={{ minWidth: 0, overflowWrap: "anywhere" }}>
          {value}
        </Box>
      )}
    </>
  );
}

/** A switch's state. The row's label names the setting, so this only says which way it is set. */
function StateBadge({
  on,
  onLabel = "On",
  offLabel = "Off",
}: {
  on: boolean;
  onLabel?: string;
  offLabel?: string;
}) {
  return (
    <Badge size="sm" variant="light" color={on ? "green" : "gray"} tt="none">
      {on ? onLabel : offLabel}
    </Badge>
  );
}

function DimmedText({ children }: { children: ReactNode }) {
  return (
    <Text size="sm" c="dimmed" component="span">
      {children}
    </Text>
  );
}

export function ProductSourceDetailsView({
  productSource,
  onEdit,
}: {
  productSource: ProductSource;
  onEdit?: () => void;
}) {
  const config = productSource.config;
  const isFeed = isFeedSourceType(productSource.type);
  const categories = config?.categories ?? {};
  const enabledCategories = Object.entries(categories)
    .filter(([, category]) => category?.enabled)
    .map(([slug]) => slug);
  const startUrls = Array.isArray(config?.startUrls)
    ? (config.startUrls as string[])
    : [];

  return (
    <Stack gap="md">
      <Paper withBorder p="md" radius="md">
        <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
          <SimpleGrid
            cols={{ base: 1, sm: 2, lg: 3 }}
            spacing="xl"
            verticalSpacing="md"
            style={{ flexGrow: 1, minWidth: 0 }}
          >
            <FieldGroup title="General">
              <Field label="Name" value={productSource.name} />
              <Field
                label="Seller"
                value={
                  productSource.seller ? (
                    <Anchor
                      component={Link}
                      href={routes.sellers.details(productSource.seller.id)}
                      size="sm"
                    >
                      {productSource.seller.name}
                    </Anchor>
                  ) : null
                }
              />
              {/* Which config format this source uses, and therefore what the
                  run actually does — fixed at creation. */}
              <Field
                label="Type"
                value={
                  <Badge
                    size="sm"
                    variant="light"
                    color={PRODUCT_SOURCE_TYPE_COLORS[productSource.type]}
                  >
                    {productSource.type}
                  </Badge>
                }
              />
              <Field label="ID" value={<CopyIdBadge id={productSource.id} />} />
              <Field label="Created" value={formatDate(productSource.createdAt)} />
              <Field label="Updated" value={formatDate(productSource.updatedAt)} />
            </FieldGroup>

            <Stack gap="md">
              <FieldGroup
                title="Scheduling & processing"
                description="Scheduling gates the sync cron; processing gates whether the collector claims this source's queued tasks at all."
              >
                <Field
                  label="Scheduling"
                  value={<StateBadge on={productSource.schedulingEnabled} />}
                />
                <Field
                  label="Processing"
                  value={<StateBadge on={productSource.processingEnabled} />}
                />
                <Field label="Priority" value={productSource.priority} />
                <Field
                  label="Identifies products"
                  value={
                    <StateBadge
                      on={productSource.identifiesProducts}
                      onLabel="Yes"
                      offLabel="No"
                    />
                  }
                />
                <Field
                  label="Has all products"
                  value={
                    <StateBadge
                      on={productSource.hasAllProducts}
                      onLabel="Yes"
                      offLabel="No"
                    />
                  }
                />
              </FieldGroup>

              <FieldGroup
                title="Throttling"
                description="The seller's own caps apply on top of these — whichever is lower wins."
              >
                <Field label="Max concurrent" value={productSource.maxConcurrent} />
                <Field
                  label="Requests per hour"
                  value={productSource.requestsPerHour}
                />
              </FieldGroup>
            </Stack>

            <Stack gap="md">
              <FieldGroup
                title="Schedule"
                description="Runs are started overnight, between 02:00 and 06:00. An unset next-run time means this source is due on the next tick inside that window."
              >
                <Field label="Frequency" value={productSource.frequency} />
                <Field
                  label="Next run"
                  value={
                    formatDate(productSource.nextRunAt) || (
                      <DimmedText>Due on next tick</DimmedText>
                    )
                  }
                />
                <Field label="Last run" value={formatDate(productSource.lastRunAt)} />
              </FieldGroup>

              <FieldGroup
                title="Run size"
                description="Caps how many items one run imports, for small test runs. Empty for full runs."
              >
                <Field
                  label="Max items per run"
                  value={
                    typeof config?.maxItems === "number" ? (
                      config.maxItems
                    ) : (
                      <DimmedText>No cap</DimmedText>
                    )
                  }
                />
              </FieldGroup>
            </Stack>
          </SimpleGrid>

          {onEdit && (
            <Button
              size="xs"
              variant="light"
              leftSection={<FaEdit size={12} />}
              onClick={onEdit}
            >
              Edit
            </Button>
          )}
        </Group>
      </Paper>

      <Paper withBorder p="md" radius="md">
        <Stack gap="sm">
          <FieldGroup
            title="Config"
            description={
              isFeed
                ? "Where the product feed is, and how its fields map onto ours."
                : "The declarative scraping definition interpreted by the scrape interpreter."
            }
          >
            <Field label="Base URL" value={config?.baseUrl} />
            {/* The two shapes share no keys, so each type shows its own entry
                point. This used to read `fullSyncStartUrl`, which no config
                has carried since start URLs replaced it — so the field
                rendered empty for every source rather than saying anything. */}
            {isFeed ? (
              <Field
                label="Feed URL"
                value={config?.feedUrl as string | undefined}
              />
            ) : (
              <Field
                label="Start URLs"
                value={
                  startUrls.length > 0 ? (
                    <Stack gap={0}>
                      {startUrls.map((url) => (
                        <Text key={url} size="sm">
                          {url}
                        </Text>
                      ))}
                    </Stack>
                  ) : null
                }
              />
            )}
            <Field
              label="Enabled categories"
              value={
                enabledCategories.length > 0 ? (
                  <Group gap={4}>
                    {enabledCategories.map((slug) => (
                      <Badge key={slug} size="sm" variant="light" tt="none">
                        {slug}
                      </Badge>
                    ))}
                  </Group>
                ) : null
              }
            />
          </FieldGroup>

          <JsonEditor
            label="Raw config"
            value={JSON.stringify(config ?? {}, null, 2)}
            schema={undefined}
            disabled
            showFormatButton={false}
            minHeight={200}
            maxHeight={400}
          />
        </Stack>
      </Paper>
    </Stack>
  );
}
