"use client";

import { useState } from "react";
import { Badge, Center, Group, Stack, Text, Tooltip } from "@mantine/core";
import { VscGitMerge } from "react-icons/vsc";
import { ProductResolutionRecord } from "@/api-actions/product/product-resolutions";
import { ProductModel } from "@/models/product-model";
import { ProductDetailsModal } from "@/components/product/details-modal";
import { ResolutionProductCard } from "./resolution-product-card";

/**
 * Which of the two products survives an accept.
 *
 * The backend merges oldest-wins (`selectMergeTarget`), so the newer product is
 * the one that disappears. That is the most consequential fact on a duplicate
 * row and the reviewer should not have to know the rule to see it, so it is
 * rendered rather than implied.
 */
function mergeTarget(
  productA?: ProductModel,
  productB?: ProductModel,
): { targetId?: string; sourceId?: string } {
  if (!productA || !productB) return {};

  const aCreated = new Date(productA.createdAt ?? 0).getTime();
  const bCreated = new Date(productB.createdAt ?? 0).getTime();

  return aCreated <= bCreated
    ? { targetId: productA.id, sourceId: productB.id }
    : { targetId: productB.id, sourceId: productA.id };
}

/** Side-by-side comparison of a `duplicate_detection` pair. */
export function ResolutionPairStrip({
  resolution,
  showMergeDirection = true,
}: {
  resolution: ProductResolutionRecord;
  /** Suppressed once the merge has already happened — the direction is then
   *  history, told by the decision log instead. */
  showMergeDirection?: boolean;
}) {
  const [detailProductId, setDetailProductId] = useState<string | null>(null);

  const { productA, productB } = resolution;
  const { targetId, sourceId } = mergeTarget(productA, productB);

  const cardFor = (product?: ProductModel) => {
    if (!product) {
      return (
        <Text size="sm" c="dimmed">
          product no longer exists
        </Text>
      );
    }

    const isTarget = showMergeDirection && product.id === targetId;
    const isSource = showMergeDirection && product.id === sourceId;

    return (
      <ResolutionProductCard
        product={product}
        specs
        onClick={() => setDetailProductId(product.id)}
        badges={
          <>
            {isTarget && (
              <Tooltip
                label="Accepting merges into this product — it is the older of the two, so it is the one that survives."
                withArrow
              >
                <Badge color="green" variant="light" size="xs" tt="none">
                  survives merge
                </Badge>
              </Tooltip>
            )}
            {isSource && (
              <Tooltip
                label="Accepting folds this product into the other one and then deletes it. Its listings move across, so the merge stays reversible."
                withArrow
              >
                <Badge color="red" variant="light" size="xs" tt="none">
                  merged away
                </Badge>
              </Tooltip>
            )}
            {product.releaseYear && (
              <Badge color="gray" variant="light" size="xs" tt="none">
                {product.releaseYear}
              </Badge>
            )}
          </>
        }
      />
    );
  };

  return (
    <>
      <Group align="flex-start" gap="md" wrap="wrap">
        {cardFor(productA)}

        <Center style={{ minHeight: 130 }}>
          <Stack align="center" gap={2}>
            <VscGitMerge size={18} color="var(--mantine-color-dimmed)" />
            <Text size="xs" c="dimmed">
              {resolution.similarityScore}% alike
            </Text>
          </Stack>
        </Center>

        {cardFor(productB)}
      </Group>

      <ProductDetailsModal
        productId={detailProductId}
        opened={detailProductId !== null}
        onClose={() => setDetailProductId(null)}
      />
    </>
  );
}
