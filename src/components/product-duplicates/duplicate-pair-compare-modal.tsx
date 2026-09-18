"use client";

import { useEffect, useState } from "react";
import {
  Anchor,
  Badge,
  Button,
  Card,
  Center,
  Divider,
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
import { getCategoryById } from "@/api-actions/category/get-category";
import { getProductById } from "@/api-actions/product/get-product";
import {
  postDismissProductDuplicate,
  postMergeProductDuplicate,
  postReopenProductDuplicate,
} from "@/api-actions/product-duplicate/product-duplicate-actions";
import { ProductDuplicatePair } from "@/models/dtos/product-duplicate-search-models";
import { ProductModel } from "@/models/product-model";
import { OrderedSpec } from "@/models/product-specs";
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
      {/* `tt="none"` throughout: Mantine uppercases a badge by default, which
        would shout every label and mangle the uuid and the name key.

        The group wraps, so on a narrow modal these stack rather than truncate —
        a name key cut off mid-token would be worse than useless here, since
        comparing the two keys is half of what this modal is for. */}
      <Group gap={4}>
        <Badge variant="light" size="sm" tt="none">
          Brand: {product.brand?.name ?? "—"}
        </Badge>
        <CopyIdBadge id={product.id} label="Copy product ID" />
        <Badge variant="light" size="sm" tt="none">
          Model: {product.model}
        </Badge>
        {/* Monospaced for the same reason the id is, and to match how the score
          breakdown prints the two keys it compared. */}
        <Badge variant="light" size="sm" tt="none" ff="monospace">
          Name key: {product.normalizedName ?? "—"}
        </Badge>
      </Group>
    </Stack>
  );
}

/**
 * The two counts sit on this heading rather than up in the identity block:
 * they describe exactly what the table underneath lists, and they are the
 * numbers the left/right ordering is decided on (see `fullerFirst`), so reading
 * them against the other column is the point.
 */
function ProductOffers({ product }: { product: ProductModel }) {
  return (
    <Stack gap={2}>
      <Group gap="xs">
        <Text size="xs" fw={600}>
          Offers
        </Text>
        <Badge variant="light" size="xs">
          {product.sources?.length ?? 0} listings
        </Badge>
        <Badge variant="light" size="xs">
          {product.offers?.length ?? 0} offers
        </Badge>
      </Group>
      <ProductOfferTable sources={product.sources} />
    </Stack>
  );
}

/** The category's gate tiers, in the order it declares them. */
interface SpecTiers {
  primary: string[];
  matcher: string[];
}

/**
 * Gates first — primary, then matcher — and everything else after the divider,
 * each group by key.
 *
 * The gated specs are the ones that actually moved this pair's score, so they
 * are what a reader is deciding on; the rest is corroboration.
 *
 * Sorting on the key rather than the label is what makes the two columns
 * readable side by side: both sort by the same canonical key, so a spec the two
 * products share lands in the same relative position in each, and the rows the
 * hover ties together are rarely far apart. A label sort would order the
 * columns by translated text and lose that.
 *
 * Without tiers — the category read failed, or has no gates — everything falls
 * into `gated` and the divider does not render, leaving one list by key.
 */
function splitByTier(
  specs: OrderedSpec[],
  tiers: SpecTiers | null
): { gated: OrderedSpec[]; rest: OrderedSpec[] } {
  const byKey = (a: OrderedSpec, b: OrderedSpec) => a.key.localeCompare(b.key);
  if (!tiers) return { gated: [...specs].sort(byKey), rest: [] };

  const rank = (key: string) =>
    tiers.primary.includes(key) ? 0 : tiers.matcher.includes(key) ? 1 : 2;

  return {
    gated: specs
      .filter((spec) => rank(spec.key) < 2)
      .sort((a, b) => rank(a.key) - rank(b.key) || byKey(a, b)),
    rest: specs.filter((spec) => rank(spec.key) === 2).sort(byKey),
  };
}

/**
 * What the two backgrounds in the spec tables mean. Spans both columns, so it
 * reads once for the pair rather than once per product, and carries the "Specs"
 * heading the two lists used to repeat.
 */
function SpecsLegend() {
  return (
    <Group gap="sm" style={{ gridColumn: "1 / -1" }}>
      <Text size="xs" fw={600}>
        Specs
      </Text>
      <Badge color="red" variant="light" size="sm">
        both have it, values differ
      </Badge>
      <Badge color="yellow" variant="light" size="sm">
        only one product has it
      </Badge>
    </Group>
  );
}

/**
 * Every spec is coloured by how it compares with the other product's:
 *
 * - **red** — both publish it and the values differ;
 * - **yellow** — only this product publishes it, so there is nothing to compare;
 * - nothing — both publish it and they agree.
 *
 * The comparison is on the *displayed* value, so what looks the same reads as
 * the same. That makes this a diff of the two tables rather than a view of the
 * gates: a spec the engine tolerates (a weight inside its tolerance, a usage
 * type its hierarchy accepts) still shows red here, because the two shops did
 * print different things. What the engine made of it is in the score breakdown
 * above, with the severity it charged.
 *
 * Hovering a spec lights up the same spec in both columns, which is the only
 * way to read one row across the pair: each product renders its own list, so a
 * shared key sits at a different height in each whenever one publishes a spec
 * the other does not. The hover is matched on the key, never the row position.
 * A row that already carries a comparison colour keeps it and shows the hover
 * as the bold alone — passing the mouse over a difference should not repaint
 * the thing the reader came to see.
 */
function ProductSpecs({
  product,
  otherProduct,
  specTiers,
  hoveredSpec,
  onHoverSpec,
}: {
  product: ProductModel;
  otherProduct: ProductModel;
  specTiers: SpecTiers | null;
  hoveredSpec: string | null;
  onHoverSpec: (specKey: string | null) => void;
}) {
  const specs = product.orderedSpecs ?? [];
  const otherValues = new Map(
    (otherProduct.orderedSpecs ?? []).map((spec) => [
      spec.key,
      formatSpecValue(spec.value),
    ])
  );

  // An empty cell rather than nothing: returning null would leave this grid row
  // with one child, and the other product's specs would slide into this column.
  if (specs.length === 0) return <div />;

  const { gated, rest } = splitByTier(specs, specTiers);

  const renderSpec = (spec: OrderedSpec) => {
    const hovered = hoveredSpec === spec.key;
    const value = formatSpecValue(spec.value);
    const onlyHere = !otherValues.has(spec.key);
    const differs = !onlyHere && otherValues.get(spec.key) !== value;

    const comparisonColor = differs
      ? "var(--mantine-color-red-light)"
      : onlyHere
        ? "var(--mantine-color-yellow-light)"
        : undefined;

    return (
      <Group
        key={spec.key}
        gap={4}
        wrap="nowrap"
        onMouseEnter={() => onHoverSpec(spec.key)}
        onMouseLeave={() => onHoverSpec(null)}
        style={{
          backgroundColor:
            comparisonColor ??
            (hovered ? "var(--mantine-primary-color-light)" : undefined),
          borderRadius: 4,
          // No left padding: it only existed to inset the comparison
          // highlight, and it indented every label away from the heading and
          // the offer table above.
          padding: "2px 6px 2px 0",
        }}
      >
        <Text
          size="xs"
          c="dimmed"
          fw={hovered ? 700 : undefined}
          style={{ minWidth: 110 }}
        >
          {spec.label}
        </Text>
        <Text size="xs" fw={hovered ? 700 : undefined}>
          {value}
        </Text>
      </Group>
    );
  };

  return (
    <Stack gap={2}>
      {gated.map(renderSpec)}
      {/* Only when there is something on each side of it — a product whose
        specs are all gates, or none, should not grow a stray rule. */}
      {gated.length > 0 && rest.length > 0 && <Divider my={4} />}
      {rest.map(renderSpec)}
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
  const [hoveredSpec, setHoveredSpec] = useState<string | null>(null);
  const [specTiers, setSpecTiers] = useState<SpecTiers | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [detailsProductId, setDetailsProductId] = useState<string | null>(null);

  useEffect(() => {
    setProducts(null);
    setSurvivorId(null);
    setConfirmingDismiss(false);
    setHoveredSpec(null);
    setSpecTiers(null);
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

        // Which specs are gates is category config, not product data, so it is
        // a second read. Grouping the spec tables by it is a nicety, and the
        // pair is perfectly usable without it — so this never blocks the modal
        // and never surfaces an error; the tables just keep their plain order.
        const categoryId = left.productCategory?.id;
        if (!categoryId) return;
        getCategoryById(categoryId, { includeConfig: true })
          .then((category) => {
            if (cancelled) return;
            setSpecTiers({
              primary: category.config?.primarySpecs ?? [],
              matcher: category.config?.matcherSpecs ?? [],
            });
          })
          .catch(() => undefined);
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
              <SpecsLegend />
              {products.map((product, index) => (
                <ProductSpecs
                  key={product.id}
                  product={product}
                  otherProduct={products[1 - index]}
                  specTiers={specTiers}
                  hoveredSpec={hoveredSpec}
                  onHoverSpec={setHoveredSpec}
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
