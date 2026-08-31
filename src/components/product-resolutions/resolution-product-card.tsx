"use client";

import {
  Badge,
  Box,
  Button,
  Group,
  Image,
  Progress,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { LuExternalLink } from "react-icons/lu";
import { ResolutionListingSummary } from "@/api-actions/product/product-resolutions";
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
  selected = false,
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
  /** The outcome under review — the candidate the system chose, or the product
   *  a merge would keep. Carries the green treatment. */
  selected?: boolean;
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
        // Every product is bounded, so the strip reads as a set of comparable
        // things; the selected one is the only filled card, which is what makes
        // the decision under review findable at a glance.
        border: selected
          ? "2px solid var(--mantine-color-green-6)"
          : "1px solid var(--mantine-color-dark-4)",
        borderRadius: "var(--mantine-radius-sm)",
        background: selected
          ? "var(--mantine-color-green-light)"
          : "transparent",
      }}
      onClick={onClick}
    >
      <Box
        style={{
          height: IMAGE_HEIGHT,
          // The card is a flex column stretched to the row's height; without
          // this the image box is the only shrinkable child and gets squeezed.
          flexShrink: 0,
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

        {/* Denormalized from this product's cheapest active offer — the same
            rule the listing summary uses, so the two sit side by side. */}
        {product?.price != null && (
          <ProductPrice
            price={product.price}
            priceWithoutDiscount={product.priceWithoutDiscount}
          />
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

/**
 * The scraped listing — the "input" side of a scrape-time resolution, which by
 * definition has no product of its own yet.
 *
 * Shows the listing's own picture, brand and raw title alongside its price, so
 * the comparison against the matched product can be made from the card without
 * opening anything. The dashed border keeps it visually distinct from the real
 * product cards beside it.
 */
export function ResolutionListingCard({
  listing,
  title,
  subtitle,
  lines,
}: {
  listing?: ResolutionListingSummary;
  /** Fallback when the listing snapshot carries no name of its own. */
  title: string;
  subtitle?: string;
  lines?: (string | undefined)[];
}) {
  const imageUrl = listing?.imageUrl;
  // The raw listing title is the more useful one for spotting a bad match — it
  // is what the source actually said, before boilerplate was stripped out.
  const name = listing?.originalName ?? listing?.displayName ?? title;

  return (
    <Box
      p="xs"
      style={{
        width: CARD_WIDTH,
        flexShrink: 0,
        border: "1px dashed var(--mantine-color-dark-4)",
        borderRadius: "var(--mantine-radius-sm)",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <Box
        style={{
          height: IMAGE_HEIGHT,
          // The card is a flex column stretched to the row's height; without
          // this the image box is the only shrinkable child and gets squeezed.
          flexShrink: 0,
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
            alt={name}
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
        <Badge color="gray" variant="light" size="xs" tt="none" w="fit-content">
          scraped listing
        </Badge>

        {listing?.brand && (
          <Text size="xs" c="blue" fw={500} lineClamp={1}>
            {listing.brand}
          </Text>
        )}

        <Text size="xs" fw={600} lineClamp={3}>
          {name}
        </Text>

        <ListingPrice listing={listing} />

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

        {listing?.url && (
          <Button
            component="a"
            href={listing.url}
            target="_blank"
            rel="noopener noreferrer"
            size="compact-xs"
            variant="light"
            color="gray"
            leftSection={<LuExternalLink size={10} />}
            onClick={(event) => event.stopPropagation()}
          >
            open listing
          </Button>
        )}
      </Stack>
    </Box>
  );
}

/** A product's denormalized price, rendered the same way as the listing's so
 *  the two can be compared at a glance. */
function ProductPrice({
  price,
  priceWithoutDiscount,
}: {
  price: number;
  priceWithoutDiscount?: number;
}) {
  const discounted =
    priceWithoutDiscount != null && priceWithoutDiscount > price;

  return (
    <Group gap={6} wrap="wrap" align="baseline">
      <Text size="sm" fw={700}>
        {formatPrice(price)}
      </Text>
      {discounted && (
        <Text size="xs" c="dimmed" td="line-through">
          {formatPrice(priceWithoutDiscount)}
        </Text>
      )}
    </Group>
  );
}

/** The listing's price next to its pre-discount price, when discounted. Both
 *  come from the cheapest offer, which is also how the product derives the
 *  price shown opposite — so the two numbers are comparable. */
export function ListingPrice({
  listing,
}: {
  listing?: ResolutionListingSummary;
}) {
  if (listing?.price == null) return null;

  const discounted =
    listing.priceWithoutDiscount != null &&
    listing.priceWithoutDiscount > listing.price;

  return (
    <Group gap={6} wrap="wrap" align="baseline">
      <Text size="sm" fw={700}>
        {formatPrice(listing.price, listing.currency)}
      </Text>
      {discounted && (
        <Text size="xs" c="dimmed" td="line-through">
          {formatPrice(listing.priceWithoutDiscount, listing.currency)}
        </Text>
      )}
      {(listing.offerCount ?? 0) > 1 && (
        <Tooltip
          label={`This listing had ${listing.offerCount} offers (size/colour variants). The cheapest is shown, matching how the product's own price is derived.`}
          withArrow
          multiline
          maw={300}
        >
          <Badge color="gray" variant="light" size="xs" tt="none">
            cheapest of {listing.offerCount}
          </Badge>
        </Tooltip>
      )}
    </Group>
  );
}

export function formatPrice(value?: number, currency?: string): string {
  if (value == null) return "—";
  return `${Math.round(value).toLocaleString("hu-HU")}${currency ? ` ${currency}` : ""}`;
}
