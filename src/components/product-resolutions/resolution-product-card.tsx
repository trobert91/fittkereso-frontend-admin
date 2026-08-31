"use client";

import { Badge, Box, Group, Image, Progress, Stack, Text, Tooltip } from "@mantine/core";
import { ProductModel } from "@/models/product-model";
import { ProductSpecsBadges } from "@/components/product/product-specs-badges";

export const CARD_WIDTH = 240;
export const IMAGE_HEIGHT = 130;

/**
 * One product as the review queue shows it: picture, name, brand/category, and
 * an optional score bar. Deliberately the same shape as the candidate strip in
 * userscores' comment card — the point is that a reviewer recognises the
 * product at a glance rather than reading an id.
 *
 * Clicking is wired by the parent (which owns the details modal), so this stays
 * a presentational component.
 */
export function ResolutionProductCard({
  product,
  fallbackName,
  score,
  scoreLabel,
  badges,
  footer,
  specs = false,
  dimmed = false,
  onClick,
}: {
  product?: ProductModel;
  /** Shown when there is no product object — e.g. a candidate whose only
   *  record is the jsonb snapshot. */
  fallbackName?: string;
  score?: number;
  scoreLabel?: string;
  badges?: React.ReactNode;
  footer?: React.ReactNode;
  specs?: boolean;
  dimmed?: boolean;
  onClick?: () => void;
}) {
  const displayName =
    product?.displayName ?? product?.model ?? fallbackName ?? "unresolved";
  const imageUrl =
    product?.mainImage?.url ?? product?.images?.find((img) => !!img.url)?.url;
  const clickable = !!onClick;

  return (
    <Box
      p="xs"
      style={{
        width: CARD_WIDTH,
        flexShrink: 0,
        cursor: clickable ? "pointer" : "default",
        opacity: dimmed ? 0.6 : 1,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
      onClick={onClick}
    >
      <Box
        style={{
          height: IMAGE_HEIGHT,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--mantine-color-dark-7)",
          borderRadius: "var(--mantine-radius-xs)",
          overflow: "hidden",
        }}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={displayName}
            h={IMAGE_HEIGHT}
            w={CARD_WIDTH}
            fit="contain"
          />
        ) : (
          <Text size="xs" c="dimmed">
            no image
          </Text>
        )}
      </Box>

      <Stack gap={4}>
        <Text size="xs" fw={600} lineClamp={2}>
          {displayName}
        </Text>

        {(product?.brand?.name || product?.productCategory?.name) && (
          <Text size="xs" c="dimmed" lineClamp={1}>
            {[product?.brand?.name, product?.productCategory?.name]
              .filter(Boolean)
              .join(" · ")}
          </Text>
        )}

        {score !== undefined && (
          <Tooltip label={scoreLabel ?? `score: ${Math.round(score)}`} withArrow>
            <Group gap={6} wrap="nowrap" align="center">
              <Progress
                value={Math.max(0, Math.min(100, score))}
                size="sm"
                radius="sm"
                style={{ flex: 1 }}
              />
              <Text
                size="xs"
                c="dimmed"
                style={{ minWidth: 22, textAlign: "right" }}
              >
                {Math.round(score)}
              </Text>
            </Group>
          </Tooltip>
        )}

        {badges && (
          <Group gap={4} wrap="wrap">
            {badges}
          </Group>
        )}

        {specs && product?.orderedSpecs && (
          <ProductSpecsBadges specs={product.orderedSpecs} />
        )}

        {footer}
      </Stack>
    </Box>
  );
}

/** Stand-in card for the scraped listing itself — the left-hand "input" side of
 *  a scrape-time resolution, which by definition has no product yet. */
export function ResolutionListingCard({
  title,
  subtitle,
  lines,
}: {
  title: string;
  subtitle?: string;
  lines?: (string | undefined)[];
}) {
  return (
    <Box
      p="sm"
      style={{
        width: CARD_WIDTH,
        flexShrink: 0,
        minHeight: IMAGE_HEIGHT + 60,
        border: "1px dashed var(--mantine-color-dark-4)",
        borderRadius: "var(--mantine-radius-sm)",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        justifyContent: "center",
      }}
    >
      <Badge color="gray" variant="light" size="xs" tt="none" w="fit-content">
        scraped listing
      </Badge>
      <Text size="sm" fw={600} lineClamp={3}>
        {title}
      </Text>
      {subtitle && (
        <Text size="xs" c="dimmed" lineClamp={1}>
          {subtitle}
        </Text>
      )}
      {lines?.filter(Boolean).map((line, index) => (
        <Text key={index} size="xs" c="dimmed" lineClamp={1}>
          {line}
        </Text>
      ))}
    </Box>
  );
}
