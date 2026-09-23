"use client";

import { ReactNode } from "react";
import Link from "next/link";
import {
  Anchor,
  Badge,
  Group,
  SimpleGrid,
  Stack,
  Text,
} from "@mantine/core";
import { CopyIdBadge } from "@/components/copy-id-badge";
import { JsonEditor } from "@/components/JsonEditor";
import { DetailsSection } from "@/components/details/details-section";
import { ProductSource } from "@/models/dtos/product-source-search-models";
import { formatDate } from "@/utils/date";
import { routes } from "@/utils/routes";

/**
 * A single label/value pair. Values are rendered by the caller so a field can
 * be a badge, a link or a copyable id, but the empty case is handled here so
 * every unset field reads the same way instead of collapsing to blank space.
 */
function DetailItem({
  label,
  value,
  description,
}: {
  label: string;
  value: ReactNode;
  description?: string;
}) {
  const isEmpty =
    value === null || value === undefined || value === "" || value === false;

  return (
    <Stack gap={2}>
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
        {label}
      </Text>
      {isEmpty ? (
        <Text size="sm" c="dimmed">
          —
        </Text>
      ) : (
        <Text size="sm" component="div">
          {value}
        </Text>
      )}
      {description && (
        <Text size="xs" c="dimmed">
          {description}
        </Text>
      )}
    </Stack>
  );
}

function BoolBadge({ value, label }: { value: boolean; label: string }) {
  return (
    <Badge color={value ? "green" : "gray"} variant="light" tt="none">
      {value ? label : `${label} off`}
    </Badge>
  );
}

export function ProductSourceDetailsView({
  productSource,
}: {
  productSource: ProductSource;
}) {
  const config = productSource.config;
  const categories = config?.categories ?? {};
  const enabledCategories = Object.entries(categories)
    .filter(([, category]) => category?.enabled)
    .map(([slug]) => slug);

  return (
    <Stack gap="md">
      <DetailsSection title="General">
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
          <DetailItem label="Name" value={productSource.name} />
          <DetailItem
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
          {/* Which config format this source uses, and therefore what the run
              actually does — fixed at creation. */}
          <DetailItem
            label="Type"
            value={
              <Badge
                variant="light"
                color={productSource.type === "arukereso" ? "grape" : "blue"}
              >
                {productSource.type}
              </Badge>
            }
          />
          <DetailItem
            label="ID"
            value={<CopyIdBadge id={productSource.id} />}
          />
          <DetailItem
            label="Created"
            value={formatDate(productSource.createdAt)}
          />
          <DetailItem
            label="Updated"
            value={formatDate(productSource.updatedAt)}
          />
          <DetailItem
            label="Last run"
            value={formatDate(productSource.lastRunAt)}
          />
        </SimpleGrid>
      </DetailsSection>

      <DetailsSection
        title="Scheduling & processing"
        description="Scheduling gates the sync cron; processing gates whether the collector claims this source's queued tasks at all."
      >
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
          <DetailItem
            label="Scheduling"
            value={
              <BoolBadge
                value={productSource.schedulingEnabled}
                label="Scheduling on"
              />
            }
          />
          <DetailItem
            label="Processing"
            value={
              <BoolBadge
                value={productSource.processingEnabled}
                label="Processing on"
              />
            }
          />
          <DetailItem label="Priority" value={productSource.priority} />
        </SimpleGrid>
      </DetailsSection>

      <DetailsSection
        title="Throttling"
        description="The seller's own caps apply on top of these — whichever is lower wins."
      >
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
          <DetailItem
            label="Max concurrent"
            value={productSource.maxConcurrent}
          />
          <DetailItem
            label="Requests per hour"
            value={productSource.requestsPerHour}
          />
        </SimpleGrid>
      </DetailsSection>

      <DetailsSection
        title="Schedule"
        description="Runs are started overnight, between 02:00 and 06:00. An unset next-run time means this source is due on the next tick inside that window."
      >
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
          <DetailItem label="Frequency" value={productSource.frequency} />
          <DetailItem
            label="Next run"
            value={formatDate(productSource.nextRunAt)}
          />
          <DetailItem
            label="Last run"
            value={formatDate(productSource.lastRunAt)}
          />
        </SimpleGrid>
      </DetailsSection>

      <DetailsSection
        title="Config"
        description={
          productSource.type === "arukereso"
            ? "Where the product feed is, and how its fields map onto ours."
            : "The declarative scraping definition interpreted by the scrape interpreter."
        }
      >
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <DetailItem label="Base URL" value={config?.baseUrl} />
          {/* The two shapes share no keys, so each type shows its own entry
              point. This used to read `fullSyncStartUrl`, which no config has
              carried since start URLs replaced it — so the field rendered
              empty for every source rather than saying anything. */}
          {productSource.type === "arukereso" ? (
            <DetailItem
              label="Feed URL"
              value={config?.feedUrl as string | undefined}
            />
          ) : (
            <DetailItem
              label="Start URLs"
              value={
                Array.isArray(config?.startUrls) && config.startUrls.length > 0 ? (
                  <Stack gap={2}>
                    {(config.startUrls as string[]).map((url) => (
                      <Text key={url} size="sm">
                        {url}
                      </Text>
                    ))}
                  </Stack>
                ) : null
              }
            />
          )}
        </SimpleGrid>

        <DetailItem
          label="Enabled categories"
          value={
            enabledCategories.length > 0 ? (
              <Group gap="xs">
                {enabledCategories.map((slug) => (
                  <Badge key={slug} variant="light" tt="none">
                    {slug}
                  </Badge>
                ))}
              </Group>
            ) : null
          }
        />

        <JsonEditor
          label="Raw config"
          value={JSON.stringify(config ?? {}, null, 2)}
          schema={undefined}
          disabled
          showFormatButton={false}
          minHeight={200}
          maxHeight={400}
        />
      </DetailsSection>
    </Stack>
  );
}
