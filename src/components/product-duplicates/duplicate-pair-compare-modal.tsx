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
import { IoMdCheckmark } from "react-icons/io";
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
 *
 * Choosing a survivor happens in the product's own column, on the "Keep this"
 * button above its image, rather than through a "Keep left"/"Keep right" pair
 * in the footer — those made the reader map a side onto a column while the
 * evidence they had just read sat under one of them. The buttons are their own
 * grid row for the same reason every other section is: two columns of
 * independent height would not keep them level.
 *
 * Both verdicts confirm in the place they were started: "Keep this" becomes
 * Confirm/Cancel in its own column, and the header's dismiss does the same
 * beside the title. Neither is a dialog on top of a dialog, and neither leaves
 * the reader hunting for where the action they just chose went.
 */

/**
 * "Keep this" until it is pressed, then Confirm/Cancel in the same place. The
 * other column keeps its "Keep this" live throughout, so changing your mind is
 * one click rather than Cancel and then choose again.
 */
function ProductKeepAction({
  product,
  selected,
  submitting,
  onKeep,
  onCancel,
  onConfirm,
}: {
  product: ProductModel;
  selected: boolean;
  submitting: boolean;
  onKeep: (productId: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (selected) {
    return (
      // The pair spans exactly the width "Keep this" did, so the two column
      // headers stay level — but Confirm takes what it needs and Cancel only
      // what it needs, rather than splitting in half and leaving Cancel as wide
      // as a sentence.
      <Group gap="xs" wrap="nowrap">
        <Button
          color="red"
          loading={submitting}
          onClick={onConfirm}
          leftSection={<IoMdCheckmark size={16} />}
          style={{ flex: 1 }}
        >
          Confirm, merge into this
        </Button>
        <Button variant="default" disabled={submitting} onClick={onCancel}>
          Cancel
        </Button>
      </Group>
    );
  }

  return (
    <Button fullWidth disabled={submitting} onClick={() => onKeep(product.id)}>
      Keep this
    </Button>
  );
}

function ProductImage({
  product,
  selected,
  onOpenDetails,
}: {
  product: ProductModel;
  selected: boolean;
  onOpenDetails: (productId: string) => void;
}) {
  const imageUrl = productImageUrl(product);

  return (
    <UnstyledButton
      onClick={() => onOpenDetails(product.id)}
      aria-label={`Open ${product.displayName}`}
    >
      <Card
        p="xs"
        radius="md"
        withBorder
        h={180}
        style={{
          cursor: "pointer",
          borderColor: selected
            ? "var(--mantine-primary-color-filled)"
            : undefined,
          borderWidth: selected ? 2 : undefined,
        }}
      >
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

/**
 * The fuller product first, so it is always the left column.
 *
 * A pair's two ids are stored sorted as strings — the table checks
 * `productAId < productBId` — so which one arrives as A is an accident of UUID
 * ordering. Putting the product with more listings, then more offers, on the
 * left makes the columns mean something: the left is the one that has gathered
 * more of the market, and in nearly every merge it is the one worth keeping.
 * The id is the last tiebreak only so a pair never swaps sides between opens.
 */
function fullerFirst(a: ProductModel, b: ProductModel): number {
  return (
    (b.sources?.length ?? 0) - (a.sources?.length ?? 0) ||
    (b.offers?.length ?? 0) - (a.offers?.length ?? 0) ||
    a.id.localeCompare(b.id)
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
  const [confirmingDismiss, setConfirmingDismiss] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [detailsProductId, setDetailsProductId] = useState<string | null>(null);

  useEffect(() => {
    setProducts(null);
    setSurvivorId(null);
    setConfirmingDismiss(false);
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
        // Sorted here rather than at each render, so every section — images,
        // identity, offers, specs, the keep buttons — reads the same order.
        const [left, right] = [productA, productB].sort(fullerFirst);
        setProducts([left, right]);
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
        // Mantine's header is `space-between` and its title does not grow, so
        // without this the title keeps its natural width and the action lands
        // beside the heading instead of out at the close button.
        styles={{ title: { flex: 1 } }}
        title={
          <Group justify="space-between" wrap="nowrap" gap="md" pr="sm">
            <Text fw={600}>Compare possible duplicates</Text>
            {/* The verdict that is *not* a merge: it belongs beside the title
              rather than under the evidence, because "these are two different
              products" is a judgement on the pair as a whole, while keeping one
              is a choice between the two columns.

              Reopen is deliberately the one action with no confirm step — it
              only puts the pair back in the queue, and it is the undo for
              having dismissed it in the first place. */}
            {pair &&
              (pair.dismissedAt ? (
                <Button
                  size="xs"
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
              ) : confirmingDismiss ? (
                <Group gap="xs" wrap="nowrap">
                  <Button
                    size="xs"
                    loading={submitting}
                    leftSection={<IoMdCheckmark size={14} />}
                    onClick={() =>
                      runAction(
                        () => postDismissProductDuplicate(pair.id),
                        "Marked as different products"
                      )
                    }
                  >
                    Confirm, dismiss
                  </Button>
                  <Button
                    size="xs"
                    variant="default"
                    disabled={submitting}
                    onClick={() => setConfirmingDismiss(false)}
                  >
                    Cancel
                  </Button>
                </Group>
              ) : (
                <Button
                  size="xs"
                  variant="default"
                  disabled={submitting}
                  onClick={() => {
                    setConfirmingDismiss(true);
                    setSurvivorId(null);
                  }}
                >
                  Dismiss, separate products
                </Button>
              ))}
          </Group>
        }
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
                <ProductKeepAction
                  key={product.id}
                  product={product}
                  selected={survivorId === product.id}
                  submitting={submitting}
                  onKeep={(productId) => {
                    setSurvivorId(productId);
                    setConfirmingDismiss(false);
                  }}
                  onCancel={() => setSurvivorId(null)}
                  onConfirm={() =>
                    runAction(
                      () => postMergeProductDuplicate(pair.id, product.id),
                      "Products merged"
                    )
                  }
                />
              ))}
              {products.map((product) => (
                <ProductImage
                  key={product.id}
                  product={product}
                  selected={survivorId === product.id}
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
              // Confirm and Cancel live in the kept product's own column now,
              // so this is only the warning about what Confirm destroys — a
              // second Merge button down here would be the same action twice.
              <Text size="sm">
                Keeping <b>{survivor.displayName}</b>.{" "}
                <b>{mergedAway.displayName}</b> is deleted, and its listings,
                offers, images, aliases and price history move to the product you
                keep.
              </Text>
            ) : confirmingDismiss ? (
              // What Confirm actually does, in the same place the merge warning
              // appears — the pair stops coming back rather than being deleted,
              // which is the part worth knowing before pressing it.
              <Text size="sm">
                Recording these as two different products. The pair leaves the
                queue and the nightly scan will not raise it again, though you
                can reopen it here at any time.
              </Text>
            ) : (
              // A dismissal records what someone thought at the time, not a
              // verdict — so it says so and leaves every action available. The
              // acting on it is in the header; this is only the note.
              pair.dismissedAt && (
                <Text size="sm" c="dimmed">
                  Dismissed as two different products on{" "}
                  {new Date(pair.dismissedAt).toLocaleDateString()}. You can
                  still merge them, or put the pair back in the queue.
                </Text>
              )
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
