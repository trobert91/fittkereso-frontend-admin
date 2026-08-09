"use client";

import { Badge, Button, Card, CopyButton, Flex, Grid, GridCol, Group, Text, Title, Tooltip } from "@mantine/core";
import { ProductModel } from "@/models/product-model";
import { ProductImageCarousel } from "../gallery/ProductImageCarousel";
import { ScoreRing } from "@/components/score-ring";
import { AdminSentimentBar } from "./AdminSentimentBar";
import { isNil } from "lodash";
import Link from "next/link";
import { routes } from "@/utils/routes";

export function ProductHeroHeader({ product }: { product: ProductModel }) {
  const rating = product.rating;
  const hasRating = !isNil(rating?.rating);
  const hasSentiment =
    !isNil(rating) &&
    (rating.strongPositiveReviewCount > 0 ||
      rating.positiveReviewCount > 0 ||
      rating.neutralReviewCount > 0 ||
      rating.mixedReviewCount > 0 ||
      rating.negativeReviewCount > 0 ||
      rating.strongNegativeReviewCount > 0);

  return (
    <Grid gutter="xl">
      <GridCol span={{ base: 12, md: 5 }}>
        <Card p="md" radius="md" withBorder>
          <ProductImageCarousel product={product} />
        </Card>
      </GridCol>

      <GridCol span={{ base: 12, md: 7 }}>
        <Group align="flex-start" justify="space-between" wrap="nowrap">
          <div>
            <Group gap="xs">
              {product.brand?.name && (
                <Button
                  component={Link}
                  href={routes.products.listFiltered({ categoryId: product.productCategory?.id, brandId: product.brand.id })}
                  size="compact-xs"
                  variant="light"
                >
                  {product.brand.name}
                </Button>
              )}
              {product.productCategory?.name && (
                <Button
                  component={Link}
                  href={routes.products.listFiltered({ categoryId: product.productCategory.id })}
                  size="compact-xs"
                  variant="subtle"
                  color="gray"
                >
                  {product.productCategory.name}
                </Button>
              )}
              {product.slug && (
                <CopyButton value={product.slug}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? "Copied!" : "slug"} withArrow>
                      <Badge
                        variant="light"
                        size="sm"
                        color="gray"
                        onClick={copy}
                        style={{ cursor: "pointer" }}
                      >
                        {product.slug}
                      </Badge>
                    </Tooltip>
                  )}
                </CopyButton>
              )}
            </Group>
            <Title order={1} mt={4}>
              {product.displayName}
            </Title>
            <Group gap="sm" mt="xs">
              <Text c="dimmed" size="sm">
                model: {product.model}
              </Text>
              {product.releaseYear && (
                <Badge variant="light" size="sm">
                  {product.releaseYear}
                </Badge>
              )}
            </Group>
            {product.aliases && product.aliases.length > 0 && (
              <Text size="sm" c="dimmed" mt={4}>
                Also known as:{" "}
                {product.aliases.map((a) => a.alias).join(", ")}
              </Text>
            )}
          </div>

          {hasRating && (
            <ScoreRing
              size={96}
              thickness={7}
              rate={rating!.rating!}
              reviewCount={rating!.totalReviewCount}
              showLabel
              withModal
            />
          )}
        </Group>

        {hasSentiment && (
          <Flex direction="column" gap="xs" mt="xl">
            <AdminSentimentBar
              strongPositive={rating!.strongPositiveReviewCount}
              positive={rating!.positiveReviewCount}
              neutral={rating!.neutralReviewCount}
              mixed={rating!.mixedReviewCount}
              negative={rating!.negativeReviewCount}
              strongNegative={rating!.strongNegativeReviewCount}
              variant="full"
            />
          </Flex>
        )}
      </GridCol>
    </Grid>
  );
}
