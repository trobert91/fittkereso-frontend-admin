"use client";

import { useEffect, useState } from "react";
import {
  Anchor,
  Badge,
  Button,
  Card,
  Center,
  Group,
  Image,
  Loader,
  Modal,
  SimpleGrid,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { getProductById } from "@/api-actions/product/get-product";
import {
  postDismissProductDuplicate,
  postMergeProductDuplicate,
  postReopenProductDuplicate,
} from "@/api-actions/product-duplicate/product-duplicate-actions";
import { ProductDuplicatePair } from "@/models/dtos/product-duplicate-search-models";
import { ProductModel } from "@/models/product-model";
import { CopyIdBadge } from "@/components/copy-id-badge";
import { ProductDetailsModal } from "@/components/product/details-modal";
import { ProductOfferTable } from "@/components/product/product-offer-table";
import { productImageUrl } from "@/utils/product-image";
import { formatSpecValue } from "./failed-gate-badges";
import { ScoreBreakdown } from "./score-breakdown";

interface DuplicatePairCompareModalProps {
  pair: ProductDuplicatePair | null;
  onClose: () => void;
  onComplete: () => void;
}

/**
 * The two products are laid out section by section rather than column by
 * column — image against image, offers against offers — so each pair of
 * sections shares a grid row and therefore a height. Two independent columns
 * would let a product with four offers push its specs below the other's, which
 * is exactly the comparison this modal exists to make.
 */
function ProductImage({
  product,
  onOpenDetails,
}: {
  product: ProductModel;
  onOpenDetails: (productId: string) => void;
}) {
  const imageUrl = productImageUrl(product);

  return (
    <UnstyledButton
      onClick={() => onOpenDetails(product.id)}
      aria-label={`Open ${product.displayName}`}
    >
      <Card p="xs" radius="md" withBorder h={180} style={{ cursor: "pointer" }}>
        <Center h="100%">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.displayName}
              h={160}
              fit="contain"
            />
          ) : (
            <Text size="sm" c="dimmed">
              No image
            </Text>
          )}
        </Center>
      </Card>
    </UnstyledButton>
  );
}

function ProductIdentity({
  product,
  onOpenDetails,
}: {
  product: ProductModel;
  onOpenDetails: (productId: string) => void;
}) {
  return (
    <Stack gap={4}>
      <Anchor
        component="button"
        type="button"
        onClick={() => onOpenDetails(product.id)}
        size="sm"
        fw={600}
        ta="left"
      >
        {product.displayName}
      </Anchor>
      <Text size="sm" c="blue">
        {product.brand?.name ?? "—"}
      </Text>
      <Group gap={4}>
        <CopyIdBadge id={product.id} label="Copy product ID" />
      </Group>
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
  );
}

function ProductOffers({ product }: { product: ProductModel }) {
  return (
    <Stack gap={2}>
      <Text size="xs" fw={600}>
        Sold in
      </Text>
      <ProductOfferTable sources={product.sources} />
    </Stack>
  );
}

function ProductSpecs({
  product,
  contradictingSpecs,
}: {
  product: ProductModel;
  contradictingSpecs: Set<string>;
}) {
  const specs = product.orderedSpecs ?? [];
  // An empty cell rather than nothing: returning null would leave this grid row
  // with one child, and the other product's specs would slide into this column.
  if (specs.length === 0) return <div />;

  return (
    <Stack gap={2}>
      <Text size="xs" fw={600}>
        Specs
      </Text>
      {specs.map((spec) => (
        <Group
          key={spec.key}
          gap={4}
          wrap="nowrap"
          style={{
            backgroundColor: contradictingSpecs.has(spec.key)
              ? "var(--mantine-color-red-light)"
              : undefined,
            borderRadius: 4,
            // No left padding: it only existed to inset the contradiction
            // highlight, and it indented every label away from the heading and
            // the offer table above.
            padding: "2px 6px 2px 0",
          }}
        >
          <Text size="xs" c="dimmed" style={{ minWidth: 110 }}>
            {spec.label}
          </Text>
          <Text size="xs">{formatSpecValue(spec.value)}</Text>
        </Group>
      ))}
    </Stack>
  );
}

export function DuplicatePairCompareModal({
  pair,
  onClose,
  onComplete,
}: DuplicatePairCompareModalProps) {
  const [products, setProducts] = useState<[ProductModel, ProductModel] | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [survivorId, setSurvivorId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [detailsProductId, setDetailsProductId] = useState<string | null>(null);

  useEffect(() => {
    setProducts(null);
    setSurvivorId(null);
    setDetailsProductId(null);
    if (!pair) return;

    let cancelled = false;
    setLoading(true);
    Promise.all([
      getProductById(pair.productAId),
      getProductById(pair.productBId),
    ])
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
    (pair?.failedGates ?? []).flatMap((gate) => (gate.spec ? [gate.spec] : []))
  );
  const survivor = products?.find((product) => product.id === survivorId);
  const mergedAway = products?.find((product) => product.id !== survivorId);

  return (
    <>
      <Modal
        opened={!!pair}
        onClose={() => !submitting && onClose()}
        title="Compare possible duplicates"
        centered
        size="90%"
      >
        {loading && (
          <Center py="xl">
            <Loader />
          </Center>
        )}

        {!loading && pair && products && (
          <Stack gap="md">
            <ScoreBreakdown pair={pair} products={products} />

            {/* Each section is one grid row across both products, so the two
              sides always start level however many offers or specs either
              carries. */}
            <SimpleGrid cols={2} spacing="lg" verticalSpacing="sm">
              {products.map((product) => (
                <ProductImage
                  key={product.id}
                  product={product}
                  onOpenDetails={setDetailsProductId}
                />
              ))}
              {products.map((product) => (
                <ProductIdentity
                  key={product.id}
                  product={product}
                  onOpenDetails={setDetailsProductId}
                />
              ))}
              {products.map((product) => (
                <ProductOffers key={product.id} product={product} />
              ))}
              {products.map((product) => (
                <ProductSpecs
                  key={product.id}
                  product={product}
                  contradictingSpecs={contradictingSpecs}
                />
              ))}
            </SimpleGrid>

            {survivor && mergedAway ? (
              <Stack gap="xs">
                <Text size="sm">
                  Keep <b>{survivor.displayName}</b>?{" "}
                  <b>{mergedAway.displayName}</b> is deleted, and its listings,
                  offers, images, aliases and price history move to the product
                  you keep.
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
                        "Products merged"
                      )
                    }
                  >
                    Merge
                  </Button>
                </Group>
              </Stack>
            ) : (
              <Stack gap="xs">
                {/* A dismissal records what someone thought at the time, not a
                  verdict — so it says so and leaves every action available. */}
                {pair.dismissedAt && (
                  <Text size="sm" c="dimmed">
                    Dismissed as two different products on{" "}
                    {new Date(pair.dismissedAt).toLocaleDateString()}. You can
                    still merge them, or put the pair back in the queue.
                  </Text>
                )}
                <Group justify="space-between">
                  {pair.dismissedAt ? (
                    <Button
                      variant="default"
                      loading={submitting}
                      onClick={() =>
                        runAction(
                          () => postReopenProductDuplicate(pair.id),
                          "Back in the queue"
                        )
                      }
                    >
                      Reopen
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      loading={submitting}
                      onClick={() =>
                        runAction(
                          () => postDismissProductDuplicate(pair.id),
                          "Marked as different products"
                        )
                      }
                    >
                      Not duplicates
                    </Button>
                  )}
                  <Group gap="xs">
                    <Button onClick={() => setSurvivorId(products[0].id)}>
                      Keep left
                    </Button>
                    <Button onClick={() => setSurvivorId(products[1].id)}>
                      Keep right
                    </Button>
                  </Group>
                </Group>
              </Stack>
            )}
          </Stack>
        )}
      </Modal>

      {/* Above the compare modal it is opened from. */}
      <ProductDetailsModal
        productId={detailsProductId}
        opened={!!detailsProductId}
        onClose={() => setDetailsProductId(null)}
        zIndex={400}
      />
    </>
  );
}
