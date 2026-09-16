"use client";

import { useEffect, useState } from "react";
import {
  Anchor,
  Badge,
  Button,
  Card,
  Center,
  Grid,
  GridCol,
  Group,
  Image,
  Loader,
  Modal,
  Stack,
  Text,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { sortBy } from "lodash";
import Link from "next/link";
import { getProductById } from "@/api-actions/product/get-product";
import {
  postDismissProductDuplicate,
  postMergeProductDuplicate,
} from "@/api-actions/product-duplicate/product-duplicate-actions";
import { ProductDuplicatePair } from "@/models/dtos/product-duplicate-search-models";
import { ProductModel } from "@/models/product-model";
import { routes } from "@/utils/routes";
import { FailedGateBadges, formatSpecValue } from "./failed-gate-badges";

interface DuplicatePairCompareModalProps {
  pair: ProductDuplicatePair | null;
  onClose: () => void;
  onComplete: () => void;
}

function ProductColumn({
  product,
  contradictingSpecs,
}: {
  product: ProductModel;
  contradictingSpecs: Set<string>;
}) {
  const imageUrl =
    product.mainImage?.url ?? sortBy(product.images ?? [], "order")[0]?.url;

  return (
    <Stack gap="sm">
      <Card p="xs" radius="md" withBorder h={180}>
        <Center h="100%">
          {imageUrl ? (
            <Image src={imageUrl} alt={product.displayName} h={160} fit="contain" />
          ) : (
            <Text size="sm" c="dimmed">
              No image
            </Text>
          )}
        </Center>
      </Card>

      <Stack gap={4}>
        <Anchor
          component={Link}
          href={routes.products.details(product.id)}
          target="_blank"
          size="sm"
          fw={600}
        >
          {product.displayName}
        </Anchor>
        <Text size="sm" c="blue">
          {product.brand?.name ?? "—"}
        </Text>
        <Text size="xs" c="dimmed">
          Model: {product.model}
        </Text>
        <Text size="xs" c="dimmed">
          Name key: {product.normalizedName ?? "—"}
        </Text>
        <Group gap="xs">
          <Badge variant="light" size="sm">
            {product.sources?.length ?? 0} listings
          </Badge>
          <Badge variant="light" size="sm">
            {product.offers?.length ?? 0} offers
          </Badge>
        </Group>
      </Stack>

      {(product.orderedSpecs ?? []).length > 0 && (
        <Stack gap={2}>
          <Text size="xs" fw={600} mt="xs">
            Specs
          </Text>
          {(product.orderedSpecs ?? []).map((spec) => (
            <Group
              key={spec.key}
              gap={4}
              wrap="nowrap"
              style={{
                backgroundColor: contradictingSpecs.has(spec.key)
                  ? "var(--mantine-color-red-light)"
                  : undefined,
                borderRadius: 4,
                padding: "2px 6px",
              }}
            >
              <Text size="xs" c="dimmed" style={{ minWidth: 110 }}>
                {spec.label}
              </Text>
              <Text size="xs">{formatSpecValue(spec.value)}</Text>
            </Group>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

export function DuplicatePairCompareModal({
  pair,
  onClose,
  onComplete,
}: DuplicatePairCompareModalProps) {
  const [products, setProducts] = useState<[ProductModel, ProductModel] | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [survivorId, setSurvivorId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setProducts(null);
    setSurvivorId(null);
    if (!pair) return;

    let cancelled = false;
    setLoading(true);
    Promise.all([getProductById(pair.productAId), getProductById(pair.productBId)])
      .then(([productA, productB]) => {
        if (cancelled) return;
        if (!productA || !productB) {
          throw new Error("One of the two products no longer exists");
        }
        setProducts([productA, productB]);
      })
      .catch((err) => {
        if (cancelled) return;
        notifications.show({
          color: "red",
          title: "Failed to load the pair",
          message: err instanceof Error ? err.message : "An error occurred",
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pair]);

  const runAction = async (action: () => Promise<unknown>, title: string) => {
    setSubmitting(true);
    try {
      await action();
      notifications.show({ color: "green", title, message: "" });
      onClose();
      onComplete();
    } catch (err) {
      notifications.show({
        color: "red",
        title: "Action failed",
        message: err instanceof Error ? err.message : "An error occurred",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const contradictingSpecs = new Set(
    (pair?.failedGates ?? []).flatMap((gate) => (gate.spec ? [gate.spec] : [])),
  );
  const survivor = products?.find((product) => product.id === survivorId);
  const mergedAway = products?.find((product) => product.id !== survivorId);

  return (
    <Modal
      opened={!!pair}
      onClose={() => !submitting && onClose()}
      title="Compare possible duplicates"
      centered
      size="xl"
    >
      {loading && (
        <Center py="xl">
          <Loader />
        </Center>
      )}

      {!loading && pair && products && (
        <Stack gap="md">
          <Group gap="xs">
            <Badge
              size="lg"
              variant="light"
              color={pair.similarityScore >= 80 ? "green" : "yellow"}
            >
              Score {pair.similarityScore}
            </Badge>
            <Text size="sm" c="dimmed">
              Matched on {pair.matchedOn}: {pair.matchedValue}
            </Text>
          </Group>
          <FailedGateBadges gates={pair.failedGates} />

          <Grid gutter="lg">
            <GridCol span={6}>
              <ProductColumn
                product={products[0]}
                contradictingSpecs={contradictingSpecs}
              />
            </GridCol>
            <GridCol span={6}>
              <ProductColumn
                product={products[1]}
                contradictingSpecs={contradictingSpecs}
              />
            </GridCol>
          </Grid>

          {pair.dismissedAt ? (
            <Text size="sm" c="dimmed">
              Dismissed as two different products.
            </Text>
          ) : survivor && mergedAway ? (
            <Stack gap="xs">
              <Text size="sm">
                Keep <b>{survivor.displayName}</b>? <b>{mergedAway.displayName}</b>{" "}
                is deleted, and its listings, offers, images, aliases and price
                history move to the product you keep.
              </Text>
              <Group justify="flex-end">
                <Button
                  variant="default"
                  onClick={() => setSurvivorId(null)}
                  disabled={submitting}
                >
                  Back
                </Button>
                <Button
                  color="red"
                  loading={submitting}
                  onClick={() =>
                    runAction(
                      () => postMergeProductDuplicate(pair.id, survivor.id),
                      "Products merged",
                    )
                  }
                >
                  Merge
                </Button>
              </Group>
            </Stack>
          ) : (
            <Group justify="space-between">
              <Button
                variant="default"
                loading={submitting}
                onClick={() =>
                  runAction(
                    () => postDismissProductDuplicate(pair.id),
                    "Marked as different products",
                  )
                }
              >
                Not duplicates
              </Button>
              <Group gap="xs">
                <Button onClick={() => setSurvivorId(products[0].id)}>
                  Keep left
                </Button>
                <Button onClick={() => setSurvivorId(products[1].id)}>
                  Keep right
                </Button>
              </Group>
            </Group>
          )}
        </Stack>
      )}
    </Modal>
  );
}
