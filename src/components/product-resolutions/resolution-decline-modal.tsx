"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Anchor,
  Badge,
  Button,
  Card,
  Group,
  LoadingOverlay,
  Modal,
  Portal,
  Stack,
  Text,
  Textarea,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IoInformationCircleOutline, IoWarning } from "react-icons/io5";
import { LuExternalLink } from "react-icons/lu";
import {
  postDeclineResolution,
  ResolutionAvailableAction,
  ResolutionListItem,
} from "@/api-actions/product/product-resolutions";
import { ProductModel } from "@/models/product-model";
import { ProductTable } from "@/components/product/product-table";
import { CORRECTION_DESCRIPTIONS, CORRECTION_LABELS } from "./resolution-labels";

/**
 * Declining is where a wrong decision actually gets corrected, so each of the
 * three corrections gets its own confirmation showing exactly what will happen:
 *
 * - `dismiss` — records the disagreement, catalog untouched.
 * - `split`   — names the listings that will be carved out. This is also how a
 *               merge is undone, so the copy says so when it is one.
 * - `merge_into` — pick the target product; the backend's suggestion (the
 *               product these listings were split out of) is offered as a
 *               one-click shortcut before the full picker.
 */
export function ResolutionDeclineModal({
  item,
  correction,
  note: inheritedNote,
  onClose,
  onUpdated,
}: {
  item: ResolutionListItem;
  correction: ResolutionAvailableAction | null;
  note?: string;
  onClose: () => void;
  onUpdated: (updated: ResolutionListItem) => void;
}) {
  const [note, setNote] = useState(inheritedNote ?? "");
  const [target, setTarget] = useState<ProductModel | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (correction) {
      setNote(inheritedNote ?? "");
      setTarget(null);
    }
  }, [correction, inheritedNote]);

  if (!correction?.correction) return null;

  const kind = correction.correction;
  const { state, resolution } = item;

  const submit = async (targetProductId?: string) => {
    setLoading(true);
    try {
      const updated = await postDeclineResolution(resolution.id, {
        correction: kind,
        targetProductId,
        note: note || undefined,
      });
      onUpdated(updated);
      notifications.show({
        color: "green",
        title: "Declined",
        message:
          kind === "dismiss"
            ? "Recorded your disagreement. The catalog is unchanged."
            : kind === "split"
              ? "The listings were carved out onto a new product."
              : "The product was merged into your chosen target.",
      });
    } catch (err) {
      notifications.show({
        color: "red",
        title: "Decline failed",
        message: err instanceof Error ? err.message : "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  const reversingAMerge = state.lastPerformed?.action.kind === "merge";
  const splitCount = state.splittableSourceRecordIds.length;

  // The picker only knows what to pre-filter by if we can see the product the
  // listing currently sits on.
  const listingProduct =
    resolution.sourceRecord?.model ?? resolution.resolvedProduct;

  return (
    <Portal reuseTargetNode={false}>
      <Modal
        opened={!!correction}
        onClose={() => !loading && onClose()}
        title={CORRECTION_LABELS[kind]}
        centered
        size={kind === "merge_into" ? "90%" : "lg"}
      >
        <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ blur: 2 }} />

        <Stack gap="md">
          <Text size="sm" c="dimmed">
            {CORRECTION_DESCRIPTIONS[kind]}
          </Text>

          {kind === "split" && (
            <SplitSummary
              item={item}
              count={splitCount}
              reversingAMerge={reversingAMerge}
            />
          )}

          {kind === "merge_into" && (
            <MergeIntoPicker
              suggestedTargetProductId={correction.suggestedTargetProductId}
              listingProduct={listingProduct}
              target={target}
              onSelect={setTarget}
              onClear={() => setTarget(null)}
              onMergeBack={() => submit(correction.suggestedTargetProductId)}
            />
          )}

          <Textarea
            label="Note (optional)"
            placeholder="Why is this wrong? Recorded in the decision log."
            value={note}
            onChange={(event) => setNote(event.currentTarget.value)}
            autosize
            minRows={2}
          />

          <Group justify="flex-end">
            <Button variant="default" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              color="red"
              loading={loading}
              disabled={kind === "merge_into" && !target}
              onClick={() => submit(target?.id)}
            >
              {kind === "dismiss"
                ? "Record disagreement"
                : kind === "split"
                  ? reversingAMerge
                    ? "Undo the merge"
                    : "Split out"
                  : "Merge and delete source"}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Portal>
  );
}

/** Names the exact listings a split will move — the split is only reversible
 *  and only meaningful in terms of these, so they are shown, not counted. */
function SplitSummary({
  item,
  count,
  reversingAMerge,
}: {
  item: ResolutionListItem;
  count: number;
  reversingAMerge: boolean;
}) {
  const { resolution, state } = item;

  // The row carries its own listing in full; a merge reversal names ids the row
  // does not necessarily have objects for, so those show as ids.
  const own = resolution.sourceRecord;
  const rows = state.splittableSourceRecordIds.map((id) =>
    own?.id === id
      ? { id, url: own.url, source: own.source?.name }
      : { id, url: undefined, source: undefined },
  );

  if (count === 0) {
    return (
      <Alert color="red" icon={<IoWarning size={16} />}>
        There is nothing left to split out. This usually means the listings have
        already been moved elsewhere.
      </Alert>
    );
  }

  return (
    <Stack gap="xs">
      <Alert
        color={reversingAMerge ? "orange" : "blue"}
        icon={<IoInformationCircleOutline size={16} />}
      >
        {reversingAMerge
          ? `This undoes the merge: the ${count} listing${count === 1 ? "" : "s"} it moved will be carved back out onto a new product, whose specs and identity are rebuilt from their scraped data.`
          : `${count} listing${count === 1 ? "" : "s"} will move onto a brand-new product, built from ${count === 1 ? "its" : "their"} scraped data.`}
      </Alert>

      <Card withBorder p="xs" radius="sm">
        <Stack gap={4}>
          {rows.map((row) => (
            <Group key={row.id} gap="xs" wrap="nowrap">
              {row.source && (
                <Badge size="xs" variant="light" tt="none">
                  {row.source}
                </Badge>
              )}
              {row.url ? (
                <Anchor href={row.url} target="_blank" size="xs" truncate>
                  {row.url}
                </Anchor>
              ) : (
                <Text size="xs" c="dimmed">
                  listing {row.id}
                </Text>
              )}
            </Group>
          ))}
        </Stack>
      </Card>
    </Stack>
  );
}

function MergeIntoPicker({
  suggestedTargetProductId,
  listingProduct,
  target,
  onSelect,
  onClear,
  onMergeBack,
}: {
  suggestedTargetProductId?: string;
  listingProduct?: ProductModel;
  target: ProductModel | null;
  onSelect: (product: ProductModel) => void;
  onClear: () => void;
  onMergeBack: () => void;
}) {
  if (target) {
    return (
      <Card withBorder p="sm" radius="sm">
        <Group justify="space-between" wrap="nowrap">
          <Stack gap={2}>
            <Text size="xs" c="dimmed">
              Merging
            </Text>
            <Text size="sm" fw={600} c="red">
              {listingProduct?.displayName ?? "this product"}
            </Text>
            <Text size="xs" c="dimmed">
              into
            </Text>
            <Group gap="xs">
              <Text size="sm" fw={600} c="green">
                {target.displayName}
              </Text>
              <Anchor href={`/products/${target.id}`} target="_blank">
                <LuExternalLink size={12} />
              </Anchor>
            </Group>
          </Stack>
          <Button variant="subtle" size="compact-xs" onClick={onClear}>
            Change target
          </Button>
        </Group>
      </Card>
    );
  }

  return (
    <Stack gap="sm">
      {suggestedTargetProductId && (
        <Alert color="blue" icon={<IoInformationCircleOutline size={16} />}>
          <Group justify="space-between" wrap="nowrap">
            <Text size="sm">
              These listings were split out of an existing product. Merging them
              back there is probably what you want.
            </Text>
            <Button size="compact-xs" variant="light" onClick={onMergeBack}>
              Merge back
            </Button>
          </Group>
        </Alert>
      )}

      <Text size="sm" fw={500}>
        Pick the target product
      </Text>
      <ProductTable
        onSelectProduct={onSelect}
        showProductDetailsLink={false}
        initialSearchTerm={listingProduct?.displayName}
        initialCategoryId={listingProduct?.productCategory?.id}
        initialBrandId={listingProduct?.brand?.id}
      />
    </Stack>
  );
}
